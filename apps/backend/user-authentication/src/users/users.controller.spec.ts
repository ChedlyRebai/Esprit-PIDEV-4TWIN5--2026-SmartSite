import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Types } from 'mongoose';

// Mock the GetUser decorator to avoid import issues
jest.mock('../auth/strategies/get-user.decorator', () => ({
  GetUser: () => (target: any, propertyKey: string, parameterIndex: number) => {},
}));

// Mock JwtAuthGuard
jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({})),
}));

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  const mockUserId = new Types.ObjectId();
  const mockManagerId = new Types.ObjectId();
  const mockSiteId = new Types.ObjectId();

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByCin: jest.fn(),
      findById: jest.fn(),
      findPending: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      changePassword: jest.fn(),
      handleBan: jest.fn(),
      mypermission: jest.fn(),
      accestOthisSite: jest.fn(),
      createUserWithTemporaryPassword: jest.fn(),
      getAllclients: jest.fn(),
      assignManager: jest.fn(),
      modifyManager: jest.fn(),
      getManager: jest.fn(),
      setResponsibilities: jest.fn(),
      getUsersBySite: jest.fn(),
      assignToSite: jest.fn(),
      removeFromSite: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    };

    const mockAuditLogsService = {
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<jest.Mocked<UsersService>>(UsersService);
    jwtService = module.get<jest.Mocked<JwtService>>(JwtService);
    auditLogsService = module.get<jest.Mocked<AuditLogsService>>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cin: '12345678',
        password: 'password123',
      };
      const mockCreatedUser = { _id: mockUserId, ...createUserDto };

      usersService.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { _id: mockUserId, firstName: 'John', email: 'john@example.com' },
        { _id: new Types.ObjectId(), firstName: 'Jane', email: 'jane@example.com' },
      ];

      usersService.findAll.mockResolvedValue(mockUsers as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findByCin', () => {
    it('should find user by cin', async () => {
      const cin = '12345678';
      const mockUser = { _id: mockUserId, cin, firstName: 'John' };

      usersService.findByCin.mockResolvedValue(mockUser as any);

      const result = await controller.findByCin(cin);

      expect(result).toEqual(mockUser);
      expect(usersService.findByCin).toHaveBeenCalledWith(cin);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { _id: mockUserId, firstName: 'John', email: 'john@example.com' };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await controller.findById(mockUserId.toString());

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(mockUserId.toString());
    });
  });

  describe('getProfile', () => {
    it('should get user permissions with valid token', async () => {
      const token = 'valid.jwt.token';
      const authHeader = `Bearer ${token}`;
      const mockPermissions = [
        { name: 'read', access: true },
        { name: 'write', access: true },
      ];

      jwtService.verify.mockReturnValue({ sub: mockUserId.toString() });
      usersService.mypermission.mockResolvedValue(mockPermissions);

      const result = await controller.getProfile(authHeader);

      expect(result).toEqual(mockPermissions);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(usersService.mypermission).toHaveBeenCalledWith(mockUserId.toString());
    });

    it('should return error without token', async () => {
      const result = await controller.getProfile('');

      expect(result).toEqual({ error: 'No token provided' });
    });

    it('should return error with invalid token', async () => {
      const token = 'invalid.token';
      const authHeader = `Bearer ${token}`;

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await controller.getProfile(authHeader);

      expect(result).toEqual({ error: 'Invalid token' });
    });
  });

  describe('getMyPermissionsByUrl', () => {
    it('should grant access with valid token and url', async () => {
      const token = 'valid.jwt.token';
      const authHeader = `Bearer ${token}`;
      const url = '/dashboard';
      const mockAccessResult = { access: true, url, userId: mockUserId.toString() };

      jwtService.verify.mockReturnValue({ sub: mockUserId.toString() });
      usersService.accestOthisSite.mockResolvedValue(mockAccessResult);

      const result = await controller.getMyPermissionsByUrl(authHeader, url);

      expect(result).toEqual(mockAccessResult);
      expect(usersService.accestOthisSite).toHaveBeenCalledWith(mockUserId.toString(), url);
    });

    it('should return error without token', async () => {
      const result = await controller.getMyPermissionsByUrl('', '/dashboard');

      expect(result).toEqual({ error: 'No token provided' });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateUserDto = { firstName: 'Jane' };
      const mockUpdatedUser = { _id: mockUserId, firstName: 'Jane', toObject: jest.fn() };
      const mockRequest = { user: { sub: 'adminId' }, ip: '127.0.0.1' };

      usersService.update.mockResolvedValue(mockUpdatedUser as any);

      const result = await controller.update(mockUserId.toString(), updateUserDto, mockRequest);

      expect(result).toEqual(mockUpdatedUser);
      expect(usersService.update).toHaveBeenCalledWith(mockUserId.toString(), updateUserDto);
      expect(auditLogsService.createLog).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const mockDeletedUser = { _id: mockUserId, firstName: 'John' };
      const mockRequest = { user: { sub: 'adminId' }, ip: '127.0.0.1' };

      usersService.remove.mockResolvedValue(mockDeletedUser as any);

      const result = await controller.remove(mockUserId.toString(), mockRequest);

      expect(result).toEqual(mockDeletedUser);
      expect(usersService.remove).toHaveBeenCalledWith(mockUserId.toString());
      expect(auditLogsService.createLog).toHaveBeenCalled();
    });
  });

  describe('ban', () => {
    it('should toggle user active status', async () => {
      const mockUser = { _id: mockUserId, isActif: false };
      const mockRequest = { user: { sub: 'adminId' }, ip: '127.0.0.1' };

      usersService.handleBan.mockResolvedValue(mockUser as any);

      const result = await controller.ban(mockUserId.toString(), mockRequest);

      expect(result).toEqual(mockUser);
      expect(usersService.handleBan).toHaveBeenCalledWith(mockUserId.toString());
      expect(auditLogsService.createLog).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password with valid token', async () => {
      const token = 'valid.jwt.token';
      const authHeader = `Bearer ${token}`;
      const passwordData = { currentPassword: 'old', newPassword: 'new' };
      const mockResponse = { message: 'Password changed successfully' };

      jwtService.verify.mockReturnValue({ sub: mockUserId.toString() });
      usersService.changePassword.mockResolvedValue(mockResponse as any);

      const result = await controller.changePassword(authHeader, passwordData);

      expect(result).toEqual(mockResponse);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUserId.toString(),
        passwordData.currentPassword,
        passwordData.newPassword,
      );
    });

    it('should return error without token', async () => {
      const passwordData = { currentPassword: 'old', newPassword: 'new' };

      const result = await controller.changePassword('', passwordData);

      expect(result).toEqual({ error: 'No token provided' });
    });
  });

  describe('findPending', () => {
    it('should return pending users', async () => {
      const mockPendingUsers = [
        { _id: mockUserId, firstName: 'John', status: 'pending' },
      ];

      usersService.findPending.mockResolvedValue(mockPendingUsers as any);

      const result = await controller.findPending();

      expect(result).toEqual(mockPendingUsers);
      expect(usersService.findPending).toHaveBeenCalled();
    });
  });

  describe('getAllClients', () => {
    it('should return all client users', async () => {
      const mockClients = [
        { _id: mockUserId, firstName: 'John', role: { name: 'client' } },
      ];

      usersService.getAllclients.mockResolvedValue(mockClients as any);

      const result = await controller.getAllClients();

      expect(result).toEqual(mockClients);
      expect(usersService.getAllclients).toHaveBeenCalled();
    });
  });

  describe('createUserWithTemporaryPassword', () => {
    it('should create user with temporary password', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cin: '12345678',
      };
      const mockResponse = {
        success: true,
        message: 'User created successfully',
        user: { _id: mockUserId, ...createUserDto },
      };

      usersService.createUserWithTemporaryPassword.mockResolvedValue(mockResponse as any);

      const result = await controller.createUserWithTemporaryPassword(createUserDto);

      expect(result).toEqual(mockResponse);
      expect(usersService.createUserWithTemporaryPassword).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('assignManager', () => {
    it('should assign manager to user', async () => {
      const managerId = mockManagerId.toString();
      const mockResponse = {
        message: 'Gestionnaire affecté avec succès',
        user: { id: mockUserId, manager: managerId },
      };

      usersService.assignManager.mockResolvedValue(mockResponse);

      const result = await controller.assignManager(mockUserId.toString(), { managerId });

      expect(result).toEqual(mockResponse);
      expect(usersService.assignManager).toHaveBeenCalledWith(mockUserId.toString(), managerId);
    });
  });

  describe('modifyManager', () => {
    it('should modify user manager', async () => {
      const managerId = mockManagerId.toString();
      const mockResponse = {
        message: 'Gestionnaire modifié avec succès',
        user: { id: mockUserId, manager: managerId },
      };

      usersService.modifyManager.mockResolvedValue(mockResponse);

      const result = await controller.modifyManager(mockUserId.toString(), { managerId });

      expect(result).toEqual(mockResponse);
      expect(usersService.modifyManager).toHaveBeenCalledWith(mockUserId.toString(), managerId);
    });
  });

  describe('getManager', () => {
    it('should get user manager', async () => {
      const mockManager = {
        _id: mockManagerId,
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@example.com',
      };
      const mockResponse = { manager: mockManager };

      usersService.getManager.mockResolvedValue(mockResponse);

      const result = await controller.getManager(mockUserId.toString());

      expect(result).toEqual(mockResponse);
      expect(usersService.getManager).toHaveBeenCalledWith(mockUserId.toString());
    });
  });

  describe('setResponsibilities', () => {
    it('should set user responsibilities', async () => {
      const responsibilities = 'Project Management';
      const mockResponse = {
        message: 'Responsabilités mises à jour avec succès',
        user: { id: mockUserId, responsibilities },
      };

      usersService.setResponsibilities.mockResolvedValue(mockResponse);

      const result = await controller.setResponsibilities(mockUserId.toString(), {
        responsibilities,
      });

      expect(result).toEqual(mockResponse);
      expect(usersService.setResponsibilities).toHaveBeenCalledWith(
        mockUserId.toString(),
        responsibilities,
      );
    });
  });

  describe('getUsersBySite', () => {
    it('should get users by site', async () => {
      const mockUsers = [
        {
          _id: mockUserId,
          firstName: 'John',
          assignedSite: mockSiteId,
          role: { name: 'worker' },
        },
      ];

      usersService.getUsersBySite.mockResolvedValue(mockUsers as any);

      const result = await controller.getUsersBySite(mockSiteId.toString());

      expect(result).toEqual(mockUsers);
      expect(usersService.getUsersBySite).toHaveBeenCalledWith(mockSiteId.toString());
    });
  });

  describe('assignToSite', () => {
    it('should assign user to site', async () => {
      const siteId = mockSiteId.toString();
      const mockResponse = {
        message: 'Utilisateur affecté au site avec succès',
        user: { id: mockUserId, assignedSite: siteId },
      };

      usersService.assignToSite.mockResolvedValue(mockResponse);

      const result = await controller.assignToSite(mockUserId.toString(), { siteId });

      expect(result).toEqual(mockResponse);
      expect(usersService.assignToSite).toHaveBeenCalledWith(mockUserId.toString(), siteId);
    });
  });

  describe('removeFromSite', () => {
    it('should remove user from site', async () => {
      const mockResponse = {
        message: 'Utilisateur retiré du site avec succès',
        user: { id: mockUserId, assignedSite: null },
      };

      usersService.removeFromSite.mockResolvedValue(mockResponse);

      const result = await controller.removeFromSite(mockUserId.toString());

      expect(result).toEqual(mockResponse);
      expect(usersService.removeFromSite).toHaveBeenCalledWith(mockUserId.toString());
    });
  });
});
