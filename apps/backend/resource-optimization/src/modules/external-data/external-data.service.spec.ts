import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ExternalDataService } from './external-data.service';

const mockSiteData = {
  _id: 'site-123',
  nom: 'Test Site',
  localisation: 'Paris',
  status: 'active',
  budget: 10000,
  isActif: true,
  teamIds: ['team-1'],
  dateDebut: new Date(),
};

const mockTeams = [{ _id: 'team-1', name: 'Team A', email: 'a@a.com', role: 'manager', isActif: true }];
const mockMilestones = [
  { _id: 'ms-1', title: 'Milestone 1', status: 'pending', siteId: 'site-123', startDate: new Date(), dueDate: new Date() },
  { _id: 'ms-2', title: 'Milestone 2', status: 'completed', siteId: 'site-123', startDate: new Date(), dueDate: new Date() },
];
const mockTasks = [
  { _id: 'task-1', title: 'Task 1', status: 'in_progress', priority: 'high', siteId: 'site-123' },
  { _id: 'task-2', title: 'Task 2', status: 'completed', priority: 'medium', siteId: 'site-123' },
];
const mockIncidents = [
  { _id: 'inc-1', type: 'safety', severity: 'high', title: 'Incident 1', status: 'open', siteId: 'site-123' },
];
const mockProjectData = { _id: 'proj-1', name: 'Project 1', status: 'active', budget: 50000 };
const mockProjectSites = [
  { _id: 'site-1', nom: 'Site 1', budget: 10000, status: 'active', teamIds: [], projectId: 'proj-1' },
];
const mockUsers = [{ _id: 'user-1', name: 'User 1', email: 'u@u.com', role: 'admin', isActif: true }];

const mockHttpService = {
  get: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      GESTION_SITE_URL: 'http://localhost:3001/api',
      GESTION_PROJECT_URL: 'http://localhost:3010',
      AUTH_API_URL: 'http://localhost:3000',
      PLANNING_URL: 'http://localhost:3002',
      INCIDENT_URL: 'http://localhost:3003',
    };
    return config[key] || null;
  }),
};

describe('ExternalDataService', () => {
  let service: ExternalDataService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalDataService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ExternalDataService>(ExternalDataService);
  });

  describe('getSiteData', () => {
    it('retourne les données du site', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockSiteData }));
      const result = await service.getSiteData('site-123');
      expect(result).toEqual(mockSiteData);
    });

    it('retourne null si siteId est vide', async () => {
      const result = await service.getSiteData('');
      expect(result).toBeNull();
    });

    it('retourne null en cas d\'erreur HTTP', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));
      const result = await service.getSiteData('site-123');
      expect(result).toBeNull();
    });
  });

  describe('getSiteTeams', () => {
    it('retourne les équipes du site', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockTeams }));
      const result = await service.getSiteTeams('site-123');
      expect(result).toEqual(mockTeams);
    });

    it('retourne un tableau vide si siteId est vide', async () => {
      const result = await service.getSiteTeams('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getSiteTeams('site-123');
      expect(result).toEqual([]);
    });
  });

  describe('getSiteMilestones', () => {
    it('retourne les jalons du site', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockMilestones }));
      const result = await service.getSiteMilestones('site-123');
      expect(result).toEqual(mockMilestones);
    });

    it('retourne un tableau vide si siteId est vide', async () => {
      const result = await service.getSiteMilestones('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getSiteMilestones('site-123');
      expect(result).toEqual([]);
    });
  });

  describe('getSiteTasks', () => {
    it('retourne les tâches via les jalons', async () => {
      mockHttpService.get
        .mockReturnValueOnce(of({ data: mockMilestones })) // milestones
        .mockReturnValueOnce(of({ data: mockTasks })) // tasks for ms-1
        .mockReturnValueOnce(of({ data: [] })); // tasks for ms-2

      const result = await service.getSiteTasks('site-123');
      expect(result).toEqual(mockTasks);
    });

    it('retourne un tableau vide si siteId est vide', async () => {
      const result = await service.getSiteTasks('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide si aucun jalon', async () => {
      mockHttpService.get.mockReturnValue(of({ data: [] }));
      const result = await service.getSiteTasks('site-123');
      expect(result).toEqual([]);
    });

    it('gère les réponses groupées (avec tasks)', async () => {
      mockHttpService.get
        .mockReturnValueOnce(of({ data: [mockMilestones[0]] }))
        .mockReturnValueOnce(of({ data: [{ tasks: mockTasks }] }));

      const result = await service.getSiteTasks('site-123');
      expect(result).toEqual(mockTasks);
    });

    it('retourne un tableau vide en cas d\'erreur globale', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getSiteTasks('site-123');
      expect(result).toEqual([]);
    });
  });

  describe('getSiteIncidents', () => {
    it('retourne les incidents du site', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockIncidents }));
      const result = await service.getSiteIncidents('site-123');
      expect(result).toEqual(mockIncidents);
    });

    it('retourne un tableau vide si siteId est vide', async () => {
      const result = await service.getSiteIncidents('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getSiteIncidents('site-123');
      expect(result).toEqual([]);
    });
  });

  describe('getAllSiteData', () => {
    it('retourne toutes les données agrégées du site', async () => {
      mockHttpService.get
        .mockReturnValueOnce(of({ data: mockSiteData }))   // site
        .mockReturnValueOnce(of({ data: mockTeams }))       // teams
        .mockReturnValueOnce(of({ data: mockMilestones }))  // milestones (for tasks)
        .mockReturnValueOnce(of({ data: mockTasks }))       // tasks for ms-1
        .mockReturnValueOnce(of({ data: [] }))              // tasks for ms-2
        .mockReturnValueOnce(of({ data: mockMilestones }))  // milestones
        .mockReturnValueOnce(of({ data: mockIncidents }));  // incidents

      const result = await service.getAllSiteData('site-123');
      expect(result).toHaveProperty('site');
      expect(result).toHaveProperty('teams');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('milestones');
      expect(result).toHaveProperty('incidents');
      expect(result).toHaveProperty('siteStats');
    });

    it('calcule correctement les statistiques du site', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('/gestion-sites/site-123')) return of({ data: mockSiteData });
        if (url.includes('/teams')) return of({ data: mockTeams });
        if (url.includes('/milestone?siteId')) return of({ data: [] }); // no milestones = no tasks
        if (url.includes('/incidents/by-site/')) return of({ data: mockIncidents });
        return of({ data: [] });
      });

      const result = await service.getAllSiteData('site-123');
      expect(result.siteStats.totalBudget).toBe(10000);
      expect(result.siteStats.openIncidents).toBe(1); // open
      expect(result).toHaveProperty('siteStats');
    });
  });

  describe('getProjectData', () => {
    it('retourne les données du projet', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockProjectData }));
      const result = await service.getProjectData('proj-1');
      expect(result).toEqual(mockProjectData);
    });

    it('retourne null si projectId est vide', async () => {
      const result = await service.getProjectData('');
      expect(result).toBeNull();
    });

    it('retourne null en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getProjectData('proj-1');
      expect(result).toBeNull();
    });
  });

  describe('getProjectSites', () => {
    it('retourne les sites du projet', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockProjectSites }));
      const result = await service.getProjectSites('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Site 1');
    });

    it('gère la réponse avec data.data', async () => {
      mockHttpService.get.mockReturnValue(of({ data: { data: mockProjectSites } }));
      const result = await service.getProjectSites('proj-1');
      expect(result).toHaveLength(1);
    });

    it('retourne un tableau vide si projectId est vide', async () => {
      const result = await service.getProjectSites('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getProjectSites('proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('getProjectTasks', () => {
    it('retourne les tâches du projet', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockTasks }));
      const result = await service.getProjectTasks('proj-1');
      expect(result).toEqual(mockTasks);
    });

    it('retourne un tableau vide si projectId est vide', async () => {
      const result = await service.getProjectTasks('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getProjectTasks('proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('getProjectMilestones', () => {
    it('retourne les jalons du projet', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockMilestones }));
      const result = await service.getProjectMilestones('proj-1');
      expect(result).toEqual(mockMilestones);
    });

    it('retourne un tableau vide si projectId est vide', async () => {
      const result = await service.getProjectMilestones('');
      expect(result).toEqual([]);
    });
  });

  describe('getProjectIncidents', () => {
    it('retourne les incidents du projet', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockIncidents }));
      const result = await service.getProjectIncidents('proj-1');
      expect(result).toEqual(mockIncidents);
    });

    it('retourne un tableau vide si projectId est vide', async () => {
      const result = await service.getProjectIncidents('');
      expect(result).toEqual([]);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getProjectIncidents('proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('getProjectContext', () => {
    it('retourne le contexte complet du projet', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('/projects/')) return of({ data: mockProjectData });
        if (url.includes('gestion-sites?projectId')) return of({ data: mockProjectSites });
        if (url.includes('/task/gantt/')) return of({ data: mockTasks });
        if (url.includes('/milestone/project/')) return of({ data: mockMilestones });
        if (url.includes('/incidents/by-project/')) return of({ data: mockIncidents });
        return of({ data: [] });
      });

      const result = await service.getProjectContext('proj-1');
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('sites');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('milestones');
      expect(result).toHaveProperty('incidents');
      expect(result).toHaveProperty('projectStats');
    });

    it('inclut les données du site si siteId fourni', async () => {
      // All 8 parallel calls: getProjectData, getProjectSites, getProjectTasks, getProjectMilestones, getSiteData, getSiteTeams, getProjectIncidents, getSiteIncidents
      // Use a mock that returns appropriate data based on URL
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('/projects/')) return of({ data: mockProjectData });
        if (url.includes('gestion-sites?projectId')) return of({ data: mockProjectSites });
        if (url.includes('/task/gantt/')) return of({ data: mockTasks });
        if (url.includes('/milestone/project/')) return of({ data: mockMilestones });
        if (url.includes('/gestion-sites/site-123')) return of({ data: mockSiteData });
        if (url.includes('/teams')) return of({ data: mockTeams });
        if (url.includes('/incidents/by-project/')) return of({ data: mockIncidents });
        if (url.includes('/incidents/by-site/')) return of({ data: [] });
        return of({ data: [] });
      });

      const result = await service.getProjectContext('proj-1', 'site-123');
      expect(result.site).toEqual(mockSiteData);
      expect(result.siteStats).toBeDefined();
    });

    it('déduplique les incidents par _id', async () => {
      const duplicateIncident = { ...mockIncidents[0] };
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('/projects/')) return of({ data: mockProjectData });
        if (url.includes('gestion-sites?projectId')) return of({ data: [] });
        if (url.includes('/task/gantt/')) return of({ data: [] });
        if (url.includes('/milestone/project/')) return of({ data: [] });
        if (url.includes('/gestion-sites/site-123')) return of({ data: mockSiteData });
        if (url.includes('/teams')) return of({ data: [] });
        if (url.includes('/incidents/by-project/')) return of({ data: [mockIncidents[0]] });
        if (url.includes('/incidents/by-site/')) return of({ data: [duplicateIncident] });
        return of({ data: [] });
      });

      const result = await service.getProjectContext('proj-1', 'site-123');
      expect(result.incidents).toHaveLength(1); // deduplicated
    });

    it('calcule les statistiques du projet', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('/projects/')) return of({ data: mockProjectData });
        if (url.includes('gestion-sites?projectId')) return of({ data: mockProjectSites });
        if (url.includes('/task/gantt/')) return of({ data: mockTasks });
        if (url.includes('/milestone/project/')) return of({ data: mockMilestones });
        if (url.includes('/incidents/by-project/')) return of({ data: mockIncidents });
        if (url.includes('/incidents/by-site/')) return of({ data: [] });
        return of({ data: [] });
      });

      const result = await service.getProjectContext('proj-1');
      expect(result.projectStats.totalBudget).toBe(50000);
      expect(result.projectStats.totalSitesBudget).toBe(10000);
      expect(result.projectStats.taskCount).toBe(2);
      expect(result.projectStats.completedTasks).toBe(1);
    });
  });

  describe('getUsers', () => {
    it('retourne les utilisateurs', async () => {
      mockHttpService.get.mockReturnValue(of({ data: mockUsers }));
      const result = await service.getUsers();
      expect(Array.isArray(result)).toBe(true);
    });

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Error')));
      const result = await service.getUsers();
      expect(result).toEqual([]);
    });
  });
});
