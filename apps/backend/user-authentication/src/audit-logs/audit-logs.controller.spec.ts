import { ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { User } from '../users/entities/user.entity';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let auditLogsService: any;
  let userModel: any;

  const mockLogId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  const mockUserQuery = (roleName: string, extra: Record<string, any> = {}) => {
    const currentUser = {
      _id: mockUserId,
      cin: '12345678',
      firstname: 'Audit',
      lastname: 'Admin',
      role: { name: roleName },
      ...extra,
    };

    const exec = jest.fn().mockResolvedValue(currentUser);
    const populate = jest.fn().mockReturnValue({ exec });
    userModel.findById.mockReturnValue({ populate });
  };

  beforeEach(async () => {
    auditLogsService = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      getRetentionDays: jest.fn().mockReturnValue(90),
      createLog: jest.fn().mockResolvedValue({ _id: mockLogId }),
    };

    userModel = {
      findById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    controller = module.get(AuditLogsController);
  });

  it('should deny non super admins in findAll', async () => {
    mockUserQuery('user');

    await expect(controller.findAll({ userId: 'x' } as any, { user: { sub: 'x' } } as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should return audit logs for super admins', async () => {
    mockUserQuery('super_admin');

    const result = await controller.findAll({ keyword: 'login' } as any, { user: { sub: 'x' } } as any);

    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    expect(auditLogsService.findAll).toHaveBeenCalledWith({ keyword: 'login' });
  });

  it('should return retention only for super admins', async () => {
    mockUserQuery('super_admin');

    const result = await controller.getRetention({ user: { sub: 'x' } } as any);

    expect(result).toEqual({ retentionDays: 90, deletionPolicy: 'manual_delete_disabled' });
  });

  it('should track an event with defaults applied', async () => {
    mockUserQuery('admin');

    await controller.trackEvent(
      { resourceType: 'project', resourceId: 'p1' } as any,
      { user: { sub: 'x' }, ip: '10.0.0.1' } as any,
    );

    expect(auditLogsService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: String(mockUserId),
        userCin: '12345678',
        userName: 'Audit Admin',
        userRole: 'admin',
        actionType: 'view',
        actionLabel: 'Tracked event',
        status: 'success',
        severity: 'normal',
        ipAddress: '10.0.0.1',
      }),
    );
  });

  it('should track an event with explicit values', async () => {
    mockUserQuery('admin');

    await controller.trackEvent(
      {
        actionType: 'create',
        actionLabel: 'Created project',
        resourceType: 'project',
        resourceId: 'p2',
        status: 'error',
        severity: 'high',
        details: 'failed validation',
      } as any,
      { user: { userId: 'x' }, ip: '127.0.0.1' } as any,
    );

    expect(auditLogsService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'create',
        actionLabel: 'Created project',
        status: 'error',
        severity: 'high',
        details: 'failed validation',
      }),
    );
  });
});
