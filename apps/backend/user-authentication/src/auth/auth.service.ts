import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}

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

      console.log('🔐 reCAPTCHA validation result:', (response.data as any).success);
      return (response.data as any).success;
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
    const sessionId = randomUUID();
    return {
      access_token: this.jwtService.sign(payload),
      id: userData._id,
      cin: userData.cin,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || null,
      firstLogin: userData.firstLogin,
      session_id: sessionId,
    };
  }

  async register(
    cin: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    telephone?: string,
    departement?: string,
    address?: string,
    role?: string,
    companyName?: string,
  ) {
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const normalizedRole = (role || 'user').trim();
    const roleDoc = await this.rolesService.findByName(normalizedRole);
    const fallbackRoleDoc = roleDoc
      ? null
      : await this.rolesService.findByName('user');
    const resolvedRole = roleDoc || fallbackRoleDoc;
    if (!resolvedRole) {
      throw new BadRequestException(
        'Aucun rôle valide trouvé en base (seed roles manquant)',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const userData: Record<string, unknown> = {
      cin,
      firstName,
      lastName,
      role: resolvedRole._id,
      email: email || '',
      phoneNumber: telephone,
      departement,
      address: address || '',
      companyName,
      status: 'pending',
      emailVerified: false,
      emailVerificationOtp: otp,
      otpExpiresAt,
    };
    if (hashedPassword) {
      userData.password = hashedPassword;
    }

    const result = await this.usersService.create(userData);

    if (result && result.email) {
      try {
        await this.emailService.sendOTPEmail(
          result.email,
          result.firstName,
          otp,
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'OTP:", error);
      }
    }

    return result;
  }

  async verifyOTP(cin: string, otp: string) {
    const user = await this.usersService.findByCin(cin);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!(user as any).emailVerificationOtp) {
      throw new BadRequestException('No OTP found for this user');
    }

    if ((user as any).otpExpiresAt && new Date() > (user as any).otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    if ((user as any).emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const updatedUser = await this.usersService.update((user as any)._id.toString(), {
      emailVerified: true,
      emailVerificationOtp: null,
      otpExpiresAt: null,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to update user');
    }

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: (updatedUser as any)._id,
        cin: (updatedUser as any).cin,
        firstName: (updatedUser as any).firstName,
        lastName: (updatedUser as any).lastName,
        email: (updatedUser as any).email,
        emailVerified: (updatedUser as any).emailVerified,
      },
    };
  }

  async resendOTP(cin: string) {
    const user = await this.usersService.findByCin(cin);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.update((user as any)._id.toString(), {
      emailVerificationOtp: otp,
      otpExpiresAt,
    });

    if ((user as any).email) {
      try {
        await this.emailService.sendOTPEmail((user as any).email, (user as any).firstName, otp);
      } catch (error) {
        console.error('Erreur lors du renvoi de l OTP:', error);
        throw new BadRequestException('Failed to send OTP email');
      }
    } else {
      throw new BadRequestException('No email found for this user');
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  async approveUser(userId: string, password: string, adminId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).status && (user as any).status !== 'pending') {
      throw new BadRequestException(
        "L'utilisateur n'est pas en attente d'approbation",
      );
    }

    const plainPassword = password?.trim() || '';
    const updatePayload: Record<string, unknown> = {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
    };
    if (plainPassword) {
      updatePayload.password = plainPassword;
    }

    const updatedUser = await this.usersService.update(userId, updatePayload);
    if (!updatedUser) {
      throw new BadRequestException("Échec de l'approbation");
    }

    if ((updatedUser as any).email && plainPassword) {
      try {
        await this.emailService.sendApprovalEmail(
          (updatedUser as any).email,
          (updatedUser as any).firstName,
          (updatedUser as any).lastName,
          (updatedUser as any).cin,
          plainPassword,
        );
      } catch (error) {
        console.error("Échec envoi email d'approbation (compte déjà approuvé):", error);
      }
    }

    return updatedUser;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset code will be sent' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.update((user as any)._id.toString(), {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiresAt,
    });

    if ((user as any).email) {
      try {
        await this.emailService.sendOTPEmail(
          (user as any).email,
          (user as any).firstName || 'Utilisateur',
          resetCode,
        );
      } catch (error) {
        console.error('Failed to send reset email:', error);
      }
    }

    return { message: 'If the email exists, a reset code will be sent' };
  }

  async rejectUser(userId: string, reason?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).status !== 'pending') {
      throw new BadRequestException('User is not in pending status');
    }

    const updatedUser = await this.usersService.update(userId, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectReason: reason || 'Aucun motif spécifié',
    });

    if ((updatedUser as any)?.email) {
      try {
        await this.emailService.sendRejectionEmail(
          (updatedUser as any).email,
          (updatedUser as any).firstName,
          (updatedUser as any).lastName,
          (updatedUser as any).cin,
          reason || 'Aucun motif spécifié',
        );
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }
    }

    return updatedUser;
  }
}