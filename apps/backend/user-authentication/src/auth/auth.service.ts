import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private rolesService: RolesService,
  ) { }

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }
    console.log('validate1', cin, '  ', password);
    const user = await this.usersService.findByCin(cin);
    console.log('before finding user', user);
    if (!user) {
      return null;
    }

    if ((user as any).status && (user as any).status !== 'approved') {
      console.log('User not approved, status =', (user as any).status);
      return null;
    }

    const storedHash = (user as any).motDePasse || (user as any).password;
    if (!storedHash) {
      console.log('No stored password hash for user', cin);
      return null;
    }

    console.log('finding user', user);
    console.log('find by cin');
    if (await bcrypt.compare(password, storedHash)) {
      const userObj = user.toObject ? user.toObject() : user;
      const { password: _p, motDePasse: _m, ...result } = userObj as any;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log('Login user:', user);
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    console.log('JWT Payload:', payload);

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

    // Récupérer le rôle demandé depuis la base (plus fiable que des IDs hardcodés)
    const normalizedRole = (role || 'user').trim();
    const roleDoc = await this.rolesService.findByName(normalizedRole);
    const fallbackRoleDoc = roleDoc ? null : await this.rolesService.findByName('user');
    const resolvedRole = roleDoc || fallbackRoleDoc;
    if (!resolvedRole) {
      throw new BadRequestException('Aucun rôle valide trouvé en base (seed roles manquant)');
    }

    const userData = {
      cin,
      password: hashedPassword,
      lastname,
      firstname,
      role: resolvedRole._id,
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
      motDePasse: hashedPassword,
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

  async rejectUser(userId: string, reason?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'pending') {
      throw new BadRequestException('User is not in pending status');
    }

    // Marquer l'utilisateur comme rejeté
    const updatedUser = await this.usersService.update(userId, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectReason: reason || 'Aucun motif spécifié',
    });

    console.log('🔍 DEBUG: Vérification email pour utilisateur rejeté...');
    console.log('🔍 DEBUG: updatedUser:', updatedUser);
    console.log('🔍 DEBUG: updatedUser.email:', updatedUser?.email);

    // Envoyer un email de rejet si l'utilisateur a un email
    if (updatedUser && updatedUser.email) {
      console.log('📧 ENVOI EMAIL REJET: Envoi en cours à', updatedUser.email);
      try {
        await this.emailService.sendRejectionEmail(
          updatedUser.email,
          updatedUser.firstname,
          updatedUser.lastname,
          updatedUser.cin,
          reason || 'Aucun motif spécifié',
        );
        console.log('✅ EMAIL DE REJET ENVOYÉ avec succès à', updatedUser.email);
      } catch (error) {
        console.error('❌ Failed to send rejection email:', error);
      }
    } else {
      console.log("⚠️ PAS D'EMAIL: Utilisateur sans adresse email");
    }

    return updatedUser;
  }
}

