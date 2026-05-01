import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PowerBiService } from './power-bi.service';
import { ReportingService } from '../reporting/reporting.service';

const mockRecommendations = [
  {
    _id: 'r1',
    type: 'energy',
    title: 'Energy rec',
    status: 'pending',
    estimatedSavings: 1000,
    estimatedCO2Reduction: 100,
    priority: 8,
    createdAt: new Date(),
  },
  {
    _id: 'r2',
    type: 'budget',
    title: 'Budget rec',
    status: 'approved',
    estimatedSavings: 500,
    estimatedCO2Reduction: 50,
    priority: 9,
    createdAt: new Date(),
  },
  {
    _id: 'r3',
    type: 'equipment',
    title: 'Equipment rec',
    status: 'implemented',
    estimatedSavings: 800,
    estimatedCO2Reduction: 80,
    priority: 7,
    createdAt: new Date(),
    implementedAt: new Date(),
  },
];

const mockAlerts = [
  {
    _id: 'a1',
    type: 'equipment-idle',
    severity: 'high',
    title: 'Alert 1',
    message: 'Message 1',
    isRead: false,
    status: 'pending',
    createdAt: new Date(),
  },
  {
    _id: 'a2',
    type: 'energy-spike',
    severity: 'critical',
    title: 'Alert 2',
    message: 'Message 2',
    isRead: false,
    status: 'pending',
    createdAt: new Date(),
  },
];

const mockDashboard = {
  performance: {
    totalSavings: 800,
    co2Reduction: 80,
    implementedRecommendations: 1,
    resourceUtilization: { equipment: 75, workforce: 80 },
    costBreakdown: { total: 8000, breakdown: { equipmentPercentage: 60, workersPercentage: 40 } },
    environmentalMetrics: { totalCO2Emissions: 500, totalWaste: 50, reductionTargetMet: true },
  },
  environmental: {
    currentCO2Emissions: '500',
    actualCO2Reduction: '80',
    reductionPercentage: '16.0',
  },
  financial: {
    currentResourcesCosts: '8000.00',
    realizedSavings: '800.00',
    roi: '10.0%',
    breakdown: { equipmentPercentage: 60, workersPercentage: 40 },
  },
  recommendations: { total: 3, pending: 1, approved: 1, implemented: 1 },
  lastUpdated: new Date(),
};

const createMockQuery = (data: any) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(data),
});

const MockRecommendationModel: any = {
  find: jest.fn().mockReturnValue(createMockQuery(mockRecommendations)),
};

const MockAlertModel: any = {
  find: jest.fn().mockReturnValue(createMockQuery(mockAlerts)),
};

const mockReportingService = {
  generateDashboard: jest.fn().mockResolvedValue(mockDashboard),
};

describe('PowerBiService', () => {
  let service: PowerBiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    MockRecommendationModel.find.mockReturnValue(createMockQuery(mockRecommendations));
    MockAlertModel.find.mockReturnValue(createMockQuery(mockAlerts));
    mockReportingService.generateDashboard.mockResolvedValue(mockDashboard);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PowerBiService,
        { provide: getModelToken('Recommendation'), useValue: MockRecommendationModel },
        { provide: getModelToken('Alert'), useValue: MockAlertModel },
        { provide: ReportingService, useValue: mockReportingService },
      ],
    }).compile();

    service = module.get<PowerBiService>(PowerBiService);
  });

  describe('getDashboardData', () => {
    it('retourne les données complètes du dashboard', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result).toHaveProperty('realTimeMetrics');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('recommendationsAnalysis');
      expect(result).toHaveProperty('alertsAnalysis');
      expect(result).toHaveProperty('predictiveInsights');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('calcule les métriques en temps réel', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.realTimeMetrics.activeRecommendations).toBe(2); // pending + approved
      expect(result.realTimeMetrics.pendingApprovals).toBe(1);
      expect(result.realTimeMetrics.liveSavings).toBe(800); // implemented only
      expect(result.realTimeMetrics.liveCO2Reduction).toBe(80);
    });

    it('calcule les alertes critiques', async () => {
      const result = await service.getDashboardData('site-123');
      // Only alerts with severity 'critical' are counted
      expect(result.realTimeMetrics.criticalAlerts).toBe(1);
    });

    it('calcule les KPIs', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.kpis).toHaveProperty('roi');
      expect(result.kpis).toHaveProperty('efficiencyScore');
      expect(result.kpis).toHaveProperty('sustainabilityIndex');
      expect(result.kpis).toHaveProperty('budgetVariance');
    });

    it('calcule l\'efficacité correctement', async () => {
      const result = await service.getDashboardData('site-123');
      // 1 implemented / 3 total = 33.33%
      expect(result.kpis.efficiencyScore).toBeCloseTo(33.33, 1);
    });

    it('analyse les recommandations par type', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.recommendationsAnalysis.byType).toHaveProperty('energy');
      expect(result.recommendationsAnalysis.byType.energy).toBe(1);
      expect(result.recommendationsAnalysis.byType.budget).toBe(1);
    });

    it('analyse les recommandations par statut', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.recommendationsAnalysis.byStatus.pending).toBe(1);
      expect(result.recommendationsAnalysis.byStatus.approved).toBe(1);
      expect(result.recommendationsAnalysis.byStatus.implemented).toBe(1);
    });

    it('analyse les alertes par type', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.alertsAnalysis.byType['equipment-idle']).toBe(1);
      expect(result.alertsAnalysis.byType['energy-spike']).toBe(1);
    });

    it('analyse les alertes par sévérité', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.alertsAnalysis.bySeverity.high).toBe(1);
      expect(result.alertsAnalysis.bySeverity.critical).toBe(1);
    });

    it('génère des insights prédictifs', async () => {
      const result = await service.getDashboardData('site-123');
      expect(result.predictiveInsights).toHaveProperty('nextWeekSavings');
      expect(result.predictiveInsights).toHaveProperty('riskAlerts');
      expect(result.predictiveInsights).toHaveProperty('optimizationOpportunities');
    });

    it('gère les erreurs et les propage', async () => {
      mockReportingService.generateDashboard.mockRejectedValue(new Error('DB Error'));
      await expect(service.getDashboardData('site-123')).rejects.toThrow('DB Error');
    });
  });

  describe('getRecommendationsStream', () => {
    it('retourne le flux de recommandations', async () => {
      const result = await service.getRecommendationsStream('site-123');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(3);
    });

    it('formate correctement les données du flux', async () => {
      const result = await service.getRecommendationsStream('site-123');
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('type');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('status');
      expect(result.data[0]).toHaveProperty('timestamp');
    });
  });

  describe('getAlertsStream', () => {
    it('retourne le flux d\'alertes', async () => {
      const result = await service.getAlertsStream('site-123');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(2);
    });

    it('formate correctement les données du flux d\'alertes', async () => {
      const result = await service.getAlertsStream('site-123');
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('type');
      expect(result.data[0]).toHaveProperty('severity');
      expect(result.data[0]).toHaveProperty('timestamp');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('retourne les métriques de performance pour 7 jours', async () => {
      const result = await service.getPerformanceMetrics('site-123', '7d');
      expect(result).toHaveProperty('totalRecommendations');
      expect(result).toHaveProperty('implementedCount');
      expect(result).toHaveProperty('totalSavings');
      expect(result).toHaveProperty('totalCO2Reduction');
      expect(result).toHaveProperty('averagePriority');
      expect(result.period).toBe('7 days');
    });

    it('parse correctement les périodes en heures', async () => {
      const result = await service.getPerformanceMetrics('site-123', '24h');
      expect(result.period).toBe('1 days');
    });

    it('parse correctement les périodes en semaines', async () => {
      const result = await service.getPerformanceMetrics('site-123', '2w');
      expect(result.period).toBe('14 days');
    });

    it('utilise 7 jours par défaut pour une période invalide', async () => {
      const result = await service.getPerformanceMetrics('site-123', 'invalid');
      expect(result.period).toBe('7 days');
    });

    it('calcule les économies des recommandations implémentées', async () => {
      const result = await service.getPerformanceMetrics('site-123', '30d');
      expect(result.totalSavings).toBe(800); // only implemented
      expect(result.implementedCount).toBe(1);
    });
  });

  describe('risk alerts generation', () => {
    it('génère une alerte de backlog si trop de recommandations en attente', async () => {
      const manyPendingRecs = Array(6).fill({ ...mockRecommendations[0], status: 'pending' });
      MockRecommendationModel.find.mockReturnValue(createMockQuery(manyPendingRecs));
      mockReportingService.generateDashboard.mockResolvedValue({
        ...mockDashboard,
        recommendations: { total: 6, pending: 6, approved: 0, implemented: 0 },
        financial: { ...mockDashboard.financial, roi: '30%' },
      });

      const result = await service.getDashboardData('site-123');
      const backlogRisk = result.predictiveInsights.riskAlerts.find(
        (r: any) => r.type === 'approval_backlog',
      );
      expect(backlogRisk).toBeDefined();
    });
  });
});
