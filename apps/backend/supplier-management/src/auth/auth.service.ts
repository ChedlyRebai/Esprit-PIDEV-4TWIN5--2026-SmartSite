import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Pour l'instant on valide juste le token, pas de lookup user ici
  // Le guard va appeler validateUser qui regarde juste le token
  async validateUserPayload(payload: any) {
    return payload;
  }
}
