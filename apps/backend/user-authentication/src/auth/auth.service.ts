import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * ====================================================
   * VALIDATION reCAPTCHA - ACTIVÉE
   * ====================================================
   */
  async validateRecaptcha(token: string): Promise<boolean> {
    try {
      const secretKey = this.configService.get('RECAPTCHA_SECRET_KEY');
      if (!secretKey) {
        console.log('❌ RECAPTCHA_SECRET_KEY not configured');
        return false;
      }

      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
        },
      );

      console.log('🔐 reCAPTCHA validation result:', response.data.success);
      return response.data.success;
    } catch (error) {
      console.error('❌ reCAPTCHA validation error:', error);
      return false;
    }
  }

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }
    console.log('🔍 validateUser:', cin);
    const user = await this.usersService.findByCin(cin);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return null;
    }

    if ((user as any).status && (user as any).status !== 'approved') {
      console.log('❌ User not approved, status =', (user as any).status);
      return null;
    }

    const storedHash = (user as any).password;
    if (!storedHash) {
      console.log('❌ No stored password hash for user', cin);
      return null;
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('📊 Password match:', isMatch ? '✅' : '❌');
    
    if (isMatch) {
      const userObj = user.toObject ? user.toObject() : user;
      const { password: _p, ...result } = userObj as any;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log('🔐 Login user:', user.cin);
    
    const payload = {
      cin: user.cin,
      sub: user._id,
      role: user.role,
    };
    console.log('📦 JWT Payload:', payload);

    const userData = user.toObject ? user.toObject() : user;

    return {
      access_token: this.jwtService.sign(payload),
      id: userData._id,
      cin: userData.cin,
      lastname: userData.lastname,
      firstname: userData.firstname,
      role: userData.role || null,
    };
  }

  async register(
    cin: string,
    password: string,
    firstname: string,
    lastname: string,
    role: string,
    email?: string,
    telephone?: string,
    departement?: string,
    address?: string,
  ) {
    console.log('🔍 DEBUG register appelé avec:', {
      cin,
      password,
      firstname,
      lastname,
      role,
      email,
      telephone,
      departement,
      address,
    });

    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const userData = {
      cin,
      password: hashedPassword,
      lastname,
      firstname,
      role,
      email: email || address,
      telephone,
      departement,
      address: address,
      status: 'pending',
    };

    console.log('🔍 DEBUG userData à créer:', userData);

    const result = await this.usersService.create(userData);
    console.log('🔍 DEBUG utilisateur créé:', result);
    return result;
  }

  async approveUser(userId: string, password: string, adminId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'pending') {
      throw new BadRequestException('User is not in pending status');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.usersService.update(userId, {
      password: hashedPassword,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    console.log('🔍 DEBUG: Vérification email pour utilisateur approuvé...');
    console.log('🔍 DEBUG: updatedUser:', updatedUser);
    console.log('🔍 DEBUG: updatedUser.email:', updatedUser?.email);

    if (updatedUser && updatedUser.email) {
      console.log('📧 ENVOI EMAIL: Envoi en cours à', updatedUser.email);
      try {
        await this.emailService.sendApprovalEmail(
          updatedUser.email,
          updatedUser.firstname,
          updatedUser.lastname,
          updatedUser.cin,
          password,
        );
        console.log('✅ EMAIL ENVOYÉ avec succès à', updatedUser.email);
      } catch (error) {
        console.error('❌ Failed to send approval email:', error);
      }
    } else {
      console.log("⚠️ PAS D'EMAIL: Utilisateur sans adresse email");
    }

    return updatedUser;
  }
}