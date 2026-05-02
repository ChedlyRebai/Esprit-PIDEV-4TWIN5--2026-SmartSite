import { Test, TestingModule } from '@nestjs/testing';
import { ResourceAnalysisController } from './resource-analysis.controller';
import { ResourceAnalysisService } from './resource-analysis.service';

const mockService = {
  detectIdleEquipment: jest.fn(),
  analyzeEnergyConsumption: jest.fn(),
  analyzeWorkerProductivity: jest.fn(),
  calculateResourceCosts: jest.fn(),
  analyzeResources: jest.fn(),
};

describe('ResourceAnalysisController', () => {
  let controller: ResourceAnalysisController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourceAnalysisController],
      providers: [{ provide: ResourceAnalysisService, useValue: mockService }],
    }).compile();

    controller = module.get<ResourceAnalysisController>(ResourceAnalysisController);
  });

  describe('detectIdleEquipment', () => {
    it('retourne les équipements inactifs', async () => {
      const idle = [{ id: 'eq-1', utilizationRate: 10 }];
      mockService.detectIdleEquipment.mockResolvedValue(idle);
      const result = await controller.detectIdleEquipment('site-123');
      expect(result).toEqual(idle);
      expect(mockService.detectIdleEquipment).toHaveBeenCalledWith('site-123');
    });
  });

  describe('analyzeEnergyConsumption', () => {
    it('retourne l\'analyse de consommation', async () => {
      const analysis = { peakPeriods: [], totalCO2: 100 };
      mockService.analyzeEnergyConsumption.mockResolvedValue(analysis);
      const result = await controller.analyzeEnergyConsumption('site-123');
      expect(result).toEqual(analysis);
      expect(mockService.analyzeEnergyConsumption).toHaveBeenCalledWith('site-123');
    });
  });

  describe('analyzeWorkerProductivity', () => {
    it('retourne la productivité des travailleurs', async () => {
      const productivity = [{ name: 'John', efficiency: 'high' }];
      mockService.analyzeWorkerProductivity.mockResolvedValue(productivity);
      const result = await controller.analyzeWorkerProductivity('site-123');
      expect(result).toEqual(productivity);
      expect(mockService.analyzeWorkerProductivity).toHaveBeenCalledWith('site-123');
    });
  });

  describe('calculateResourceCosts', () => {
    it('retourne les coûts des ressources', async () => {
      const costs = { equipment: 5000, workers: 3000, total: 8000 };
      mockService.calculateResourceCosts.mockResolvedValue(costs);
      const result = await controller.calculateResourceCosts('site-123');
      expect(result).toEqual(costs);
      expect(mockService.calculateResourceCosts).toHaveBeenCalledWith('site-123');
    });
  });

  describe('analyzeResources', () => {
    it('retourne l\'analyse complète des ressources', async () => {
      const fullAnalysis = {
        idleEquipment: [],
        peakConsumptionPeriods: [],
        workerProductivity: [],
        costBreakdown: { total: 0 },
        environmentalImpact: { totalCO2: 0, totalWaste: 0 },
        recommendations: [],
      };
      mockService.analyzeResources.mockResolvedValue(fullAnalysis);
      const result = await controller.analyzeResources('site-123');
      expect(result).toEqual(fullAnalysis);
      expect(mockService.analyzeResources).toHaveBeenCalledWith('site-123');
    });
  });
});
