import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { PermissionsSeedService } from './permissions.seed.service';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';

describe('PermissionsSeedService', () => {
  let service: PermissionsSeedService;
  let permissionModel: any;
  let roleModel: any;

  const allPermissionDocs = [{ _id: 'p1' }, { _id: 'p2' }, { _id: 'p3' }];

  const buildFindChain = (docs: any[]) => ({
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(docs),
  });

  beforeEach(async () => {
    permissionModel = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
    };

    roleModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        PermissionsSeedService,
        { provide: getModelToken(Permission.name), useValue: permissionModel },
        { provide: getModelToken(Role.name), useValue: roleModel },
      ],
    }).compile();

    service = module.get(PermissionsSeedService);
  });

  it('should seed permissions and assign them to known roles', async () => {
    permissionModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    permissionModel.find.mockImplementation((query?: any) => {
      if (!query) {
        return buildFindChain(allPermissionDocs);
      }

      return buildFindChain(allPermissionDocs.slice(0, 2));
    });

    roleModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'super_admin' },
        { _id: 'r2', name: 'director' },
        { _id: 'r3', name: 'project_manager' },
        { _id: 'r4', name: 'site_manager' },
        { _id: 'r5', name: 'works_manager' },
        { _id: 'r6', name: 'qhse_manager' },
        { _id: 'r7', name: 'accountant' },
        { _id: 'r8', name: 'client' },
      ]),
    });

    await service.onModuleInit();

    expect(permissionModel.create).toHaveBeenCalled();
    expect(roleModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should swallow seed errors and log them', async () => {
    const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);
    permissionModel.findOne.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('boom')) });

    await service.onModuleInit();

    expect(errorSpy).toHaveBeenCalled();
  });
});