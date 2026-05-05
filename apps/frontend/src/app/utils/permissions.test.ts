import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canEdit,
  canCreate,
  canDelete,
  canUpdate,
  type Permission,
} from './permissions';
import type { RoleType } from '../types';

// ─── hasPermission ────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('super_admin has all permissions', () => {
    const allPermissions: Permission[] = [
      'view_dashboard', 'manage_sites', 'manage_projects', 'manage_team',
      'manage_clients', 'manage_suppliers', 'manage_materials', 'manage_finance',
      'manage_qhse', 'manage_incidents', 'manage_users', 'view_analytics', 'view_reports',
    ];
    allPermissions.forEach(p => {
      expect(hasPermission('super_admin', p)).toBe(true);
    });
  });

  it('client only has view_dashboard and view_reports', () => {
    expect(hasPermission('client', 'view_dashboard')).toBe(true);
    expect(hasPermission('client', 'view_reports')).toBe(true);
    expect(hasPermission('client', 'manage_sites')).toBe(false);
    expect(hasPermission('client', 'manage_users')).toBe(false);
    expect(hasPermission('client', 'manage_finance')).toBe(false);
  });

  it('subcontractor only has view_dashboard', () => {
    expect(hasPermission('subcontractor', 'view_dashboard')).toBe(true);
    expect(hasPermission('subcontractor', 'manage_sites')).toBe(false);
    expect(hasPermission('subcontractor', 'view_reports')).toBe(false);
  });

  it('user only has view_dashboard', () => {
    expect(hasPermission('user', 'view_dashboard')).toBe(true);
    expect(hasPermission('user', 'manage_projects')).toBe(false);
  });

  it('director has manage_finance but not manage_users', () => {
    expect(hasPermission('director', 'manage_finance')).toBe(true);
    expect(hasPermission('director', 'manage_users')).toBe(false);
  });

  it('director has view_analytics and view_reports', () => {
    expect(hasPermission('director', 'view_analytics')).toBe(true);
    expect(hasPermission('director', 'view_reports')).toBe(true);
  });

  it('project_manager has manage_projects but not manage_finance', () => {
    expect(hasPermission('project_manager', 'manage_projects')).toBe(true);
    expect(hasPermission('project_manager', 'manage_finance')).toBe(false);
  });

  it('project_manager has manage_incidents', () => {
    expect(hasPermission('project_manager', 'manage_incidents')).toBe(true);
  });

  it('site_manager has manage_qhse and manage_materials', () => {
    expect(hasPermission('site_manager', 'manage_qhse')).toBe(true);
    expect(hasPermission('site_manager', 'manage_materials')).toBe(true);
  });

  it('site_manager does not have manage_finance or view_analytics', () => {
    expect(hasPermission('site_manager', 'manage_finance')).toBe(false);
    expect(hasPermission('site_manager', 'view_analytics')).toBe(false);
  });

  it('works_manager has manage_materials and view_analytics', () => {
    expect(hasPermission('works_manager', 'manage_materials')).toBe(true);
    expect(hasPermission('works_manager', 'view_analytics')).toBe(true);
  });

  it('works_manager does not have manage_finance or manage_users', () => {
    expect(hasPermission('works_manager', 'manage_finance')).toBe(false);
    expect(hasPermission('works_manager', 'manage_users')).toBe(false);
  });

  it('accountant has manage_finance and manage_clients', () => {
    expect(hasPermission('accountant', 'manage_finance')).toBe(true);
    expect(hasPermission('accountant', 'manage_clients')).toBe(true);
  });

  it('accountant does not have manage_sites or manage_incidents', () => {
    expect(hasPermission('accountant', 'manage_sites')).toBe(false);
    expect(hasPermission('accountant', 'manage_incidents')).toBe(false);
  });

  it('procurement_manager has manage_suppliers and manage_materials', () => {
    expect(hasPermission('procurement_manager', 'manage_suppliers')).toBe(true);
    expect(hasPermission('procurement_manager', 'manage_materials')).toBe(true);
  });

  it('procurement_manager does not have manage_finance or manage_users', () => {
    expect(hasPermission('procurement_manager', 'manage_finance')).toBe(false);
    expect(hasPermission('procurement_manager', 'manage_users')).toBe(false);
  });

  it('qhse_manager has manage_qhse and manage_incidents', () => {
    expect(hasPermission('qhse_manager', 'manage_qhse')).toBe(true);
    expect(hasPermission('qhse_manager', 'manage_incidents')).toBe(true);
    expect(hasPermission('qhse_manager', 'view_reports')).toBe(true);
  });

  it('qhse_manager does not have manage_finance or manage_users', () => {
    expect(hasPermission('qhse_manager', 'manage_finance')).toBe(false);
    expect(hasPermission('qhse_manager', 'manage_users')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown_role' as RoleType, 'view_dashboard')).toBe(false);
  });
});

// ─── canEdit ─────────────────────────────────────────────────────────────────

describe('canEdit', () => {
  it('super_admin can edit all resources', () => {
    const resources = ['sites', 'projects', 'team', 'clients', 'suppliers', 'materials', 'finance', 'qhse', 'incidents', 'users'] as const;
    resources.forEach(r => {
      expect(canEdit('super_admin', r)).toBe(true);
    });
  });

  it('client cannot edit any resource', () => {
    const resources = ['sites', 'projects', 'team', 'clients', 'suppliers', 'materials', 'finance', 'qhse', 'incidents', 'users'] as const;
    resources.forEach(r => {
      expect(canEdit('client', r)).toBe(false);
    });
  });

  it('accountant can edit finance but not sites', () => {
    expect(canEdit('accountant', 'finance')).toBe(true);
    expect(canEdit('accountant', 'sites')).toBe(false);
  });

  it('qhse_manager can edit qhse and incidents', () => {
    expect(canEdit('qhse_manager', 'qhse')).toBe(true);
    expect(canEdit('qhse_manager', 'incidents')).toBe(true);
    expect(canEdit('qhse_manager', 'finance')).toBe(false);
  });

  it('procurement_manager can edit suppliers and materials', () => {
    expect(canEdit('procurement_manager', 'suppliers')).toBe(true);
    expect(canEdit('procurement_manager', 'materials')).toBe(true);
    expect(canEdit('procurement_manager', 'users')).toBe(false);
  });
});

// ─── canCreate / canDelete / canUpdate ───────────────────────────────────────

describe('canCreate / canDelete / canUpdate', () => {
  it('canCreate is same as canEdit', () => {
    expect(canCreate('super_admin', 'sites')).toBe(canEdit('super_admin', 'sites'));
    expect(canCreate('client', 'sites')).toBe(canEdit('client', 'sites'));
    expect(canCreate('accountant', 'finance')).toBe(canEdit('accountant', 'finance'));
  });

  it('canDelete is same as canEdit', () => {
    expect(canDelete('director', 'projects')).toBe(canEdit('director', 'projects'));
    expect(canDelete('subcontractor', 'materials')).toBe(canEdit('subcontractor', 'materials'));
  });

  it('canUpdate is same as canEdit', () => {
    expect(canUpdate('site_manager', 'materials')).toBe(canEdit('site_manager', 'materials'));
    expect(canUpdate('user', 'users')).toBe(canEdit('user', 'users'));
  });
});
