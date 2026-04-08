import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  constructor(private configService: ConfigService) {}

  async validateRecaptcha(token: string): Promise<boolean> {
    const secretKey = this.configService.get('RECAPTCHA_SECRET_KEY');
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return false;
    }

    if (!token) {
      return false;
    }

    try {
      const response = await axios.post<{ success: boolean }>(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
        },
      );

      return response.data?.success === true;
    } catch (error) {
      console.error('Recaptcha validation error:', error);
      return false;
    }
  }
}