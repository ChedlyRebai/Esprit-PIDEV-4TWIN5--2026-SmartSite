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
