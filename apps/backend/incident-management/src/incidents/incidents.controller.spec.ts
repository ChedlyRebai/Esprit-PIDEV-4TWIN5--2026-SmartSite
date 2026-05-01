import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentType, IncidentSeverity, IncidentStatus } from './entities/incident.entity';

const mockIncident = {
  _id: '507f1f77bcf86cd799439011',
  type: IncidentType.SAFETY,
  severity: IncidentSeverity.HIGH,
  title: 'Test incident',
  status: IncidentStatus.OPEN,
};

const mockIncidentsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findBySite: jest.fn(),
  findByProject: jest.fn(),
  countBySite: jest.fn(),
  countByProject: jest.fn(),
  getDashboardStats: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('IncidentsController', () => {
  let controller: IncidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: mockIncidentsService },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retourne la liste des incidents', async () => {
      mockIncidentsService.findAll.mockResolvedValue([mockIncident]);
      const result = await controller.findAll();
      expect(result).toEqual([mockIncident]);
      expect(mockIncidentsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('retourne un incident par id', async () => {
      mockIncidentsService.findOne.mockResolvedValue(mockIncident);
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockIncident);
      expect(mockIncidentsService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('findBySite', () => {
    it('retourne les incidents d\'un site', async () => {
      mockIncidentsService.findBySite.mockResolvedValue([mockIncident]);
      const result = await controller.findBySite('site-123');
      expect(result).toEqual([mockIncident]);
      expect(mockIncidentsService.findBySite).toHaveBeenCalledWith('site-123');
    });
  });

  describe('findByProject', () => {
    it('retourne les incidents d\'un projet', async () => {
      mockIncidentsService.findByProject.mockResolvedValue([mockIncident]);
      const result = await controller.findByProject('proj-123');
      expect(result).toEqual([mockIncident]);
      expect(mockIncidentsService.findByProject).toHaveBeenCalledWith('proj-123');
    });
  });

  describe('countBySite', () => {
    it('retourne le nombre d\'incidents d\'un site', async () => {
      mockIncidentsService.countBySite.mockResolvedValue(5);
      const result = await controller.countBySite('site-123');
      expect(result).toEqual({ count: 5, siteId: 'site-123' });
      expect(mockIncidentsService.countBySite).toHaveBeenCalledWith('site-123');
    });
  });

  describe('countByProject', () => {
    it('retourne le nombre d\'incidents d\'un projet', async () => {
      mockIncidentsService.countByProject.mockResolvedValue(3);
      const result = await controller.countByProject('proj-123');
      expect(result).toEqual({ count: 3, projectId: 'proj-123' });
      expect(mockIncidentsService.countByProject).toHaveBeenCalledWith('proj-123');
    });
  });

  describe('getDashboardStats', () => {
    it('retourne les stats sans filtres', async () => {
      const stats = { summary: { total: 10 } };
      mockIncidentsService.getDashboardStats.mockResolvedValue(stats);
      const result = await controller.getDashboardStats();
      expect(result).toEqual(stats);
      expect(mockIncidentsService.getDashboardStats).toHaveBeenCalledWith({
        assignedToCin: undefined,
        projectId: undefined,
        siteId: undefined,
      });
    });

    it('retourne les stats filtrées par assignedToCin', async () => {
      const stats = { summary: { total: 3 } };
      mockIncidentsService.getDashboardStats.mockResolvedValue(stats);
      const result = await controller.getDashboardStats('CIN123');
      expect(result).toEqual(stats);
      expect(mockIncidentsService.getDashboardStats).toHaveBeenCalledWith({
        assignedToCin: 'CIN123',
        projectId: undefined,
        siteId: undefined,
      });
    });

    it('retourne les stats filtrées par projectId et siteId', async () => {
      const stats = { summary: { total: 2 } };
      mockIncidentsService.getDashboardStats.mockResolvedValue(stats);
      await controller.getDashboardStats(undefined, 'proj-1', 'site-1');
      expect(mockIncidentsService.getDashboardStats).toHaveBeenCalledWith({
        assignedToCin: undefined,
        projectId: 'proj-1',
        siteId: 'site-1',
      });
    });
  });

  describe('create', () => {
    it('crée un incident et le retourne', async () => {
      const dto = {
        type: IncidentType.SAFETY,
        severity: IncidentSeverity.HIGH,
        title: 'Test incident',
      };
      mockIncidentsService.create.mockResolvedValue(mockIncident);
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockIncident);
      expect(mockIncidentsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('met à jour un incident et le retourne', async () => {
      const dto = { title: 'Titre modifié' };
      const updated = { ...mockIncident, ...dto };
      mockIncidentsService.update.mockResolvedValue(updated);
      const result = await controller.update('507f1f77bcf86cd799439011', dto as any);
      expect(result).toEqual(updated);
      expect(mockIncidentsService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', dto);
    });
  });

  describe('remove', () => {
    it('supprime un incident et retourne { removed: true }', async () => {
      mockIncidentsService.remove.mockResolvedValue({ removed: true });
      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ removed: true });
      expect(mockIncidentsService.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
