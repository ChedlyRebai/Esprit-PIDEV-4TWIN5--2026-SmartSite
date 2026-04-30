import { SiteSchema } from '../entities/site.entity';
import { TeamSchema } from '../entities/team.entity';
import { UserSimpleSchema } from '../entities/user-simple.entity';

describe('Site Entity Schema', () => {
  it('should have required fields defined', () => {
    const siteObj = SiteSchema.obj as any;
    expect(siteObj.nom).toBeDefined();
    expect(siteObj.adresse).toBeDefined();
    expect(siteObj.localisation).toBeDefined();
    expect(siteObj.budget).toBeDefined();
  });

  it('should have default values', () => {
    const siteObj = SiteSchema.obj as any;
    expect(siteObj.isActif.default).toBe(true);
    expect(siteObj.status.default).toBe('planning');
    expect(siteObj.progress.default).toBe(0);
    expect(siteObj.area.default).toBe(0);
  });

  it('should have valid status enum', () => {
    const siteObj = SiteSchema.obj as any;
    expect(siteObj.status.enum).toContain('planning');
    expect(siteObj.status.enum).toContain('in_progress');
    expect(siteObj.status.enum).toContain('on_hold');
    expect(siteObj.status.enum).toContain('completed');
  });

  it('should have teamIds as array', () => {
    const siteObj = SiteSchema.obj as any;
    expect(Array.isArray(siteObj.teamIds.type)).toBe(true);
    expect(siteObj.teamIds.default).toEqual([]);
  });

  it('should apply toJSON transform', () => {
    const mockDoc = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      __v: 0,
      nom: 'Test Site',
    };
    const options = (SiteSchema as any).options;
    const transform = options?.toJSON?.transform;
    if (transform) {
      const ret: any = { ...mockDoc };
      transform(mockDoc, ret);
      expect(ret.id).toBe('507f1f77bcf86cd799439011');
      expect(ret._id).toBeUndefined();
      expect(ret.__v).toBeUndefined();
    }
  });

  it('should apply toObject transform', () => {
    const mockDoc = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      __v: 0,
      nom: 'Test Site',
    };
    const options = (SiteSchema as any).options;
    const transform = options?.toObject?.transform;
    if (transform) {
      const ret: any = { ...mockDoc };
      transform(mockDoc, ret);
      expect(ret.id).toBe('507f1f77bcf86cd799439011');
    }
  });
});

describe('Team Entity Schema', () => {
  it('should have required fields defined', () => {
    const teamObj = TeamSchema.obj as any;
    expect(teamObj.name).toBeDefined();
  });

  it('should have default values', () => {
    const teamObj = TeamSchema.obj as any;
    expect(teamObj.isActive.default).toBe(true);
    expect(teamObj.members.default).toEqual([]);
  });

  it('should apply toJSON transform', () => {
    const mockDoc = {
      _id: { toString: () => 'team-id-123' },
      __v: 0,
      name: 'Team A',
    };
    const options = (TeamSchema as any).options;
    const transform = options?.toJSON?.transform;
    if (transform) {
      const ret: any = { ...mockDoc };
      transform(mockDoc, ret);
      expect(ret.id).toBe('team-id-123');
      expect(ret._id).toBeUndefined();
    }
  });

  it('should apply toObject transform', () => {
    const mockDoc = {
      _id: { toString: () => 'team-id-123' },
      __v: 0,
    };
    const options = (TeamSchema as any).options;
    const transform = options?.toObject?.transform;
    if (transform) {
      const ret: any = { ...mockDoc };
      transform(mockDoc, ret);
      expect(ret.id).toBe('team-id-123');
    }
  });
});

describe('UserSimple Entity Schema', () => {
  it('should have required fields defined', () => {
    const userObj = UserSimpleSchema.obj as any;
    expect(userObj.firstName).toBeDefined();
    expect(userObj.lastName).toBeDefined();
    expect(userObj.cin).toBeDefined();
  });

  it('should have default values', () => {
    const userObj = UserSimpleSchema.obj as any;
    expect(userObj.isActif.default).toBe(true);
    expect(userObj.responsibilities.default).toBe('worker');
  });
});
