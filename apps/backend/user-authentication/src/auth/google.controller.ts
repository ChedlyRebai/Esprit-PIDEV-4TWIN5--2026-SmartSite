import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class GoogleController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if ((req.user as any)?.error === 'USER_NOT_FOUND') {
        const user = req.user as any;
        const params = new URLSearchParams({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          error: 'no_account',
          google: 'true',
        });
        return res.redirect(`${frontendUrl}/register?${params.toString()}`);
      }

      if ((req.user as any)?.status && (req.user as any)?.status !== 'approved') {
        return res.redirect(`${frontendUrl}/login?error=pending_approval`);
      }

      if ((req.user as any)?.access_token) {
        const { access_token, user } = req.user as any;
        const userStr = encodeURIComponent(JSON.stringify(user));
        return res.redirect(`${frontendUrl}/google-callback?token=${access_token}&user=${userStr}`);
      }

      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}