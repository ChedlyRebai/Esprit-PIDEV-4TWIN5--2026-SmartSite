import { Test, TestingModule } from '@nestjs/testing';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

const mockService = {
  generatePerformanceReport: jest.fn(),
  generateEnvironmentalReport: jest.fn(),
  generateFinancialReport: jest.fn(),
  generateDashboard: jest.fn(),
  exportReportData: jest.fn(),
};

describe('ReportingController', () => {
  let controller: ReportingController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [{ provide: ReportingService, useValue: mockService }],
    }).compile();

    controller = module.get<ReportingController>(ReportingController);
  });

  describe('generatePerformanceReport', () => {
    it('génère un rapport de performance', async () => {
      const report = { period: '30 jours', totalSavings: 1000 };
      mockService.generatePerformanceReport.mockResolvedValue(report);
      const result = await controller.generatePerformanceReport('site-123');
      expect(result).toEqual(report);
      expect(mockService.generatePerformanceReport).toHaveBeenCalledWith('site-123', 30);
    });

    it('accepte un paramètre de jours', async () => {
      mockService.generatePerformanceReport.mockResolvedValue({});
      await controller.generatePerformanceReport('site-123', 7);
      expect(mockService.generatePerformanceReport).toHaveBeenCalledWith('site-123', 7);
    });
  });

  describe('generateEnvironmentalReport', () => {
    it('génère un rapport environnemental', async () => {
      const report = { currentCO2Emissions: '500' };
      mockService.generateEnvironmentalReport.mockResolvedValue(report);
      const result = await controller.generateEnvironmentalReport('site-123');
      expect(result).toEqual(report);
      expect(mockService.generateEnvironmentalReport).toHaveBeenCalledWith('site-123');
    });
  });

  describe('generateFinancialReport', () => {
    it('génère un rapport financier', async () => {
      const report = { roi: '12.5%' };
      mockService.generateFinancialReport.mockResolvedValue(report);
      const result = await controller.generateFinancialReport('site-123');
      expect(result).toEqual(report);
      expect(mockService.generateFinancialReport).toHaveBeenCalledWith('site-123');
    });
  });

  describe('generateDashboard', () => {
    it('génère un dashboard complet', async () => {
      const dashboard = { performance: {}, environmental: {}, financial: {} };
      mockService.generateDashboard.mockResolvedValue(dashboard);
      const result = await controller.generateDashboard('site-123');
      expect(result).toEqual(dashboard);
      expect(mockService.generateDashboard).toHaveBeenCalledWith('site-123');
    });
  });

  describe('exportReportData', () => {
    it('exporte en JSON par défaut', async () => {
      const data = { performance: {} };
      mockService.exportReportData.mockResolvedValue(data);
      const result = await controller.exportReportData('site-123');
      expect(result).toEqual(data);
      expect(mockService.exportReportData).toHaveBeenCalledWith('site-123', 'json');
    });

    it('exporte en CSV', async () => {
      const csv = 'Metric,Value\nSavings,1000';
      mockService.exportReportData.mockResolvedValue(csv);
      const result = await controller.exportReportData('site-123', 'csv');
      expect(result).toEqual(csv);
      expect(mockService.exportReportData).toHaveBeenCalledWith('site-123', 'csv');
    });
  });
});
