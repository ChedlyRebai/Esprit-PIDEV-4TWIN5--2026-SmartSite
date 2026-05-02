import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Role } from './entities/role.entity';
import { Types } from 'mongoose';

describe('RolesService', () => {
  let service: RolesService;
  let mockRoleModel: any;

  const mockRoleId = new Types.ObjectId();

  beforeEach(async () => {
    mockRoleModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByName', () => {
    it('should find role by name', async () => {
      const mockRole = { _id: mockRoleId, name: 'admin' };

      mockRoleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRole),
        }),
      });

      const result = await service.findByName('admin');

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findOne).toHaveBeenCalledWith({ name: 'admin' });
    });

    it('should return null when role not found', async () => {
      mockRoleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { _id: mockRoleId, name: 'admin' },
        { _id: new Types.ObjectId(), name: 'user' },
      ];

      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(mockRoleModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find role by id', async () => {
      const mockRole = { _id: mockRoleId, name: 'admin' };

      mockRoleModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRole),
        }),
      });

      const result = await service.findById(mockRoleId.toString());

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findById).toHaveBeenCalledWith(mockRoleId.toString());
    });

    it('should return null when role not found', async () => {
      mockRoleModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const updateRoleDto = { name: 'super_admin' };
      const updatedRole = { _id: mockRoleId, ...updateRoleDto };

      mockRoleModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedRole),
        }),
      });

      const result = await service.update(mockRoleId.toString(), updateRoleDto);

      expect(result).toEqual(updatedRole);
      expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRoleId.toString(),
        updateRoleDto,
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should delete role', async () => {
      const mockRole = { _id: mockRoleId, name: 'admin' };

      mockRoleModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });

      const result = await service.remove(mockRoleId.toString());

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findByIdAndDelete).toHaveBeenCalledWith(mockRoleId.toString());
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = { name: 'new_role', description: 'New Role' };
      const mockNewRole = { _id: mockRoleId, ...createRoleDto, save: jest.fn().mockResolvedValue({ _id: mockRoleId, ...createRoleDto }) };
      
      const mockConstructor = jest.fn(() => mockNewRole);
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesService,
          { provide: getModelToken(Role.name), useValue: mockConstructor as any },
        ],
      }).compile();

      const testService = module.get<RolesService>(RolesService);
      const result = await testService.create(createRoleDto);
      
      expect(result).toEqual({ _id: mockRoleId, ...createRoleDto });
    });
  });

  describe('Permission Management', () => {
    it('should add permission to role', async () => {
      const permissionId = new Types.ObjectId().toString();
      const updatedRole = { _id: mockRoleId, name: 'admin', permissions: [permissionId] };
      
      mockRoleModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedRole),
        }),
      });
      
      const result = await service.addPermissionToRole(mockRoleId.toString(), permissionId);
      
      expect(result).toEqual(updatedRole);
      expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRoleId.toString(),
        { $addToSet: { permissions: permissionId } },
        { new: true },
      );
    });

    it('should remove permission from role', async () => {
      const permissionId = new Types.ObjectId().toString();
      const updatedRole = { _id: mockRoleId, name: 'admin', permissions: [] };
      
      mockRoleModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedRole),
        }),
      });
      
      const result = await service.removePermissionFromRole(mockRoleId.toString(), permissionId);
      
      expect(result).toEqual(updatedRole);
      expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRoleId.toString(),
        { $pull: { permissions: permissionId } },
        { new: true },
      );
    });
  });
});
