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
    // Create a mock that's callable as a constructor
    mockPermissionModel = jest.fn((data: any) => {
      return {
        ...data,
        _id: mockPermissionId,
        save: jest.fn().mockResolvedValue({ ...data, _id: mockPermissionId }),
      };
    }) as any;

    // Add static methods to the mock
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
      expect(mockPermissionModel.findOne).toHaveBeenCalled();
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

    it('should normalize module name', async () => {
      const createPermissionDto = {
        name: 'read_dashboard',
        module: 'dash_board',
        href: '/dashboard',
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('Dash Board'); // Normalized from dash_board
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
  });
});

  describe('normalizeModule (indirectly tested through create)', () => {
    it('should use href when module is not provided', async () => {
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
      expect(result.module).toBe('Product'); // Extracted from href
    });

    it('should use General when both module and href are empty', async () => {
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

    it('should handle permissions with slashes in href', async () => {
      const createPermissionDto = {
        name: 'admin_panel',
        href: '///admin/panel///config',
        module: undefined,
      };

      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(createPermissionDto);

      expect(result).toBeDefined();
      expect(result.module).toBe('Admin'); // First segment after normalization
    });

    it('should format multi-word module names correctly', async () => {
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
  });
