import { describe, it, expect } from 'vitest';
import { cn } from './lib/utils';
import {
  incidentMatchesSearch,
  taskMatchesSearch,
  type Incident,
  type Task,
} from './utils/incidentSearchFilter';

// ─── cn (classnames utility) ─────────────────────────────────────────────────

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn(undefined, null as any, 'text-sm')).toBe('text-sm');
  });

  it('returns empty string when no args', () => {
    expect(cn()).toBe('');
  });
});

// ─── incidentMatchesSearch ────────────────────────────────────────────────────

describe('incidentMatchesSearch', () => {
  const incident: Incident = {
    _id: '1',
    title: 'Fire alarm triggered',
    type: 'safety',
    description: 'Alarm went off in building A',
    severity: 'high',
    status: 'open',
    assignedTo: 'John Doe',
  };

  it('returns true when search is empty', () => {
    expect(incidentMatchesSearch(incident, '')).toBe(true);
  });

  it('returns true when search is only spaces', () => {
    expect(incidentMatchesSearch(incident, '   ')).toBe(true);
  });

  it('matches by title (case insensitive)', () => {
    expect(incidentMatchesSearch(incident, 'fire')).toBe(true);
    expect(incidentMatchesSearch(incident, 'FIRE')).toBe(true);
  });

  it('matches by type', () => {
    expect(incidentMatchesSearch(incident, 'safety')).toBe(true);
  });

  it('matches by severity', () => {
    expect(incidentMatchesSearch(incident, 'high')).toBe(true);
  });

  it('matches by status', () => {
    expect(incidentMatchesSearch(incident, 'open')).toBe(true);
  });

  it('matches by assignedTo', () => {
    expect(incidentMatchesSearch(incident, 'john')).toBe(true);
  });

  it('matches by description', () => {
    expect(incidentMatchesSearch(incident, 'building A')).toBe(true);
  });

  it('returns false when no field matches', () => {
    expect(incidentMatchesSearch(incident, 'xyz_no_match')).toBe(false);
  });

  it('handles incident with missing fields', () => {
    const partial: Incident = { title: 'Leak detected' };
    expect(incidentMatchesSearch(partial, 'leak')).toBe(true);
    expect(incidentMatchesSearch(partial, 'safety')).toBeFalsy();
  });
});

// ─── taskMatchesSearch ────────────────────────────────────────────────────────

describe('taskMatchesSearch', () => {
  const task: Task = {
    _id: '42',
    title: 'Install scaffolding',
    status: 'in_progress',
    priority: 'high',
    description: 'Set up scaffolding on the east wing',
  };

  it('returns true when search is empty', () => {
    expect(taskMatchesSearch(task, '')).toBe(true);
  });

  it('matches by title', () => {
    expect(taskMatchesSearch(task, 'scaffolding')).toBe(true);
  });

  it('matches by status', () => {
    expect(taskMatchesSearch(task, 'in_progress')).toBe(true);
  });

  it('matches by priority', () => {
    expect(taskMatchesSearch(task, 'high')).toBe(true);
  });

  it('matches by description', () => {
    expect(taskMatchesSearch(task, 'east wing')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(taskMatchesSearch(task, 'INSTALL')).toBe(true);
  });

  it('returns false when no field matches', () => {
    expect(taskMatchesSearch(task, 'xyz_no_match')).toBe(false);
  });

  it('handles task with missing fields', () => {
    const partial: Task = { title: 'Inspection' };
    expect(taskMatchesSearch(partial, 'inspection')).toBe(true);
    expect(taskMatchesSearch(partial, 'high')).toBeFalsy();
  });
});
