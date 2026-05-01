import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Role } from './entities/role.entity';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const mockRoleModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    } as any;

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
});
