import { Test, TestingModule } from '@nestjs/testing';
import { DataCollectionController } from './data-collection.controller';
import { DataCollectionService } from './data-collection.service';

const mockEquipment = { _id: 'eq-1', siteId: 'site-123', deviceName: 'Excavator' };
const mockWorker = { _id: 'w-1', siteId: 'site-123', name: 'John' };
const mockEnergy = { _id: 'en-1', siteId: 'site-123', electricity: 100 };

const mockService = {
  createEquipment: jest.fn(),
  getAllEquipment: jest.fn(),
  getEquipmentById: jest.fn(),
  updateEquipment: jest.fn(),
  deleteEquipment: jest.fn(),
  createWorker: jest.fn(),
  getAllWorkers: jest.fn(),
  getWorkerById: jest.fn(),
  updateWorker: jest.fn(),
  deleteWorker: jest.fn(),
  recordEnergyConsumption: jest.fn(),
  getEnergyConsumption: jest.fn(),
};

describe('DataCollectionController', () => {
  let controller: DataCollectionController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataCollectionController],
      providers: [{ provide: DataCollectionService, useValue: mockService }],
    }).compile();

    controller = module.get<DataCollectionController>(DataCollectionController);
  });

  // === EQUIPMENT ===
  describe('createEquipment', () => {
    it('crée un équipement', async () => {
      mockService.createEquipment.mockResolvedValue(mockEquipment);
      const result = await controller.createEquipment({ siteId: 'site-123', deviceName: 'Excavator' } as any);
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('getAllEquipment', () => {
    it('retourne tous les équipements', async () => {
      mockService.getAllEquipment.mockResolvedValue([mockEquipment]);
      const result = await controller.getAllEquipment('site-123');
      expect(result).toEqual([mockEquipment]);
      expect(mockService.getAllEquipment).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getEquipmentById', () => {
    it('retourne un équipement par id', async () => {
      mockService.getEquipmentById.mockResolvedValue(mockEquipment);
      const result = await controller.getEquipmentById('eq-1');
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('updateEquipment', () => {
    it('met à jour un équipement', async () => {
      mockService.updateEquipment.mockResolvedValue(mockEquipment);
      const result = await controller.updateEquipment('eq-1', { hoursOperating: 120 } as any);
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('deleteEquipment', () => {
    it('supprime un équipement', async () => {
      mockService.deleteEquipment.mockResolvedValue(mockEquipment);
      const result = await controller.deleteEquipment('eq-1');
      expect(result).toEqual(mockEquipment);
    });
  });

  // === WORKER ===
  describe('createWorker', () => {
    it('crée un travailleur', async () => {
      mockService.createWorker.mockResolvedValue(mockWorker);
      const result = await controller.createWorker({ siteId: 'site-123', name: 'John' } as any);
      expect(result).toEqual(mockWorker);
    });
  });

  describe('getAllWorkers', () => {
    it('retourne tous les travailleurs', async () => {
      mockService.getAllWorkers.mockResolvedValue([mockWorker]);
      const result = await controller.getAllWorkers('site-123');
      expect(result).toEqual([mockWorker]);
    });
  });

  describe('getWorkerById', () => {
    it('retourne un travailleur par id', async () => {
      mockService.getWorkerById.mockResolvedValue(mockWorker);
      const result = await controller.getWorkerById('w-1');
      expect(result).toEqual(mockWorker);
    });
  });

  describe('updateWorker', () => {
    it('met à jour un travailleur', async () => {
      mockService.updateWorker.mockResolvedValue(mockWorker);
      const result = await controller.updateWorker('w-1', { hoursWorked: 45 } as any);
      expect(result).toEqual(mockWorker);
    });
  });

  describe('deleteWorker', () => {
    it('supprime un travailleur', async () => {
      mockService.deleteWorker.mockResolvedValue(mockWorker);
      const result = await controller.deleteWorker('w-1');
      expect(result).toEqual(mockWorker);
    });
  });

  // === ENERGY ===
  describe('recordEnergyConsumption', () => {
    it('enregistre la consommation énergétique', async () => {
      mockService.recordEnergyConsumption.mockResolvedValue(mockEnergy);
      const result = await controller.recordEnergyConsumption({ siteId: 'site-123', electricity: 100 } as any);
      expect(result).toEqual(mockEnergy);
    });
  });

  describe('getEnergyConsumption', () => {
    it('retourne la consommation énergétique', async () => {
      mockService.getEnergyConsumption.mockResolvedValue([mockEnergy]);
      const result = await controller.getEnergyConsumption('site-123');
      expect(result).toEqual([mockEnergy]);
    });
  });
});
