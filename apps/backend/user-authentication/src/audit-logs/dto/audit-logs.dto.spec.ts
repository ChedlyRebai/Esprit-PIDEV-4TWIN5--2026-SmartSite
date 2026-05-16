import { validateSync } from 'class-validator';
import { CreateAuditLogDto } from './create-audit-log.dto';
import { QueryAuditLogsDto } from './query-audit-logs.dto';

describe('audit logs dto', () => {
  it('should validate create audit log dto', () => {
    const dto = Object.assign(new CreateAuditLogDto(), {
      actionType: 'view',
      actionLabel: 'opened page',
      resourceType: 'page',
      resourceId: 'r1',
      severity: 'normal',
      status: 'success',
      details: 'details',
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should validate query audit logs dto', () => {
    const dto = Object.assign(new QueryAuditLogsDto(), {
      userId: 'u1',
      userCin: '12345678',
      actionType: 'view',
      severity: 'normal',
      status: 'success',
      keyword: 'login',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(validateSync(dto)).toHaveLength(0);
  });
});