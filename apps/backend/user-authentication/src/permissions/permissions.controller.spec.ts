import { Test } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let permissionsService: any;

  beforeEach(async () => {
    permissionsService = {
      create: jest.fn().mockResolvedValue({ id: '1' }),
      findAll: jest.fn().mockResolvedValue([{ id: '1' }]),
      findById: jest.fn().mockResolvedValue({ id: '1' }),
      update: jest.fn().mockResolvedValue({ id: '1' }),
      remove: jest.fn().mockResolvedValue({ id: '1' }),
    };

    const module = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [{ provide: PermissionsService, useValue: permissionsService }],
    }).compile();

    controller = module.get(PermissionsController);
  });

  it('should create permission', async () => {
    await controller.create({ name: 'dashboard' });
    expect(permissionsService.create).toHaveBeenCalledWith({ name: 'dashboard' });
  });

  it('should list permissions', async () => {
    await controller.findAll();
    expect(permissionsService.findAll).toHaveBeenCalled();
  });

  it('should find, update, and remove a permission', async () => {
    await controller.findById('p1');
    await controller.update('p1', { name: 'roles' });
    await controller.remove('p1');

    expect(permissionsService.findById).toHaveBeenCalledWith('p1');
    expect(permissionsService.update).toHaveBeenCalledWith('p1', { name: 'roles' });
    expect(permissionsService.remove).toHaveBeenCalledWith('p1');
  });
});