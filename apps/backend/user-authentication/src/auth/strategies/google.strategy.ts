import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'dummy-client-id',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'dummy-client-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    try {
      const { name, emails } = profile;
      const email = emails[0].value;

      console.log('🔍 Google OAuth validation for:', email);

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        console.log('⏳ Nouvel utilisateur Google - création');
        const nameObj = name || {};
        user = await this.usersService.create({
          firstName: nameObj.givenName || 'Google',
          lastName: nameObj.familyName || 'User',
          cin: `GOOGLE_${Date.now()}`,
          email: email,
          password: undefined,
          status: 'approved',
          emailVerified: true,
          role: 'client',
        });
      } else {
        console.log('✅ Utilisateur existant trouvé');
      }

      if (user && (user as any).status !== 'approved') {
        console.log('⏳ Compte en attente d\'approbation');
        return { 
          id: (user as any)._id,
          email: (user as any).email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          status: (user as any).status 
        };
      }

      const payload = {
        email: (user as any).email,
        sub: (user as any)._id,
        role: (user as any).role,
      };

      const token = this.jwtService.sign(payload);
      console.log('🔑 Token JWT généré pour:', (user as any).email);

      return {
        access_token: token,
        user: {
          id: (user as any)._id,
          email: (user as any).email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          cin: (user as any).cin,
          role: (user as any).role,
        },
      };
    } catch (error) {
      console.error('❌ Google strategy error:', error);
      throw error;
    }
  }
}