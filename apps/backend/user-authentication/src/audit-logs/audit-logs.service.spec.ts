import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  beforeEach(async () => {
    const mockAuditLogModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
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

  it('should have create method', () => {
    expect(typeof service.create).toBe('function');
  });

  it('should have findAll method', () => {
    expect(typeof service.findAll).toBe('function');
  });

  it('should have findById method', () => {
    expect(typeof service.findById).toBe('function');
  });

  it('should have delete method', () => {
    expect(typeof service.delete).toBe('function');
  });

  it('should have deleteOldLogs method', () => {
    expect(typeof service.deleteOldLogs).toBe('function');
  });
});
