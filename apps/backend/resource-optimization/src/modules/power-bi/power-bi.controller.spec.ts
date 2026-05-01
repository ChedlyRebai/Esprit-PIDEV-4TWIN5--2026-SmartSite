import { Test, TestingModule } from '@nestjs/testing';
import { PowerBiController } from './power-bi.controller';
import { PowerBiService } from './power-bi.service';

const mockDashboard = {
  realTimeMetrics: { activeRecommendations: 5, liveSavings: 1000 },
  trends: {},
  kpis: { roi: 12.5 },
  lastUpdated: new Date().toISOString(),
};

const mockStream = { data: [], total: 0 };
const mockMetrics = { totalRecommendations: 10, implementedCount: 3, totalSavings: 5000 };

const mockService = {
  getDashboardData: jest.fn(),
  getRecommendationsStream: jest.fn(),
  getAlertsStream: jest.fn(),
  getPerformanceMetrics: jest.fn(),
};

describe('PowerBiController', () => {
  let controller: PowerBiController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PowerBiController],
      providers: [{ provide: PowerBiService, useValue: mockService }],
    }).compile();

    controller = module.get<PowerBiController>(PowerBiController);
  });

  describe('getDashboardData', () => {
    it('retourne les données du dashboard', async () => {
      mockService.getDashboardData.mockResolvedValue(mockDashboard);
      const result = await controller.getDashboardData('site-123');
      expect(result).toEqual(mockDashboard);
      expect(mockService.getDashboardData).toHaveBeenCalledWith('site-123', false);
    });

    it('passe le paramètre refresh', async () => {
      mockService.getDashboardData.mockResolvedValue(mockDashboard);
      await controller.getDashboardData('site-123', true);
      expect(mockService.getDashboardData).toHaveBeenCalledWith('site-123', true);
    });
  });

  describe('getRecommendationsStream', () => {
    it('retourne le flux de recommandations', async () => {
      mockService.getRecommendationsStream.mockResolvedValue(mockStream);
      const result = await controller.getRecommendationsStream('site-123');
      expect(result).toEqual(mockStream);
      expect(mockService.getRecommendationsStream).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getAlertsStream', () => {
    it('retourne le flux d\'alertes', async () => {
      mockService.getAlertsStream.mockResolvedValue(mockStream);
      const result = await controller.getAlertsStream('site-123');
      expect(result).toEqual(mockStream);
      expect(mockService.getAlertsStream).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('retourne les métriques de performance avec période par défaut', async () => {
      mockService.getPerformanceMetrics.mockResolvedValue(mockMetrics);
      const result = await controller.getPerformanceMetrics('site-123');
      expect(result).toEqual(mockMetrics);
      expect(mockService.getPerformanceMetrics).toHaveBeenCalledWith('site-123', '7d');
    });

    it('accepte une période personnalisée', async () => {
      mockService.getPerformanceMetrics.mockResolvedValue(mockMetrics);
      await controller.getPerformanceMetrics('site-123', '30d');
      expect(mockService.getPerformanceMetrics).toHaveBeenCalledWith('site-123', '30d');
    });
  });
});
