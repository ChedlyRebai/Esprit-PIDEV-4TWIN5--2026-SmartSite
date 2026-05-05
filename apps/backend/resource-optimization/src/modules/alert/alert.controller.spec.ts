import { Test, TestingModule } from '@nestjs/testing';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

const mockAlert = {
  _id: 'alert-1',
  siteId: 'site-123',
  type: 'equipment-idle',
  severity: 'high',
  title: 'Test Alert',
  message: 'Test message',
  isRead: false,
};

const mockAlertService = {
  generateAlerts: jest.fn(),
  getUnreadAlerts: jest.fn(),
  getCriticalAlerts: jest.fn(),
  getAllAlerts: jest.fn(),
  getAlertsSummary: jest.fn(),
  markAsRead: jest.fn(),
  markAsResolved: jest.fn(),
  cleanupResolvedAlerts: jest.fn(),
};

describe('AlertController', () => {
  let controller: AlertController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [{ provide: AlertService, useValue: mockAlertService }],
    }).compile();

    controller = module.get<AlertController>(AlertController);
  });

  describe('generateAlerts', () => {
    it('génère des alertes pour un site', async () => {
      mockAlertService.generateAlerts.mockResolvedValue([mockAlert]);
      const result = await controller.generateAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(mockAlertService.generateAlerts).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getUnreadAlerts', () => {
    it('retourne les alertes non lues', async () => {
      mockAlertService.getUnreadAlerts.mockResolvedValue([mockAlert]);
      const result = await controller.getUnreadAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(mockAlertService.getUnreadAlerts).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getCriticalAlerts', () => {
    it('retourne les alertes critiques', async () => {
      mockAlertService.getCriticalAlerts.mockResolvedValue([mockAlert]);
      const result = await controller.getCriticalAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(mockAlertService.getCriticalAlerts).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getAllAlerts', () => {
    it('retourne toutes les alertes', async () => {
      mockAlertService.getAllAlerts.mockResolvedValue([mockAlert]);
      const result = await controller.getAllAlerts('site-123');
      expect(result).toEqual([mockAlert]);
      expect(mockAlertService.getAllAlerts).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getAlertsSummary', () => {
    it('retourne le résumé des alertes', async () => {
      const summary = { total: 5, unread: 3, critical: 1 };
      mockAlertService.getAlertsSummary.mockResolvedValue(summary);
      const result = await controller.getAlertsSummary('site-123');
      expect(result).toEqual(summary);
      expect(mockAlertService.getAlertsSummary).toHaveBeenCalledWith('site-123');
    });
  });

  describe('markAsRead', () => {
    it('marque une alerte comme lue', async () => {
      const updated = { ...mockAlert, isRead: true };
      mockAlertService.markAsRead.mockResolvedValue(updated);
      const result = await controller.markAsRead('alert-1');
      expect(result).toEqual(updated);
      expect(mockAlertService.markAsRead).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('markAsResolved', () => {
    it('marque une alerte comme résolue', async () => {
      const resolved = { ...mockAlert, status: 'resolved' };
      mockAlertService.markAsResolved.mockResolvedValue(resolved);
      const result = await controller.markAsResolved('alert-1');
      expect(result).toEqual(resolved);
      expect(mockAlertService.markAsResolved).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('cleanupResolvedAlerts', () => {
    it('nettoie les alertes résolues', async () => {
      mockAlertService.cleanupResolvedAlerts.mockResolvedValue({ deletedCount: 2 });
      const result = await controller.cleanupResolvedAlerts('site-123');
      expect(result).toEqual({ deletedCount: 2 });
      expect(mockAlertService.cleanupResolvedAlerts).toHaveBeenCalledWith('site-123');
    });
  });
});
