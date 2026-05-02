import { Test, TestingModule } from '@nestjs/testing';
import { StaticsService } from './statics.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

describe('StaticsService', () => {
  let service: StaticsService;
  let mockUserModel: any;
  let mockRoleModel: any;
  let mockPermissionModel: any;

  beforeEach(async () => {
    mockUserModel = { countDocuments: jest.fn().mockResolvedValue(10) };
    mockRoleModel = { countDocuments: jest.fn().mockResolvedValue(5) };
    mockPermissionModel = { countDocuments: jest.fn().mockResolvedValue(25) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaticsService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        { provide: getModelToken(Permission.name), useValue: mockPermissionModel },
      ],
    }).compile();
    

    service = module.get<StaticsService>(StaticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return statistics with all counts', async () => {
      const stats = await service.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalUsers', 10);
      expect(stats).toHaveProperty('totalRoles', 5);
      expect(stats).toHaveProperty('totalPermissions', 25);
    });

    it('should call countDocuments on all models', async () => {
      await service.getStats();

      expect(mockUserModel.countDocuments).toHaveBeenCalled();
      expect(mockRoleModel.countDocuments).toHaveBeenCalled();
      expect(mockPermissionModel.countDocuments).toHaveBeenCalled();
    });

    it('should return correct structure when counts are zero', async () => {
      mockUserModel.countDocuments.mockResolvedValue(0);
      mockRoleModel.countDocuments.mockResolvedValue(0);
      mockPermissionModel.countDocuments.mockResolvedValue(0);

      const stats = await service.getStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.totalRoles).toBe(0);
      expect(stats.totalPermissions).toBe(0);
    });

    it('should handle large numbers', async () => {
      const largeNumber = 999999;
      mockUserModel.countDocuments.mockResolvedValue(largeNumber);

      const stats = await service.getStats();

      expect(stats.totalUsers).toBe(largeNumber);
    });
  });
});
