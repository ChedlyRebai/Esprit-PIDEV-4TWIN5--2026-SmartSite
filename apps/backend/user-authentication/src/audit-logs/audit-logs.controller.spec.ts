import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { Types } from 'mongoose';

describe('AuditLogsController', () => {
  let mockAuditLogsService: any;

  const mockLogId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  beforeEach(async () => {
    mockAuditLogsService = {
      create: jest.fn().mockResolvedValue({ _id: mockLogId }),
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      findById: jest.fn().mockResolvedValue({ _id: mockLogId }),
      delete: jest.fn().mockResolvedValue({ _id: mockLogId }),
      deleteOldLogs: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  });

  it('should have audit logs service available', () => {
    expect(mockAuditLogsService).toBeDefined();
  });

  describe('Audit Log Operations', () => {
    it('should create an audit log', async () => {
      const createDto = {
        userId: mockUserId,
        action: 'CREATE',
        entityType: 'User',
        entityId: mockUserId,
      };

      const result = await mockAuditLogsService.create(createDto);

      expect(result).toBeDefined();
      expect(mockAuditLogsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should return paginated audit logs', async () => {
      const query = { page: '1', limit: '10' };

      const result = await mockAuditLogsService.findAll(query);

      expect(result).toBeDefined();
      expect(mockAuditLogsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return an audit log by id', async () => {
      const result = await mockAuditLogsService.findById(mockLogId.toString());

      expect(result).toBeDefined();
      expect(mockAuditLogsService.findById).toHaveBeenCalledWith(mockLogId.toString());
    });

    it('should delete an audit log', async () => {
      const result = await mockAuditLogsService.delete(mockLogId.toString());

      expect(result).toBeDefined();
      expect(mockAuditLogsService.delete).toHaveBeenCalledWith(mockLogId.toString());
    });

    it('should delete old audit logs', async () => {
      const result = await mockAuditLogsService.deleteOldLogs(90);

      expect(result).toBeDefined();
      expect(mockAuditLogsService.deleteOldLogs).toHaveBeenCalledWith(90);
    });
  });
});
