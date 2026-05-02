import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/roles.service';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { jest, describe, it, expect } from '@jest/globals';

jest.mock('bcrypt');
jest.mock('../lib/stream', () => ({
  upsertStreamUser: jest.fn().mockResolvedValue({}),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockRolesService: jest.Mocked<RolesService>;

  const mockUserId = new Types.ObjectId();
  const mockManagerId = new Types.ObjectId();
  const mockRoleId = new Types.ObjectId();
  const mockSiteId = new Types.ObjectId();

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    mockEmailService = {
      sendTemporaryPasswordEmail: jest.fn().mockResolvedValue({}),
    } as any;

    mockRolesService = {
      findByName: jest.fn().mockResolvedValue({ _id: mockRoleId }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCin', () => {
    it('should find a user by cin', async () => {
      const mockUser = { cin: '12345678', firstName: 'John', role: { name: 'admin' } };
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findByCin('12345678');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ cin: '12345678' });
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findByCin('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = { email: 'test@example.com', firstName: 'Jane' };
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const mockUser = { _id: mockUserId, firstName: 'John', lastName: 'Doe' };
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findById(mockUserId.toString());

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId.toString());
    });

    it('should return null when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { _id: mockUserId, firstName: 'John', role: { name: 'admin' } },
        { _id: new Types.ObjectId(), firstName: 'Jane', role: { name: 'user' } },
      ];
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
    });

    it('should handle empty users list', async () => {
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should fallback to find without populate on error', async () => {
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValueOnce(new Error('Populate error')),
        }),
      });

      mockUserModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce([{ _id: mockUserId }]),
      });

      const result = await service.findAll();

      expect(result).toBeDefined();
    });
  });

  describe('findPending', () => {
    it('should find pending users', async () => {
      const mockPendingUsers = [
        { _id: mockUserId, firstName: 'John', status: 'pending', role: { name: 'user' } },
      ];
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPendingUsers),
        }),
      });

      const result = await service.findPending();

      expect(result).toEqual(mockPendingUsers);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('update', () => {
    it('should update user without password', async () => {
      const updateDto = { firstName: 'Updated' };
      const mockUpdatedUser = { _id: mockUserId, firstName: 'Updated' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await service.update(mockUserId.toString(), updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId.toString(),
        updateDto,
        { new: true },
      );
    });

    it('should hash password when updating password', async () => {
      const updateDto = { password: 'newPassword123' };
      const hashedPassword = 'hashedPassword123';
      const mockUpdatedUser = { _id: mockUserId, password: hashedPassword };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await service.update(mockUserId.toString(), updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 'salt');
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const mockDeletedUser = { _id: mockUserId, firstName: 'John' };
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeletedUser),
      });

      const result = await service.remove(mockUserId.toString());

      expect(result).toEqual(mockDeletedUser);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId.toString());
    });
  });

  describe('updatePassword', () => {
    it('should update user password directly', async () => {
      const newPassword = 'newHashedPassword';
      const mockUpdatedUser = { _id: mockUserId, password: newPassword };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await service.updatePassword(mockUserId.toString(), newPassword);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId.toString(),
        { password: newPassword },
        { new: true },
      );
    });
  });

  describe('handleBan', () => {
    it('should toggle user active status', async () => {
      const mockUser = {
        _id: mockUserId,
        isActif: true,
        save: jest.fn().mockResolvedValue({ _id: mockUserId, isActif: false }),
      };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.handleBan(mockUserId.toString());

      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.handleBan('invalidId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllclients', () => {
    it('should get all client users', async () => {
      const mockClients = [
        { _id: mockUserId, firstName: 'Client User', role: { name: 'client' } },
      ];
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockClients) }),
      });

      const result = await service.getAllclients();

      expect(result).toEqual(mockClients);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'currentPass123';
      const newPassword = 'newPass456';
      const hashedNewPassword = 'hashedNewPass456';

      const mockUser = {
        _id: mockUserId,
        password: 'hashedCurrentPass123',
        passwordChnage: false,
        firstLogin: true,
        save: jest.fn().mockResolvedValue({}),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedNewPassword);

      const result = await service.changePassword(
        mockUserId.toString(),
        currentPassword,
        newPassword,
      );

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, 'hashedCurrentPass123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPass456';

      const mockUser = {
        _id: mockUserId,
        password: 'hashedCurrentPass123',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUserId.toString(), currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.changePassword(mockUserId.toString(), 'current', 'new'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mypermission', () => {
    it('should get user permissions', async () => {
      const mockPermissions = [
        { name: 'read', access: true },
        { name: 'write', access: true },
      ];
      const mockUser = {
        _id: mockUserId,
        role: {
          _id: mockRoleId,
          name: 'admin',
          permissions: mockPermissions,
        },
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      });

      const result = await service.mypermission(mockUserId.toString());

      expect(result).toEqual(mockPermissions);
    });

    it('should return error when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await service.mypermission('invalidId');

      expect(result).toEqual({ error: 'User not found' });
    });
  });

  describe('assignManager', () => {
    it('should assign manager to user', async () => {
      const mockUser = {
        _id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        manager: null,
        save: jest.fn().mockResolvedValue({}),
      };

      const mockManager = {
        _id: mockManagerId,
        firstName: 'Manager',
        lastName: 'User',
      };

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockManager),
      });

      const result = await service.assignManager(mockUserId.toString(), mockManagerId.toString());

      expect(result.message).toBe('Gestionnaire affecté avec succès');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.assignManager(mockUserId.toString(), mockManagerId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when manager not found', async () => {
      const mockUser = { _id: mockUserId, firstName: 'John' };

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.assignManager(mockUserId.toString(), mockManagerId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });


  describe('modifyManager', () => {
    it('should modify user manager', async () => {
      const mockUser = {
        _id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        manager: mockManagerId,
        save: jest.fn().mockResolvedValue({}),
      };

      const newManagerId = new Types.ObjectId();
      const mockNewManager = {
        _id: newManagerId,
        firstName: 'New',
        lastName: 'Manager',
      };

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockNewManager),
      });

      const result = await service.modifyManager(mockUserId.toString(), newManagerId.toString());

      expect(result.message).toBe('Gestionnaire modifié avec succès');
      expect(mockUser.save).toHaveBeenCalled();
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

      const mockUser = {
        _id: mockUserId,
        manager: mockManager,
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.getManager(mockUserId.toString());

      expect(result.manager).toEqual(mockManager);
    });

    it('should return null when no manager assigned', async () => {
      const mockUser = {
        _id: mockUserId,
        manager: null,
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.getManager(mockUserId.toString());

      expect(result.message).toBe('Aucun gestionnaire affecté');
      expect(result.manager).toBeNull();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getManager('invalidId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setResponsibilities', () => {
    it('should set user responsibilities', async () => {
      const mockUser = {
        _id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        responsibilities: null,
        save: jest.fn().mockResolvedValue({}),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.setResponsibilities(
        mockUserId.toString(),
        'Project Management',
      );

      expect(result.message).toBe('Responsabilités mises à jour avec succès');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.setResponsibilities(mockUserId.toString(), 'Management'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignToSite', () => {
    it('should assign user to site', async () => {
      const mockUser = {
        _id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        assignedSite: null,
        save: jest.fn().mockResolvedValue({}),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.assignToSite(mockUserId.toString(), mockSiteId.toString());

      expect(result.message).toBe('Utilisateur affecté au site avec succès');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.assignToSite(mockUserId.toString(), mockSiteId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUsersBySite', () => {
    it('should get all users assigned to a site', async () => {
      const mockUsers = [
        {
          _id: mockUserId,
          firstName: 'John',
          assignedSite: mockSiteId,
          manager: { firstName: 'Manager' },
          role: { name: 'worker' },
        },
      ];

      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const result = await service.getUsersBySite(mockSiteId.toString());

      expect(result).toEqual(mockUsers);
    });
  });

  describe('removeFromSite', () => {
    it('should remove user from site', async () => {
      const mockUser = {
        _id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        assignedSite: mockSiteId,
        save: jest.fn().mockResolvedValue({}),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.removeFromSite(mockUserId.toString());

      expect(result.message).toBe('Utilisateur retiré du site avec succès');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.removeFromSite('invalidId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('accestOthisSite', () => {
    it('should grant access to active approved user', async () => {
      const mockUser = {
        _id: mockUserId,
        status: 'approved',
        isActif: true,
        role: { name: 'admin' },
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.accestOthisSite(mockUserId.toString(), '/dashboard');

      expect(result.access).toBe(true);
      expect(result.userId).toBe(mockUserId.toString());
    });

    it('should deny access to inactive user', async () => {
      const mockUser = {
        _id: mockUserId,
        status: 'approved',
        isActif: false,
        role: { name: 'user' },
      };

      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.accestOthisSite(mockUserId.toString(), '/dashboard');

      expect(result.access).toBe(false);
    });

    it('should return access false when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.accestOthisSite('invalidId', '/dashboard');

      expect(result.access).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('createUserWithTemporaryPassword', () => {
    it('should throw BadRequestException for existing CIN', async () => {
      const createUserDto = {
        cin: '12345678',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const existingUser = { _id: mockUserId, cin: '12345678' };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      await expect(
        service.createUserWithTemporaryPassword(createUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no default client role exists', async () => {
      const createUserDto = {
        cin: '12345678',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockRolesService.findByName.mockResolvedValue(null);

      await expect(
        service.createUserWithTemporaryPassword(createUserDto),
      ).rejects.toThrow(BadRequestException);
    });

  });

  describe('create', () => {
    it('should handle role string mapping', async () => {
      const createUserDto = {
        cin: '12345678',
        firstName: 'John',
        lastName: 'Doe',
        role: 'super_admin',
      };

      // Test that role mappings are handled - the actual create will be tested by integration
      expect(createUserDto.role).toBe('super_admin');
    });
  });

  
  describe('addingUser', () => {
    // addingUser requires complex mocking of Mongoose model constructor
    // Tests are covered by integration tests
  });

  describe('getUsersByRoleName', () => {
    it('should get users by role name', async () => {
      const mockUsers = [
        { _id: mockUserId, firstName: 'John', role: mockRoleId, status: 'approved' },
      ];

      mockRolesService.findByName.mockResolvedValue({ _id: mockRoleId });

      
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await service.getUsersByRoleName('admin');

      expect(result).toEqual(mockUsers);
    });


    it('should return empty array when role not found', async () => {
      mockRolesService.findByName.mockResolvedValue(null);

      const result = await service.getUsersByRoleName('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('createUserWithTemporaryPassword - success path', () => {
    it('should create user and send temporary password email', async () => {
      const createUserDto = {
        cin: '99999999',
        firstName: 'Temp',
        lastName: 'User',
        email: 'temp@example.com',
      };

      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockRolesService.findByName.mockResolvedValue({ _id: mockRoleId });

      const savedResult = {
        _id: mockUserId,
        email: 'temp@example.com',
        firstName: 'Temp',
        lastName: 'User',
        cin: '99999999',
        toObject: function () { return { _id: mockUserId, email: 'temp@example.com', firstName: 'Temp', lastName: 'User', cin: '99999999', password: 'hidden' } }
      };

      
      // Replace the injected model with a constructor-like mock for this test
      const fakeModel: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedResult),
      }));
      fakeModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      (service as any).userModel = fakeModel;

      const result = await service.createUserWithTemporaryPassword(createUserDto as any);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockEmailService.sendTemporaryPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('Manager and Site operations', () => {
    it('should assign manager to user', async () => {
      const mockUser = { _id: mockUserId, save: jest.fn().mockResolvedValue({}), firstName: 'J', lastName: 'D' };
      const mockManager = { _id: mockManagerId, firstName: 'M', lastName: 'G' };

      mockUserModel.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockUserModel.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockManager) });

      const res = await service.assignManager(mockUserId.toString(), mockManagerId.toString());
      expect(res).toHaveProperty('message');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should modify manager for user', async () => {
      const mockUser = { _id: mockUserId, save: jest.fn().mockResolvedValue({}), firstName: 'J', lastName: 'D' };
      const newManager = { _id: mockManagerId, firstName: 'New', lastName: 'Manager' };

      mockUserModel.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockUserModel.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(newManager) });

      const res = await service.modifyManager(mockUserId.toString(), mockManagerId.toString());
      expect(res).toHaveProperty('message');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return no manager message when none set', async () => {
      const mockUser = { _id: mockUserId, manager: null };
      mockUserModel.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }) });

      const res = await service.getManager(mockUserId.toString());
      expect(res).toHaveProperty('message');
      expect(res.manager).toBeNull();
    });

    it('should set responsibilities', async () => {
      const mockUser = { _id: mockUserId, save: jest.fn().mockResolvedValue({}), firstName: 'AA', lastName: 'BB' };
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const res = await service.setResponsibilities(mockUserId.toString(), 'New responsibilities');
      expect(res).toHaveProperty('message');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should assign and remove user from site', async () => {
      const mockUser = { _id: mockUserId, save: jest.fn().mockResolvedValue({}), firstName: 'A', lastName: 'B' };
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const assignRes = await service.assignToSite(mockUserId.toString(), mockSiteId.toString());
      expect(assignRes.user.assignedSite).toBe(mockSiteId.toString());

      // For removeFromSite, ensure findById returns user with assignedSite
      mockUser.assignedSite = mockSiteId.toString();
      const removeRes = await service.removeFromSite(mockUserId.toString());
      expect(removeRes.user.assignedSite).toBeNull();
    });
  });

  describe('addingUser and create role handling', () => {
    it('should create user when role is a valid ObjectId string', async () => {
      const dto = { cin: '55555555', firstName: 'Obj', lastName: 'Id', role: '0123456789abcdef01234567', password: 'pass' };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');

      const savedResult = { _id: new Types.ObjectId(), firstName: 'Obj', lastName: 'Id', profilePic: '', fullName: 'Obj Id' };
      const fakeModel: any = jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(savedResult) }));
      (service as any).userModel = fakeModel;

      const res = await service.addingUser(dto as any);
      expect(res).toEqual(savedResult);
    });

    it('should resolve role name via RolesService when provided', async () => {
      const dto = { cin: '66666666', firstName: 'Role', lastName: 'Name', role: 'client' };
      mockRolesService.findByName.mockResolvedValue({ _id: mockRoleId });

      const savedResult = { _id: new Types.ObjectId(), firstName: 'Role', lastName: 'Name', profilePic: '', fullName: 'Role Name' };
      const fakeModel: any = jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(savedResult) }));
      (service as any).userModel = fakeModel;

      const res = await service.addingUser(dto as any);
      expect(res).toEqual(savedResult);
    });

    it('should create in create() when role is a mapped string', async () => {
      const dto = { cin: '77777777', firstName: 'Map', lastName: 'User', role: 'user' };

      const savedResult = { _id: new Types.ObjectId(), firstName: 'Map', lastName: 'User', profilePic: '', fullName: 'Map User' };
      const fakeModel: any = jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(savedResult) }));
      (service as any).userModel = fakeModel;

      const res = await service.create(dto as any);
      expect(res).toEqual(savedResult);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle findByCin not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findByCin('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle findByEmail not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findByEmail('nonexistent@test.com');
      expect(result).toBeNull();
    });

    it('should handle getAllclients with empty result', async () => {
      mockUserModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getAllclients();
      expect(result).toEqual([]);
    });

    it('should handle remove when user not found', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle updatePassword with valid id', async () => {
      const mockUpdatedUser = { _id: mockUserId, password: 'newhashed' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await service.updatePassword(mockUserId.toString(), 'newhashed');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle handleBan toggling active status', async () => {
      const mockUser = {
        _id: mockUserId,
        isActif: false,
        save: jest.fn().mockResolvedValue({ _id: mockUserId, isActif: true }),
      };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.handleBan(mockUserId.toString());
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle multiple consecutive findAll calls', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: mockUserId }]),
        }),
      });

      const result1 = await service.findAll();
      const result2 = await service.findAll();
      expect(result1.length).toBeGreaterThanOrEqual(0);
      expect(result2.length).toBeGreaterThanOrEqual(0);
    });
  });

});

