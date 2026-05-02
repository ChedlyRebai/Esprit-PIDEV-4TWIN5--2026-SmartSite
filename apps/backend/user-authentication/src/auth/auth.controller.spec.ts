import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(() => {
    const mockAuditLogsService = { createLog: jest.fn(), findLatestLogin: jest.fn() } as any;
    controller = new AuthController(mockAuthService as any, mockAuditLogsService);
    authService = mockAuthService as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // describe('login', () => {
  //   it('should call authService.login with user data', async () => {
  //     const mockUser = {
  //       _id: '123',
  //       cin: '12345678',
  //       nom: 'Test',
  //       prenom: 'User',
  //     };
  //     const mockToken = { access_token: 'token123', user: mockUser };
  //     mockAuthService.login.mockResolvedValue(mockToken);

  //     const request = { user: mockUser };
  //     const result = await controller.login(request);
  //     expect(result).toEqual(mockToken);
  //     expect(authService.login).toHaveBeenCalledWith(mockUser);
  //   });
  // });

  describe('register', () => {
    it('should call authService.register and return success message', async () => {
      const registerDto = {
        cin: '87654321',
        password: 'password123',
        nom: 'New',
        prenom: 'User',
      };
      const newUser = { _id: '456', ...registerDto };
      mockAuthService.register.mockResolvedValue(newUser);

      const result = await controller.register(registerDto);
      expect(result.message).toBe('User registered successfully');
  //    expect(result.user.cin).toBe(registerDto.cin);
    });

    it('should handle registration error', async () => {
      const registerDto = {
        cin: '12345678',
        password: 'password123',
        nom: 'Existing',
        prenom: 'User',
      };
      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow('User already exists');
    });
  });

    describe('login', () => {
      it('should throw UnauthorizedException and log failed attempt when validation fails', async () => {
        const loginDto = { cin: '11111111', password: 'bad' };
        const mockReq: any = { ip: '1.2.3.4' };
        mockAuthService.validateUser.mockResolvedValue(null);

        const mockAudit = (controller as any).auditLogsService;

        await expect(controller.login(loginDto as any, mockReq)).rejects.toThrow();
        expect(mockAudit.createLog).toHaveBeenCalled();
      });

      it('should return login result and log success', async () => {
        const loginDto = { cin: '22222222', password: 'good' };
        const mockReq: any = { ip: '5.6.7.8' };
        const mockUser = { _id: 'u1', cin: '22222222', firstName: 'A', lastName: 'B', role: { name: 'admin' } };
        const tokenResult = { access_token: 'tok', session_id: 'sess1' };

        mockAuthService.validateUser.mockResolvedValue(mockUser);
        mockAuthService.login.mockResolvedValue(tokenResult);

        const mockAudit = (controller as any).auditLogsService;

        const res = await controller.login(loginDto as any, mockReq as any);
        expect(res).toEqual(tokenResult);
        expect(mockAudit.createLog).toHaveBeenCalled();
      });
    });

    
    describe('logout', () => {
      it('should track logout and return message', async () => {
        const body = { sessionId: 'sess1' };
        const req: any = { user: { sub: 'u1' }, ip: '1.1.1.1' };
        const mockAudit = (controller as any).auditLogsService;
        mockAudit.findLatestLogin.mockResolvedValue({ createdAt: new Date(Date.now() - 2000) });

        const res = await controller.logout(body as any, req as any);
        expect(res).toHaveProperty('message');
        expect(mockAudit.createLog).toHaveBeenCalled();
      });
    });

    describe('approve/reject and misc endpoints', () => {
      it('should approve user and log', async () => {
        const req: any = { user: { sub: 'adminId' }, ip: '1.1.1.1' };
        mockAuthService.approveUser = jest.fn().mockResolvedValue({ _id: 'u2' });

        const res = await controller.approveUser('u2', { password: 'p' } as any, req as any);
        expect(res).toHaveProperty('message');
      });

      it('should reject user and log', async () => {
        const req: any = { user: { sub: 'adminId' }, ip: '1.1.1.1' };
        mockAuthService.rejectUser = jest.fn().mockResolvedValue({ _id: 'u3' });

        const res = await controller.rejectUser('u3', { reason: 'no' } as any, req as any);
        expect(res).toHaveProperty('message');
      });

      it('should proxy OTP and reset endpoints to service', async () => {
        mockAuthService.verifyOTP = jest.fn().mockResolvedValue({ ok: true });
        mockAuthService.resendOTP = jest.fn().mockResolvedValue({ ok: true });
        mockAuthService.forgotPassword = jest.fn().mockResolvedValue({ ok: true });
        mockAuthService.resetPassword = jest.fn().mockResolvedValue({ ok: true });
        mockAuthService.resendResetCode = jest.fn().mockResolvedValue({ ok: true });

        expect(await controller.verifyOTP({ cin: '1', otp: '2' } as any)).toEqual({ ok: true });
        expect(await controller.resendOTP({ cin: '1' } as any)).toEqual({ ok: true });
        expect(await controller.forgotPassword({ email: 'e' } as any)).toEqual({ ok: true });
        expect(await controller.resetPassword({ email: 'e', resetCode: 'c', newPassword: 'n' } as any)).toEqual({ ok: true });
        expect(await controller.resendResetCode({ email: 'e' } as any)).toEqual({ ok: true });
      });
    });
});
