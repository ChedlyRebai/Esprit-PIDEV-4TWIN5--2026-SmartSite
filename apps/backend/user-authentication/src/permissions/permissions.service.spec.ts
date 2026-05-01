import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Permission } from './entities/permission.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const mockPermissionModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    } as any;

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
});
