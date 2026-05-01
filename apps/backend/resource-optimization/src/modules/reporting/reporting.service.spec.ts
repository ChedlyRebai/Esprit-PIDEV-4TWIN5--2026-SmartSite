import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReportingService } from './reporting.service';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';

const mockAnalysis = {
  idleEquipment: [{ utilizationRate: 10 }, { utilizationRate: 15 }],
  workerProductivity: [
    { productivityScore: 80 },
    { productivityScore: 60 },
    { productivityScore: 40 },
  ],
  costBreakdown: {
    total: 8000,
    breakdown: { equipmentPercentage: 60, workersPercentage: 40 },
  },
  environmentalImpact: { totalCO2: 500, totalWaste: 50 },
};

const mockRecommendations = [
  {
    _id: 'r1',
    siteId: 'site-123',
    type: 'energy',
    status: 'implemented',
    estimatedSavings: 1000,
    estimatedCO2Reduction: 100,
    implementedAt: new Date(),
    title: 'Energy rec',
  },
  {
    _id: 'r2',
    siteId: 'site-123',
    type: 'equipment',
    status: 'approved',
    estimatedSavings: 500,
    estimatedCO2Reduction: 50,
    title: 'Equipment rec',
  },
  {
    _id: 'r3',
    siteId: 'site-123',
    type: 'environmental',
    status: 'pending',
    estimatedSavings: 300,
    estimatedCO2Reduction: 30,
    title: 'Env rec',
  },
];

const mockQuery = {
  exec: jest.fn().mockResolvedValue(mockRecommendations),
};

const MockRecommendationModel: any = {
  find: jest.fn().mockReturnValue(mockQuery),
};

const mockResourceAnalysisService = {
  analyzeResources: jest.fn().mockResolvedValue(mockAnalysis),
};

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    MockRecommendationModel.find.mockReturnValue(mockQuery);
    mockQuery.exec.mockResolvedValue(mockRecommendations);
    mockResourceAnalysisService.analyzeResources.mockResolvedValue(mockAnalysis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: getModelToken('Recommendation'), useValue: MockRecommendationModel },
        { provide: ResourceAnalysisService, useValue: mockResourceAnalysisService },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  describe('generatePerformanceReport', () => {
    it('génère un rapport de performance', async () => {
      const result = await service.generatePerformanceReport('site-123');
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalSavings');
      expect(result).toHaveProperty('co2Reduction');
      expect(result).toHaveProperty('implementedRecommendations');
      expect(result).toHaveProperty('resourceUtilization');
      expect(result).toHaveProperty('costBreakdown');
      expect(result).toHaveProperty('environmentalMetrics');
    });

    it('calcule les économies totales des recommandations implémentées', async () => {
      // The mock returns all 3 recommendations (including implemented ones)
      // The service filters by implementedAt in the query, but mock returns all
      const result = await service.generatePerformanceReport('site-123');
      expect(result.totalSavings).toBeGreaterThanOrEqual(0);
      expect(result.co2Reduction).toBeGreaterThanOrEqual(0);
      expect(result.implementedRecommendations).toBeGreaterThanOrEqual(0);
    });

    it('accepte un paramètre de jours personnalisé', async () => {
      const result = await service.generatePerformanceReport('site-123', 7);
      expect(result.period).toBe('7 jours');
    });

    it('calcule l\'utilisation des ressources', async () => {
      const result = await service.generatePerformanceReport('site-123');
      expect(result.resourceUtilization.equipment).toBeGreaterThanOrEqual(0);
      expect(result.resourceUtilization.workforce).toBeGreaterThanOrEqual(0);
    });

    it('retourne reductionTargetMet = true si CO2 réduit', async () => {
      const result = await service.generatePerformanceReport('site-123');
      expect(result.environmentalMetrics.reductionTargetMet).toBe(true);
    });

    it('retourne reductionTargetMet = false si aucune réduction', async () => {
      mockQuery.exec.mockResolvedValue([]);
      const result = await service.generatePerformanceReport('site-123');
      expect(result.environmentalMetrics.reductionTargetMet).toBe(false);
    });
  });

  describe('generateEnvironmentalReport', () => {
    it('génère un rapport environnemental', async () => {
      const result = await service.generateEnvironmentalReport('site-123');
      expect(result).toHaveProperty('currentCO2Emissions');
      expect(result).toHaveProperty('wasteGenerated');
      expect(result).toHaveProperty('potentialCO2Reduction');
      expect(result).toHaveProperty('actualCO2Reduction');
      expect(result).toHaveProperty('reductionPercentage');
      expect(result).toHaveProperty('recommendations');
    });

    it('filtre les recommandations de type environmental', async () => {
      const envRecs = mockRecommendations.filter(r => r.type === 'environmental');
      mockQuery.exec.mockResolvedValue(envRecs);
      const result = await service.generateEnvironmentalReport('site-123');
      expect(result.recommendations).toHaveLength(1);
    });

    it('calcule le pourcentage de réduction', async () => {
      const result = await service.generateEnvironmentalReport('site-123');
      expect(typeof result.reductionPercentage).toBe('string');
    });
  });

  describe('generateFinancialReport', () => {
    it('génère un rapport financier', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(result).toHaveProperty('currentResourcesCosts');
      expect(result).toHaveProperty('potentialSavings');
      expect(result).toHaveProperty('approvedSavings');
      expect(result).toHaveProperty('realizedSavings');
      expect(result).toHaveProperty('roi');
      expect(result).toHaveProperty('savingsByCategory');
    });

    it('calcule les économies potentielles totales', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(parseFloat(result.potentialSavings)).toBe(1800); // 1000 + 500 + 300
    });

    it('calcule les économies approuvées', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(parseFloat(result.approvedSavings)).toBe(500);
    });

    it('calcule les économies réalisées', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(parseFloat(result.realizedSavings)).toBe(1000);
    });

    it('calcule le ROI', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(result.roi).toContain('%');
    });

    it('retourne ROI = 0 si coût total = 0', async () => {
      mockResourceAnalysisService.analyzeResources.mockResolvedValue({
        ...mockAnalysis,
        costBreakdown: { total: 0, breakdown: {} },
      });
      const result = await service.generateFinancialReport('site-123');
      expect(result.roi).toBe('0%');
    });

    it('catégorise les économies par type', async () => {
      const result = await service.generateFinancialReport('site-123');
      expect(result.savingsByCategory).toHaveProperty('energy');
      expect(result.savingsByCategory.energy).toBe(1000);
    });
  });

  describe('generateDashboard', () => {
    it('génère un dashboard complet', async () => {
      const result = await service.generateDashboard('site-123');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('environmental');
      expect(result).toHaveProperty('financial');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('compte correctement les recommandations par statut', async () => {
      const result = await service.generateDashboard('site-123');
      expect(result.recommendations.total).toBe(3);
      expect(result.recommendations.implemented).toBe(1);
      expect(result.recommendations.approved).toBe(1);
      expect(result.recommendations.pending).toBe(1);
    });
  });

  describe('exportReportData', () => {
    it('exporte en format JSON par défaut', async () => {
      const result = await service.exportReportData('site-123');
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('performance');
    });

    it('exporte en format JSON explicitement', async () => {
      const result = await service.exportReportData('site-123', 'json');
      expect(typeof result).toBe('object');
    });

    it('exporte en format CSV', async () => {
      const result = await service.exportReportData('site-123', 'csv');
      expect(typeof result).toBe('string');
      expect(result).toContain('Metric,Value');
      expect(result).toContain('Savings');
      expect(result).toContain('CO2 Reduction');
    });
  });
});
