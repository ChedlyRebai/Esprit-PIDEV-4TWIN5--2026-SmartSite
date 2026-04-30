import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecommendationService, Recommendation, CreateRecommendationDto } from './recommendation.service';
import { ExternalDataService } from '../external-data/external-data.service';
import { AIRecommendationService } from '../../ai/ai-recommendation.service';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';
import { AlertService } from '../alert/alert.service';

const mockRecommendation: Recommendation = {
  _id: '507f1f77bcf86cd799439011',
  type: 'energy',
  title: 'Optimisation énergétique',
  description: 'Réduire la consommation',
  status: 'pending',
  estimatedSavings: 1500,
  estimatedCO2Reduction: 200,
  priority: 8,
  confidenceScore: 85,
  actionItems: ['Action 1'],
  siteId: 'site-123',
  createdAt: new Date().toISOString(),
};

// Mock model object — passed directly as useValue
const mockModel: any = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  save: jest.fn(),
};

// Make mockModel callable as a constructor
const MockModelConstructor: any = function (data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue(mockRecommendation);
};
Object.assign(MockModelConstructor, mockModel);

const mockExternalDataService = {
  getAllSiteData: jest.fn(),
  getProjectContext: jest.fn(),
};

const mockAIRecommendationService = {
  generateRecommendations: jest.fn(),
};

const mockResourceAnalysisService = {
  analyzeEnergyConsumption: jest.fn(),
};

const mockAlertService = {
  getAlertsSummary: jest.fn(),
};

const captureContext = {
  site: { budget: 1000 },
  project: { budget: 1500 },
  tasks: [
    { status: 'completed', budget: 100, startDate: '2024-01-01', endDate: '2024-01-03' },
    { status: 'in_progress', budget: 150, dueDate: '2099-01-01' },
    { status: 'blocked', budget: 0, dueDate: '2000-01-01' },
  ],
  teams: [
    { members: ['a', 'b'] },
    { members: ['c'] },
  ],
  incidents: [],
  sites: [],
  projectStats: { totalSitesBudget: 5000 },
};

const analyticsRecommendations: Recommendation[] = [
  {
    ...mockRecommendation,
    _id: 'approval-1',
    status: 'approved',
    approvedAt: '2026-01-01T10:00:00.000Z',
    beforeMetrics: {
      budget: { spent: 300, total: 1000, remaining: 700 },
      tasks: { overdue: 2, avgDuration: 5 },
      teams: { avgWorkload: 3 },
      efficiency: { budgetUtilization: 30, taskCompletionRate: 20, teamProductivity: 0.5 },
    },
  },
  {
    ...mockRecommendation,
    _id: 'impl-1',
    status: 'implemented',
    approvedAt: '2026-01-02T10:00:00.000Z',
    beforeMetrics: {
      budget: { spent: 400, total: 1000, remaining: 600 },
      tasks: { overdue: 3, avgDuration: 6 },
      teams: { avgWorkload: 4 },
      efficiency: { budgetUtilization: 40, taskCompletionRate: 25, teamProductivity: 0.75 },
    },
    afterMetrics: {
      budget: { spent: 250, total: 1000, remaining: 750 },
      tasks: { overdue: 1, avgDuration: 2 },
      teams: { avgWorkload: 2 },
      efficiency: { budgetUtilization: 25, taskCompletionRate: 50, teamProductivity: 1.5 },
    },
    improvement: { budgetSavings: 150, completionRateImprovement: 25 },
  },
];

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset default mock implementations
    mockModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockRecommendation]) }),
    });
    mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });
    mockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });
    mockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: getModelToken('Recommendation'),
          useValue: MockModelConstructor,
        },
        {
          provide: ExternalDataService,
          useValue: mockExternalDataService,
        },
        {
          provide: AIRecommendationService,
          useValue: mockAIRecommendationService,
        },
        {
          provide: ResourceAnalysisService,
          useValue: mockResourceAnalysisService,
        },
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  describe('create', () => {
    it('crée une recommandation avec status pending', async () => {
      const dto: CreateRecommendationDto = {
        type: 'energy',
        title: 'Test',
        description: 'Description',
        priority: 5,
        estimatedSavings: 1000,
        estimatedCO2Reduction: 100,
        confidenceScore: 80,
        actionItems: ['Action'],
        siteId: 'site-123',
      };
      const result = await service.create(dto);
      expect(result).toEqual(mockRecommendation);
    });
  });

  describe('findAll', () => {
    it('retourne toutes les recommandations', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRecommendation]);
      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('filtre par siteId si fourni', async () => {
      await service.findAll('site-123');
      expect(mockModel.find).toHaveBeenCalledWith({ siteId: 'site-123' });
    });

    it('filtre par status si fourni', async () => {
      await service.findAll(undefined, 'pending');
      expect(mockModel.find).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('filtre par siteId et status simultanément', async () => {
      await service.findAll('site-123', 'approved');
      expect(mockModel.find).toHaveBeenCalledWith({ siteId: 'site-123', status: 'approved' });
    });
  });

  describe('getSummary', () => {
    it('retourne un objet avec les 4 champs requis de type string', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, status: 'pending', estimatedSavings: 1000, estimatedCO2Reduction: 100 },
        { ...mockRecommendation, _id: '2', status: 'approved', estimatedSavings: 500, estimatedCO2Reduction: 50 },
        { ...mockRecommendation, _id: '3', status: 'implemented', estimatedSavings: 300, estimatedCO2Reduction: 30 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');

      expect(typeof result.totalPotentialSavings).toBe('string');
      expect(typeof result.approvedSavings).toBe('string');
      expect(typeof result.realizedSavings).toBe('string');
      expect(typeof result.totalCO2Reduction).toBe('string');
    });

    it('calcule correctement totalPotentialSavings', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, estimatedSavings: 1000 },
        { ...mockRecommendation, _id: '2', estimatedSavings: 500 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');
      expect(result.totalPotentialSavings).toBe('1500');
    });

    it('calcule correctement approvedSavings (status approved uniquement)', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, status: 'pending', estimatedSavings: 1000 },
        { ...mockRecommendation, _id: '2', status: 'approved', estimatedSavings: 500 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');
      expect(result.approvedSavings).toBe('500');
    });

    it('retourne "0" pour tous les champs si aucune recommandation', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      const result = await service.getSummary('site-vide');
      expect(result.totalPotentialSavings).toBe('0');
      expect(result.approvedSavings).toBe('0');
      expect(result.realizedSavings).toBe('0');
      expect(result.totalCO2Reduction).toBe('0');
    });
  });

  describe('findOne', () => {
    it('retourne la recommandation correspondante', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockRecommendation);
    });

    it('retourne null si non trouvée', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('met à jour et retourne la recommandation', async () => {
      const updated = { ...mockRecommendation, status: 'approved' };
      mockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });
      const result = await service.update('507f1f77bcf86cd799439011', { status: 'approved' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('supprime et retourne la recommandation', async () => {
      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockRecommendation);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('retourne null si non trouvée', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.remove('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('approveRecommendation', () => {
    it('capture les métriques et approuve la recommandation', async () => {
      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        siteId: 'site-123',
        scope: 'site',
      });
      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...mockRecommendation,
        status: 'approved',
      });
      mockExternalDataService.getAllSiteData.mockResolvedValue(captureContext);

      const result = await service.approveRecommendation('507f1f77bcf86cd799439011');

      expect(result.status).toBe('approved');
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          status: 'approved',
          beforeMetrics: expect.any(Object),
        }),
        { new: true },
      );
    });

    it('lève une erreur si la recommandation est introuvable', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.approveRecommendation('missing')).rejects.toThrow('Recommendation not found');
    });
  });

  describe('implementRecommendation', () => {
    beforeEach(() => {
      mockExternalDataService.getAllSiteData.mockResolvedValue(captureContext);
    });

    it('calcule une amélioration budgétaire', async () => {
      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        type: 'budget',
        siteId: 'site-123',
        scope: 'site',
        beforeMetrics: {
          budget: { spent: 300, total: 1000, remaining: 700 },
          tasks: { overdue: 2, avgDuration: 5 },
          teams: { avgWorkload: 3 },
          efficiency: { budgetUtilization: 30, taskCompletionRate: 20, teamProductivity: 0.5 },
        },
      });
      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...mockRecommendation,
        status: 'implemented',
      });

      const result = await service.implementRecommendation('507f1f77bcf86cd799439011');

      expect(result.status).toBe('implemented');
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          status: 'implemented',
          improvement: expect.objectContaining({
            budgetSavings: 50,
            budgetUtilizationImprovement: -16.666666666666664,
          }),
        }),
        { new: true },
      );
    });

    it('couvre la branche task_distribution', async () => {
      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        type: 'task_distribution',
        siteId: 'site-123',
        scope: 'site',
        beforeMetrics: {
          budget: { spent: 400, total: 1000, remaining: 600 },
          tasks: { overdue: 3, avgDuration: 6 },
          teams: { avgWorkload: 4 },
          efficiency: { budgetUtilization: 40, taskCompletionRate: 25, teamProductivity: 0.75 },
        },
      });
      mockModel.findByIdAndUpdate.mockResolvedValue({ ...mockRecommendation, status: 'implemented' });

      await service.implementRecommendation('task-distribution');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'task-distribution',
        expect.objectContaining({
          improvement: expect.objectContaining({
            workloadBalanceImprovement: 3,
            productivityImprovement: -0.4166666666666667,
          }),
        }),
        { new: true },
      );
    });

    it('couvre la branche timeline', async () => {
      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        type: 'timeline',
        siteId: 'site-123',
        scope: 'site',
        beforeMetrics: {
          budget: { spent: 400, total: 1000, remaining: 600 },
          tasks: { overdue: 3, avgDuration: 6 },
          teams: { avgWorkload: 4 },
          efficiency: { budgetUtilization: 40, taskCompletionRate: 25, teamProductivity: 0.75 },
        },
      });
      mockModel.findByIdAndUpdate.mockResolvedValue({ ...mockRecommendation, status: 'implemented' });

      await service.implementRecommendation('timeline');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'timeline',
        expect.objectContaining({
          improvement: expect.objectContaining({
            overdueTasksReduction: 2,
            completionRateImprovement: 8.333333333333329,
          }),
        }),
        { new: true },
      );
    });

    it('couvre la branche individual_task_management et la branche par défaut', async () => {
      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        type: 'individual_task_management',
        siteId: 'site-123',
        scope: 'site',
        beforeMetrics: {
          budget: { spent: 400, total: 1000, remaining: 600 },
          tasks: { overdue: 3, avgDuration: 6 },
          teams: { avgWorkload: 4 },
          efficiency: { budgetUtilization: 40, taskCompletionRate: 25, teamProductivity: 0.75 },
        },
      });
      mockModel.findByIdAndUpdate.mockResolvedValue({ ...mockRecommendation, status: 'implemented' });

      await service.implementRecommendation('individual-task');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'individual-task',
        expect.objectContaining({
          improvement: expect.objectContaining({
            taskDurationImprovement: 4,
            personalEfficiencyImprovement: 8.333333333333329,
          }),
        }),
        { new: true },
      );

      mockModel.findById.mockResolvedValue({
        ...mockRecommendation,
        type: 'energy',
        siteId: 'site-123',
        scope: 'site',
        beforeMetrics: {
          budget: { spent: 400, total: 1000, remaining: 600 },
          tasks: { overdue: 3, avgDuration: 6 },
          teams: { avgWorkload: 4 },
          efficiency: { budgetUtilization: 40, taskCompletionRate: 25, teamProductivity: 0.75 },
        },
      });

      await service.implementRecommendation('default-branch');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'default-branch',
        expect.objectContaining({
          improvement: expect.objectContaining({
            overallEfficiencyImprovement: 8.333333333333329,
          }),
        }),
        { new: true },
      );
    });

    it('lève une erreur si la recommandation est introuvable', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.implementRecommendation('missing')).rejects.toThrow('Recommendation not found');
    });
  });

  describe('getAnalytics', () => {
    it('retourne les agrégats et les comparaisons avant/après', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(analyticsRecommendations) }),
      });

      const result = await service.getAnalytics('site-123');

      expect(result.totalRecommendations).toBe(2);
      expect(result.approvedRecommendations).toBe(1);
      expect(result.implementedRecommendations).toBe(1);
      expect(result.pendingImplementationSnapshots).toHaveLength(1);
      expect(result.beforeAfterComparisons).toHaveLength(1);
      expect(result.budgetInfluenceOnApprovals).toHaveLength(3);
      expect(result.totalImprovements.budgetSavings).toBe(150);
      expect(result.totalImprovements.taskCompletionImprovement).toBe(25);
    });
  });

  describe('generateForProject', () => {
    it('génère les recommandations projet et site', async () => {
      mockExternalDataService.getProjectContext.mockResolvedValue({
        ...captureContext,
        incidents: [{ siteId: 'site-123' }],
        tasks: [{ siteId: 'site-123' }],
        site: { budget: 2000 },
        project: { budget: 3000 },
      });
      mockAIRecommendationService.generateRecommendations
        .mockResolvedValueOnce([
          {
            type: 'energy',
            title: 'Proj rec',
            description: 'desc',
            priority: 'high',
            estimatedSavings: 100,
          },
        ])
        .mockResolvedValueOnce([
          {
            type: 'budget',
            title: 'Site rec',
            description: 'desc',
            priority: 'medium',
            estimatedSavings: 80,
          },
        ]);
      mockResourceAnalysisService.analyzeEnergyConsumption.mockResolvedValue({ peakPeriods: [{ start: '08:00', end: '10:00' }] });
      mockAlertService.getAlertsSummary.mockResolvedValue({ byType: { budgetExceed: 1, energySpike: 1 } });

      const result = await service.generateForProject('project-123', 'site-123');

      expect(result).toHaveLength(5);
    });
  });

  describe('generateForSite', () => {
    it('génère les recommandations site avec jalons, tâches et alertes', async () => {
      const now = new Date();
      const overdueDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const upcomingDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

      mockExternalDataService.getAllSiteData.mockResolvedValue({
        site: { budget: 4000 },
        tasks: [
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'in_progress', endDate: overdueDate },
          { status: 'blocked', endDate: overdueDate },
          { status: 'completed', startDate: '2024-01-01', endDate: '2024-01-03' },
        ],
        milestones: [
          { status: 'pending', dueDate: overdueDate },
          { status: 'pending', dueDate: upcomingDate },
          { status: 'pending', dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        teams: [{ members: ['a', 'b'] }],
        incidents: [],
      });
      mockAIRecommendationService.generateRecommendations.mockResolvedValue([
        {
          type: 'energy',
          title: 'Site rec',
          description: 'desc',
          priority: 'high',
          estimatedSavings: 100,
        },
      ]);
      mockResourceAnalysisService.analyzeEnergyConsumption.mockResolvedValue({ peakPeriods: [{ start: '08:00', end: '10:00' }] });
      mockAlertService.getAlertsSummary.mockResolvedValue({ byType: { budgetExceed: 1, energySpike: 1 } });

      const result = await service.generateForSite('site-123');

      expect(result).toHaveLength(9);
    });
  });
});
