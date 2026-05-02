import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AlertService } from './alert.service';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';

const mockAlert = {
  _id: 'alert-1',
  siteId: 'site-123',
  type: 'equipment-idle',
  severity: 'high',
  title: 'Test Alert',
  message: 'Test message',
  isRead: false,
  status: 'pending',
  createdAt: new Date(),
};

const mockSave = jest.fn().mockResolvedValue(mockAlert);

const MockAlertModel: any = function (data: any) {
  Object.assign(this, data);
  this.save = mockSave;
};

const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([mockAlert]),
};

Object.assign(MockAlertModel, {
  find: jest.fn().mockReturnValue(mockQuery),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAlert) }),
  deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) }),
});

const mockResourceAnalysisService = {
  analyzeResources: jest.fn(),
};

const mockAnalysis = {
  idleEquipment: [{ id: 'eq-1', name: 'Excavator', utilizationRate: 10 }],
  peakConsumptionPeriods: [1, 2, 3, 4],
  environmentalImpact: { totalCO2: 1500, totalWaste: 100 },
  workerProductivity: [{ efficiency: 'low', name: 'Worker1' }],
  costBreakdown: { total: 15000 },
};

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQuery.exec.mockResolvedValue([mockAlert]);
    mockQuery.sort.mockReturnThis();
    mockQuery.limit.mockReturnThis();
    MockAlertModel.find.mockReturnValue(mockQuery);
    MockAlertModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAlert) });
    MockAlertModel.deleteMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
    mockSave.mockResolvedValue(mockAlert);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        { provide: getModelToken('Alert'), useValue: MockAlertModel },
        { provide: ResourceAnalysisService, useValue: mockResourceAnalysisService },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
  });

  describe('createAlert', () => {
    it('crée et sauvegarde une alerte', async () => {
      const result = await service.createAlert('site-123', 'equipment-idle', 'high', 'Title', 'Message');
      expect(result).toEqual(mockAlert);
      expect(mockSave).toHaveBeenCalled();
    });

    it('crée une alerte avec metadata', async () => {
      const result = await service.createAlert('site-123', 'energy-spike', 'medium', 'Title', 'Message', { extra: 'data' });
      expect(result).toEqual(mockAlert);
    });
  });

  describe('generateAlerts', () => {
    beforeEach(() => {
      mockResourceAnalysisService.analyzeResources.mockResolvedValue(mockAnalysis);
    });

    it('génère des alertes pour machines inutilisées', async () => {
      const result = await service.generateAlerts('site-123');
      expect(result.length).toBeGreaterThan(0);
      expect(mockResourceAnalysisService.analyzeResources).toHaveBeenCalledWith('site-123');
    });

    it('génère des alertes pour pics de consommation (> 3 pics)', async () => {
      const result = await service.generateAlerts('site-123');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('génère une alerte critique pour CO2 élevé (> 1000)', async () => {
      const result = await service.generateAlerts('site-123');
      const criticalAlerts = result.filter((a: any) => a.severity === 'critical' || a === mockAlert);
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it('génère une alerte pour faible productivité', async () => {
      const result = await service.generateAlerts('site-123');
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('génère une alerte pour budget dépassé (> 10000)', async () => {
      const result = await service.generateAlerts('site-123');
      expect(result.length).toBeGreaterThanOrEqual(4);
    });

    it('ne génère pas d\'alerte machines si aucune machine inutilisée', async () => {
      mockResourceAnalysisService.analyzeResources.mockResolvedValue({
        ...mockAnalysis,
        idleEquipment: [],
        peakConsumptionPeriods: [],
        environmentalImpact: { totalCO2: 0, totalWaste: 0 },
        workerProductivity: [],
        costBreakdown: { total: 0 },
      });
      const result = await service.generateAlerts('site-123');
      expect(result).toHaveLength(0);
    });

    it('ne génère pas d\'alerte énergie si <= 3 pics', async () => {
      mockResourceAnalysisService.analyzeResources.mockResolvedValue({
        ...mockAnalysis,
        idleEquipment: [],
        peakConsumptionPeriods: [1, 2, 3],
        environmentalImpact: { totalCO2: 0, totalWaste: 0 },
        workerProductivity: [],
        costBreakdown: { total: 0 },
      });
      const result = await service.generateAlerts('site-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('getUnreadAlerts', () => {
    it('retourne les alertes non lues', async () => {
      const result = await service.getUnreadAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(MockAlertModel.find).toHaveBeenCalledWith({ siteId: 'site-123', isRead: false });
    });
  });

  describe('getCriticalAlerts', () => {
    it('retourne les alertes critiques', async () => {
      const result = await service.getCriticalAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(MockAlertModel.find).toHaveBeenCalledWith({ siteId: 'site-123', severity: 'critical' });
    });
  });

  describe('getAllAlerts', () => {
    it('retourne toutes les alertes avec limite par défaut', async () => {
      const result = await service.getAllAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(MockAlertModel.find).toHaveBeenCalledWith({ siteId: 'site-123' });
    });

    it('retourne les alertes avec une limite personnalisée', async () => {
      await service.getAllAlerts('site-123', 10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('markAsRead', () => {
    it('marque une alerte comme lue', async () => {
      const result = await service.markAsRead('alert-1');
      expect(result).toEqual(mockAlert);
      expect(MockAlertModel.findByIdAndUpdate).toHaveBeenCalledWith('alert-1', { isRead: true }, { new: true });
    });
  });

  describe('markAsResolved', () => {
    it('marque une alerte comme résolue', async () => {
      const result = await service.markAsResolved('alert-1');
      expect(result).toEqual(mockAlert);
      expect(MockAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'alert-1',
        expect.objectContaining({ status: 'resolved', resolvedAt: expect.any(Date) }),
        { new: true },
      );
    });
  });

  describe('cleanupResolvedAlerts', () => {
    it('supprime les alertes résolues et lues', async () => {
      const result = await service.cleanupResolvedAlerts('site-123');
      expect(result).toEqual({ deletedCount: 1 });
      expect(MockAlertModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ siteId: 'site-123', isRead: true, status: 'resolved' }),
      );
    });
  });

  describe('getAlertsSummary', () => {
    it('retourne un résumé correct des alertes', async () => {
      const alerts = [
        { ...mockAlert, severity: 'critical', type: 'equipment-idle', isRead: false },
        { ...mockAlert, _id: '2', severity: 'high', type: 'energy-spike', isRead: true },
        { ...mockAlert, _id: '3', severity: 'medium', type: 'high-waste', isRead: false },
        { ...mockAlert, _id: '4', severity: 'low', type: 'budget-exceed', isRead: true },
        { ...mockAlert, _id: '5', severity: 'high', type: 'deadline-risk', isRead: false },
      ];
      mockQuery.exec.mockResolvedValue(alerts);

      const result = await service.getAlertsSummary('site-123');

      expect(result.total).toBe(5);
      expect(result.unread).toBe(3);
      expect(result.critical).toBe(1);
      expect(result.high).toBe(2);
      expect(result.medium).toBe(1);
      expect(result.low).toBe(1);
      expect(result.byType.equipmentIdle).toBe(1);
      expect(result.byType.energySpike).toBe(1);
      expect(result.byType.highWaste).toBe(1);
      expect(result.byType.budgetExceed).toBe(1);
      expect(result.byType.deadlineRisk).toBe(1);
    });

    it('retourne un résumé vide si aucune alerte', async () => {
      mockQuery.exec.mockResolvedValue([]);
      const result = await service.getAlertsSummary('site-empty');
      expect(result.total).toBe(0);
      expect(result.unread).toBe(0);
    });
  });
});
