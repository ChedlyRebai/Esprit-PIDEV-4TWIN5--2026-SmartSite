import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let mockAuditLogModel: any;

  
  beforeEach(async () => {
    mockAuditLogModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
      findOne: jest.fn(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();


    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should have createLog method', () => {
      expect(typeof service.createLog).toBe('function');
    });
  });

  describe('findAll', () => {
    it('should find all audit logs with query', async () => {
      const query: QueryAuditLogsDto = {
        userId: '123',
        actionType: 'LOGIN',
      };

      const mockLogs = [
        { userId: '123', actionType: 'LOGIN', status: 'success' },
      ];

      mockAuditLogModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await service.findAll(query);

      expect(mockAuditLogModel.find).toHaveBeenCalled();
    });

    it('should filter by userId', async () => {
      const query: QueryAuditLogsDto = { userId: '123' };

      mockAuditLogModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await service.findAll(query);

      expect(mockAuditLogModel.find).toHaveBeenCalled();
    });

    it('should filter by severity', async () => {
      const query: QueryAuditLogsDto = { severity: 'high' };

      mockAuditLogModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await service.findAll(query);

      expect(mockAuditLogModel.find).toHaveBeenCalled();
    });
  });

  describe('findLatestLogin', () => {
    it('should find latest login for user', async () => {
      const userId = '123';
      const mockLogin = {
        userId: '123',
        actionType: 'login',
        status: 'success',
        createdAt: new Date(),
      };

      mockAuditLogModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogin),
        }),
      });

      const result = await service.findLatestLogin(userId);

      expect(mockAuditLogModel.findOne).toHaveBeenCalled();
    });
  });

  describe('getRetentionDays', () => {
    it('should return retention days', () => {
      const days = service.getRetentionDays();

      expect(days).toBeDefined();
      expect(typeof days).toBe('number');
      expect(days).toBeGreaterThan(0);
    });
  });

  it('should have createLog method', () => {
    expect(typeof service.createLog).toBe('function');
  });

  it('should have findAll method', () => {
    expect(typeof service.findAll).toBe('function');
  });

  it('should have findLatestLogin method', () => {
    expect(typeof service.findLatestLogin).toBe('function');
  });

  it('should have getRetentionDays method', () => {
    expect(typeof service.getRetentionDays).toBe('function');
  });
});
