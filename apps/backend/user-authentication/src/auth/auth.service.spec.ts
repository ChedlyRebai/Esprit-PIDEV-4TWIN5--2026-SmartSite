import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let rolesService: RolesService;

  const mockUsersService = {
    findByCin: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token123'),
    verify: jest.fn(),
  };

  const mockEmailService = {
    sendTemporaryPasswordEmail: jest.fn().mockResolvedValue({}),
    sendOTPEmail: jest.fn().mockResolvedValue({}),
    sendApprovalEmail: jest.fn().mockResolvedValue({}),
    sendRejectionEmail: jest.fn().mockResolvedValue({}),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
  } as any;

  const mockRolesService = {
    findByName: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  } as any;

  const mockUserId = new Types.ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    rolesService = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if cin or password is missing', async () => {
      const result1 = await service.validateUser('', 'password');
      const result2 = await service.validateUser('12345678', '');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByCin.mockResolvedValue(null);

      const result = await service.validateUser('12345678', 'password');

      expect(result).toBeNull();
      expect(mockUsersService.findByCin).toHaveBeenCalledWith('12345678');
    });

    it('should return null if user status is not approved', async () => {
      const mockUser = {
        cin: '12345678',
        password: '$2b$10$hashedPassword',
        status: 'pending',
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);

      const result = await service.validateUser('12345678', 'password');

      expect(result).toBeNull();
    });

    it('should return null if user has no password', async () => {
      const mockUser = {
        cin: '12345678',
        password: null,
        status: 'approved',
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);

      const result = await service.validateUser('12345678', 'password');

      expect(result).toBeNull();
    });

    it('should return user if bcrypt password matches', async () => {
      const mockUser = {
        _id: mockUserId,
        cin: '12345678',
        password: '$2b$10$hashedPassword',
        status: 'approved',
        toObject: jest.fn().mockReturnValue({
          _id: mockUserId,
          cin: '12345678',
          firstName: 'John',
          lastName: 'Doe',
        }),
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('12345678', 'password');

      expect(result).toBeDefined();
      expect(result.cin).toBe('12345678');
      expect(result.password).toBeUndefined();
    });

    it('should hash and update plain text password when it matches', async () => {
      const mockUser = {
        _id: mockUserId,
        cin: '12345678',
        password: 'plainPassword',
        status: 'approved',
        toObject: jest.fn().mockReturnValue({
          _id: mockUserId,
          cin: '12345678',
          firstName: 'John',
        }),
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);
      // First compare fails (not a bcrypt hash), second compare succeeds for plain text
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newHash');

      const result = await service.validateUser('12345678', 'plainPassword');

      expect(mockUsersService.updatePassword).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return null if password does not match', async () => {
      const mockUser = {
        _id: mockUserId,
        cin: '12345678',
        password: '$2b$10$hashedPassword',
        status: 'approved',
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('12345678', 'wrongPassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const mockUser = {
        _id: mockUserId,
        cin: '12345678',
        firstName: 'John',
        lastName: 'Doe',
        role: { _id: new Types.ObjectId(), name: 'admin' },
        firstLogin: false,
        toObject: jest.fn().mockReturnValue({
          _id: mockUserId,
          cin: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          role: { name: 'admin' },
          firstLogin: false,
        }),
      };

      const result = await service.login(mockUser);

      expect(result.access_token).toBe('token123');
      expect(result.id).toEqual(mockUserId);
      expect(result.cin).toBe('12345678');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.session_id).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should handle user without toObject method', async () => {
      const mockUser = {
        _id: mockUserId,
        cin: '12345678',
        firstName: 'Jane',
        lastName: 'Smith',
        role: null,
        firstLogin: true,
      };

      const result = await service.login(mockUser);

      expect(result.access_token).toBe('token123');
      expect(result.role).toBeNull();
      expect(result.firstLogin).toBe(true);
    });
  });
});
