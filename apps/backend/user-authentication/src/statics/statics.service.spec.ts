import { Test, TestingModule } from '@nestjs/testing';
import { StaticsService } from './statics.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

describe('StaticsService', () => {
  let service: StaticsService;

  beforeEach(async () => {
    const mockUserModel = { countDocuments: jest.fn().mockResolvedValue(1) } as any;
    const mockRoleModel = { countDocuments: jest.fn().mockResolvedValue(2) } as any;
    const mockPermissionModel = { countDocuments: jest.fn().mockResolvedValue(3) } as any;

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
});
