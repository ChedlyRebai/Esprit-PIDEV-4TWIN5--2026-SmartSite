import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Permission } from './entities/permission.entity';
import { Types } from 'mongoose';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockPermissionModel: any;

  const mockPermissionId = new Types.ObjectId();

  beforeEach(async () => {
    mockPermissionModel = jest.fn((data: any) => {
      return {
        ...data,
        _id: mockPermissionId,
        save: jest.fn().mockResolvedValue({ ...data, _id: mockPermissionId }),
      };
    }) as any;

    mockPermissionModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });
    mockPermissionModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockPermissionModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockPermissionModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockPermissionModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getModelToken(Permission.name), useValue: mockPermissionModel },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create permission successfully', async () => {
      const createPermissionDto = {
        name: 'create_user',
        module: 'users',
        href: '/users',
        description: 'Create user permission',
        access: true,
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('create_user');
      expect(result.module).toBe('Users');
    });

    it('should throw error if permission already exists', async () => {
      const createPermissionDto = {
        name: 'existing_permission',
        module: 'users',
      };

      const existingPermission = { _id: mockPermissionId, name: 'existing_permission' };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingPermission),
      });

      await expect(service.create(createPermissionDto)).rejects.toThrow();
    });

    it('should normalize module with underscores to title case', async () => {
      const createPermissionDto = {
        name: 'read_dashboard',
        module: 'dash_board',
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('Dash Board');
    });

    it('should extract module from href when module not provided', async () => {
      const createPermissionDto = {
        name: 'read_product',
        href: '/product/list',
        module: undefined,
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('Product');
    });

    it('should return General when both module and href are empty', async () => {
      const createPermissionDto = {
        name: 'general_perm',
        href: '',
        module: '',
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('General');
    });

    it('should handle complex href paths', async () => {
      const createPermissionDto = {
        name: 'admin_panel',
        href: '///admin/panel/config',
        module: undefined,
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('Admin');
    });

    it('should handle multi-word module names', async () => {
      const createPermissionDto = {
        name: 'complex_perm',
        module: 'user_management_system',
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('User Management System');
    });

    it('should handle duplicate key error', async () => {
      const createPermissionDto = {
        name: 'duplicate',
        module: 'users',
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockRejectedValue({ code: 11000 });
      mockPermissionModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(service.create(createPermissionDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all permissions sorted by module and name', async () => {
      const mockPermissions = [
        { _id: mockPermissionId, name: 'read', module: 'Users' },
        { _id: new Types.ObjectId(), name: 'write', module: 'Users' },
      ];

      mockPermissionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPermissions),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockPermissions);
      expect(mockPermissionModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no permissions exist', async () => {
      mockPermissionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find permission by id', async () => {
      const mockPermission = { _id: mockPermissionId, name: 'read', module: 'Users' };

      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await service.findById(mockPermissionId.toString());

      expect(result).toEqual(mockPermission);
      expect(mockPermissionModel.findById).toHaveBeenCalledWith(mockPermissionId.toString());
    });

    it('should return null when permission not found', async () => {
      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find permission by name', async () => {
      const mockPermission = { _id: mockPermissionId, name: 'read', module: 'Users' };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await service.findByName('read');

      expect(result).toEqual(mockPermission);
      expect(mockPermissionModel.findOne).toHaveBeenCalledWith({ name: 'read' });
    });

    it('should return null when name not found', async () => {
      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update permission', async () => {
      const updatePermissionDto = {
        name: 'updated_permission',
        module: 'users',
      };

      const updatedPermission = { _id: mockPermissionId, ...updatePermissionDto };

      mockPermissionModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPermission),
      });

      const result = await service.update(mockPermissionId.toString(), updatePermissionDto);

      expect(result).toEqual(updatedPermission);
      expect(mockPermissionModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return null when permission to update not found', async () => {
      mockPermissionModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.update('nonexistent', { name: 'new' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete permission', async () => {
      const mockPermission = { _id: mockPermissionId, name: 'read', module: 'Users' };

      mockPermissionModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await service.remove(mockPermissionId.toString());

      expect(result).toEqual(mockPermission);
      expect(mockPermissionModel.findByIdAndDelete).toHaveBeenCalledWith(mockPermissionId.toString());
    });

    it('should return null when permission to delete not found', async () => {
      mockPermissionModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove('nonexistent');

      expect(result).toBeNull();
    });
  });
});
