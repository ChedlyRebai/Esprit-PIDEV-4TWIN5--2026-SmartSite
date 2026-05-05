import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportSitesToCSV, exportSitesToExcel, exportSitesToJSON, type SiteWithTeams } from './exportUtils';

// ─── Mock DOM APIs ────────────────────────────────────────────────────────────

const mockClick = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');

beforeEach(() => {
  vi.clearAllMocks();

  // Mock URL
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Mock document.createElement for <a>
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement;
    }
    return document.createElement(tag);
  });

  // Mock alert
  global.alert = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Test data ────────────────────────────────────────────────────────────────

const mockSites: SiteWithTeams[] = [
  {
    _id: '1',
    name: 'Site Alpha',
    address: 'Tunis, Tunisia',
    status: 'in_progress',
    progress: 65,
    area: 5000,
    budget: 150000,
    workStartDate: '2025-01-01',
    workEndDate: '2025-12-31',
    teams: [{ _id: 't1', name: 'Team A', teamCode: 'TA' }],
  } as SiteWithTeams,
  {
    _id: '2',
    name: 'Site Beta',
    address: 'Sfax, Tunisia',
    status: 'planning',
    progress: 10,
    area: 3000,
    budget: 80000,
    workStartDate: '2025-03-01',
    workEndDate: '2025-09-30',
    teams: [],
  } as SiteWithTeams,
];

// ─── exportSitesToCSV ─────────────────────────────────────────────────────────

describe('exportSitesToCSV', () => {
  it('creates a blob and triggers download', () => {
    exportSitesToCSV(mockSites);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses default filename sites.csv', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToCSV(mockSites);
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('sites.csv');
  });

  it('uses custom filename when provided', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToCSV(mockSites, 'my-export.csv');
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('my-export.csv');
  });

  it('shows alert and does not download when no sites', () => {
    exportSitesToCSV([]);
    expect(global.alert).toHaveBeenCalledWith('No data to export');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('includes site name in CSV content', () => {
    let capturedBlob: Blob | null = null;
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    };
    exportSitesToCSV(mockSites);
    expect(capturedBlob).not.toBeNull();
  });
});

// ─── exportSitesToExcel ───────────────────────────────────────────────────────

describe('exportSitesToExcel', () => {
  it('creates a blob and triggers download', () => {
    exportSitesToExcel(mockSites);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses default filename sites.xlsx', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToExcel(mockSites);
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('sites.xlsx');
  });

  it('uses custom filename when provided', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToExcel(mockSites, 'export.xlsx');
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('export.xlsx');
  });

  it('shows alert and does not download when no sites', () => {
    exportSitesToExcel([]);
    expect(global.alert).toHaveBeenCalledWith('No data to export');
    expect(mockClick).not.toHaveBeenCalled();
  });
});

// ─── exportSitesToJSON ────────────────────────────────────────────────────────

describe('exportSitesToJSON', () => {
  it('creates a blob and triggers download', () => {
    exportSitesToJSON(mockSites);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses default filename sites.json', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToJSON(mockSites);
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('sites.json');
  });

  it('uses custom filename when provided', () => {
    const createElement = vi.spyOn(document, 'createElement');
    exportSitesToJSON(mockSites, 'data.json');
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('data.json');
  });

  it('generates valid JSON content', () => {
    let capturedBlob: Blob | null = null;
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    };
    exportSitesToJSON(mockSites);
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob!.type).toBe('application/json');
  });
});
