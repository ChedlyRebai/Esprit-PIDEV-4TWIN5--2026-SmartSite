import { Test, TestingModule } from '@nestjs/testing';
import { AIRecommendationService, RecommendationRequest } from './ai-recommendation.service';

describe('AIRecommendationService', () => {
  let service: AIRecommendationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIRecommendationService],
    }).compile();

    service = module.get<AIRecommendationService>(AIRecommendationService);
  });

  const baseRequest: RecommendationRequest = {
    projectId: 'proj-1',
    siteId: 'site-1',
    budget: 10000,
    tasks: [],
    teams: [],
  };

  describe('generateRecommendations', () => {
    it('retourne des recommandations pour une requête vide', async () => {
      const result = await service.generateRecommendations(baseRequest);
      expect(Array.isArray(result)).toBe(true);
    });

    it('trie les recommandations par priorité décroissante', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 50000,
        tasks: [
          { _id: 't1', status: 'in_progress', priority: 'urgent', dueDate: new Date(Date.now() - 86400000).toISOString() },
          { _id: 't2', status: 'in_progress', priority: 'high', dueDate: new Date(Date.now() - 86400000).toISOString() },
        ],
        teams: [{ members: [{ _id: 'm1', firstName: 'John', lastName: 'Doe' }] }],
      };
      const result = await service.generateRecommendations(request);
      expect(result.length).toBeGreaterThan(0);
      // Check sorted by priority
      for (let i = 0; i < result.length - 1; i++) {
        const priorities = ['urgent', 'high', 'medium', 'low'];
        const currentIdx = priorities.indexOf(result[i].priority);
        const nextIdx = priorities.indexOf(result[i + 1].priority);
        expect(currentIdx).toBeLessThanOrEqual(nextIdx);
      }
    });

    it('génère des recommandations budget si budget dépassé', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 100,
        tasks: Array(20).fill({ _id: 't1', status: 'in_progress', priority: 'high' }),
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      const budgetRecs = result.filter(r => r.type === 'budget');
      expect(budgetRecs.length).toBeGreaterThan(0);
    });

    it('génère des recommandations timeline si tâches en retard', async () => {
      const overdueDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [
          { _id: 't1', status: 'in_progress', priority: 'high', dueDate: overdueDate },
          { _id: 't2', status: 'in_progress', priority: 'medium', dueDate: overdueDate },
          { _id: 't3', status: 'in_progress', priority: 'low', dueDate: overdueDate },
        ],
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      const timelineRecs = result.filter(r => r.type === 'timeline');
      expect(timelineRecs.length).toBeGreaterThan(0);
    });

    it('génère des recommandations task_distribution si déséquilibre', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: Array(10).fill({ _id: 't1', status: 'in_progress', priority: 'high', assignedTo: 'm1' }),
        teams: [
          { members: [{ _id: 'm1' }, { _id: 'm2' }, { _id: 'm3' }] },
        ],
      };
      const result = await service.generateRecommendations(request);
      expect(result.length).toBeGreaterThan(0);
    });

    it('génère des recommandations resource_allocation si surcharge', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: Array(15).fill({ _id: 't1', status: 'in_progress', priority: 'urgent' }),
        teams: [{ members: [{ _id: 'm1' }] }],
      };
      const result = await service.generateRecommendations(request);
      const resourceRecs = result.filter(r => r.type === 'resource_allocation');
      expect(resourceRecs.length).toBeGreaterThan(0);
    });

    it('génère des recommandations pour les incidents critiques', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: [
          { _id: 'i1', type: 'safety', severity: 'critical', status: 'open', siteId: 'site-1' },
          { _id: 'i2', type: 'delay', severity: 'high', status: 'investigating', siteId: 'site-1' },
        ],
      };
      const result = await service.generateRecommendations(request);
      expect(result.length).toBeGreaterThan(0);
    });

    it('retourne des recommandations de fallback en cas d\'erreur interne', async () => {
      // Spy on analyzeProjectData to force an exception inside the try block
      jest.spyOn(service as any, 'analyzeProjectData').mockImplementation(() => {
        throw new Error('forced error');
      });
      const result = await service.generateRecommendations({ budget: 1000, tasks: [], teams: [] });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('budget');
      jest.restoreAllMocks();
    });

    it('génère des recommandations pour scope projet avec totalSitesBudget', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 5000,
        budgetScope: 'project',
        totalSitesBudget: 8000,
        tasks: [],
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('budget recommendations', () => {
    it('génère une recommandation si budget par tâche > 1000', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 5000,
        tasks: [{ _id: 't1', status: 'in_progress', priority: 'medium' }],
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      const budgetRecs = result.filter(r => r.type === 'budget');
      expect(budgetRecs.length).toBeGreaterThan(0);
    });
  });

  describe('incident recommendations', () => {
    it('génère des recommandations pour incidents de qualité', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: [
          { _id: 'i1', type: 'quality', severity: 'high', status: 'open' },
          { _id: 'i2', type: 'quality', severity: 'medium', status: 'investigating' },
        ],
      };
      const result = await service.generateRecommendations(request);
      const qualityRecs = result.filter(r => r.title.includes('qualité'));
      expect(qualityRecs.length).toBeGreaterThan(0);
    });

    it('génère des recommandations pour incidents de délai', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: [
          { _id: 'i1', type: 'delay', severity: 'high', status: 'open' },
        ],
      };
      const result = await service.generateRecommendations(request);
      expect(result.length).toBeGreaterThan(0);
    });

    it('génère une recommandation de surcharge si > 5 incidents ouverts', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: Array(6).fill({ _id: 'i1', type: 'other', severity: 'medium', status: 'open' }),
      };
      const result = await service.generateRecommendations(request);
      const overloadRec = result.find(r => r.title.includes('incidents ouverts'));
      expect(overloadRec).toBeDefined();
    });

    it('génère une recommandation systémique si > 3 incidents graves', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: [
          { _id: 'i1', type: 'safety', severity: 'critical', status: 'open' },
          { _id: 'i2', type: 'quality', severity: 'high', status: 'open' },
          { _id: 'i3', type: 'delay', severity: 'high', status: 'open' },
          { _id: 'i4', type: 'other', severity: 'high', status: 'open' },
        ],
      };
      const result = await service.generateRecommendations(request);
      const systemicRec = result.find(r => r.title.includes('systémique'));
      expect(systemicRec).toBeDefined();
    });

    it('ignore les incidents résolus', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [],
        incidents: [
          { _id: 'i1', type: 'safety', severity: 'critical', status: 'resolved' },
          { _id: 'i2', type: 'quality', severity: 'high', status: 'closed' },
        ],
      };
      const result = await service.generateRecommendations(request);
      // No incident-based recommendations since all are resolved
      const incidentRecs = result.filter(r =>
        r.title.includes('incident') || r.title.includes('sécurité') || r.title.includes('qualité')
      );
      expect(incidentRecs.length).toBe(0);
    });
  });

  describe('individual task management', () => {
    it('génère des recommandations pour membres sans tâches', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [{ members: [{ _id: 'm1', firstName: 'John', lastName: 'Doe' }] }],
      };
      const result = await service.generateRecommendations(request);
      const individualRecs = result.filter(r => r.type === 'individual_task_management');
      expect(individualRecs.length).toBeGreaterThan(0);
      expect(individualRecs[0].title).toContain('Aucune tâche');
    });

    it('génère des recommandations pour membres avec tâches en retard', async () => {
      const overdueDate = new Date(Date.now() - 86400000).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [
          { _id: 't1', title: 'Task 1', status: 'in_progress', priority: 'high', dueDate: overdueDate, assignedTo: 'm1' },
        ],
        teams: [{ members: [{ _id: 'm1', firstName: 'John', lastName: 'Doe' }] }],
      };
      const result = await service.generateRecommendations(request);
      const overdueRecs = result.filter(r =>
        r.type === 'individual_task_management' && r.title.includes('retard')
      );
      expect(overdueRecs.length).toBeGreaterThan(0);
    });

    it('génère des recommandations pour membres avec trop de tâches haute priorité', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: Array(4).fill({ _id: 't1', title: 'Task', status: 'in_progress', priority: 'urgent', dueDate: futureDate, assignedTo: 'm1' }),
        teams: [{ members: [{ _id: 'm1', firstName: 'John', lastName: 'Doe' }] }],
      };
      const result = await service.generateRecommendations(request);
      const overloadRecs = result.filter(r =>
        r.type === 'individual_task_management' && r.title.includes('priorité')
      );
      expect(overloadRecs.length).toBeGreaterThan(0);
    });

    it('gère les membres avec email seulement', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [{ members: [{ _id: 'm1', email: 'john@example.com' }] }],
      };
      const result = await service.generateRecommendations(request);
      const individualRecs = result.filter(r => r.type === 'individual_task_management');
      expect(individualRecs[0].targetMember).toBe('john@example.com');
    });

    it('gère les membres sans nom ni email', async () => {
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [],
        teams: [{ members: [{ _id: 'm1' }] }],
      };
      const result = await service.generateRecommendations(request);
      const individualRecs = result.filter(r => r.type === 'individual_task_management');
      expect(individualRecs[0].targetMember).toBe('Membre');
    });
  });

  describe('timeline analysis', () => {
    it('détecte les tâches urgentes (< 3 jours)', async () => {
      const urgentDate = new Date(Date.now() + 2 * 86400000).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [
          { _id: 't1', status: 'in_progress', priority: 'high', dueDate: urgentDate },
          { _id: 't2', status: 'in_progress', priority: 'high', dueDate: urgentDate },
          { _id: 't3', status: 'in_progress', priority: 'high', dueDate: urgentDate },
        ],
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      const timelineRecs = result.filter(r => r.type === 'timeline');
      expect(timelineRecs.length).toBeGreaterThan(0);
    });

    it('ignore les tâches complétées pour l\'analyse timeline', async () => {
      const overdueDate = new Date(Date.now() - 86400000).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [
          { _id: 't1', status: 'completed', priority: 'high', dueDate: overdueDate },
        ],
        teams: [],
      };
      const result = await service.generateRecommendations(request);
      // No timeline issues since task is completed
      const timelineRecs = result.filter(r =>
        r.type === 'timeline' && r.title.includes('retard')
      );
      expect(timelineRecs.length).toBe(0);
    });
  });

  describe('task duration estimation', () => {
    it('génère des recommandations pour tâches trop longues', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const request: RecommendationRequest = {
        ...baseRequest,
        budget: 10000,
        tasks: [
          {
            _id: 't1',
            title: 'Long Task',
            status: 'in_progress',
            priority: 'low',
            dueDate: futureDate,
            assignedTo: 'm1',
            complexity: 'complex',
            subtasks: Array(10).fill({ id: 's1' }),
          },
        ],
        teams: [{ members: [{ _id: 'm1', firstName: 'John', lastName: 'Doe' }] }],
      };
      const result = await service.generateRecommendations(request);
      const durationRecs = result.filter(r =>
        r.type === 'individual_task_management' && r.title.includes('longue')
      );
      expect(durationRecs.length).toBeGreaterThan(0);
    });
  });
});
