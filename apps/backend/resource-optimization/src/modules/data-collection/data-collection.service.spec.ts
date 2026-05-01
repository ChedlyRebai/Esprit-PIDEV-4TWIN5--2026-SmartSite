import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DataCollectionService } from './data-collection.service';

const mockEquipment = {
  _id: 'eq-1',
  siteId: 'site-123',
  deviceName: 'Excavator',
  type: 'heavy',
  hoursOperating: 100,
  utilizationRate: 75,
  maintenanceCost: 500,
};

const mockWorker = {
  _id: 'w-1',
  siteId: 'site-123',
  name: 'John Doe',
  role: 'operator',
  hoursWorked: 40,
  costhourlyRate: 25,
  productivityScore: 80,
};

const mockEnergy = {
  _id: 'en-1',
  siteId: 'site-123',
  electricity: 100,
  fuelConsumption: 50,
  carbonEmissions: 138.8,
  dateLogged: new Date(),
};

const mockUsageData = {
  _id: 'ud-1',
  siteId: 'site-123',
  resourceId: 'eq-1',
  utilizationHours: 8,
};

const createMockModel = (mockData: any) => {
  const mockSave = jest.fn().mockResolvedValue(mockData);
  const MockModel: any = function (data: any) {
    Object.assign(this, data);
    this.save = mockSave;
  };
  const mockQuery = {
    exec: jest.fn().mockResolvedValue([mockData]),
  };
  Object.assign(MockModel, {
    find: jest.fn().mockReturnValue(mockQuery),
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockData) }),
    findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockData) }),
    findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockData) }),
    _mockSave: mockSave,
    _mockQuery: mockQuery,
  });
  return MockModel;
};

describe('DataCollectionService', () => {
  let service: DataCollectionService;
  let MockEquipmentModel: any;
  let MockWorkerModel: any;
  let MockEnergyModel: any;
  let MockUsageModel: any;

  beforeEach(async () => {
    MockEquipmentModel = createMockModel(mockEquipment);
    MockWorkerModel = createMockModel(mockWorker);
    MockEnergyModel = createMockModel(mockEnergy);
    MockUsageModel = createMockModel(mockUsageData);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCollectionService,
        { provide: getModelToken('Equipment'), useValue: MockEquipmentModel },
        { provide: getModelToken('Worker'), useValue: MockWorkerModel },
        { provide: getModelToken('EnergyConsumption'), useValue: MockEnergyModel },
        { provide: getModelToken('UsageData'), useValue: MockUsageModel },
      ],
    }).compile();

    service = module.get<DataCollectionService>(DataCollectionService);
  });

  // === EQUIPMENT ===
  describe('createEquipment', () => {
    it('crée et sauvegarde un équipement', async () => {
      const dto = { siteId: 'site-123', deviceName: 'Excavator', type: 'heavy', hoursOperating: 100, utilizationRate: 75 };
      const result = await service.createEquipment(dto as any);
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('getAllEquipment', () => {
    it('retourne tous les équipements d\'un site', async () => {
      const result = await service.getAllEquipment('site-123');
      expect(result).toEqual([mockEquipment]);
      expect(MockEquipmentModel.find).toHaveBeenCalledWith({ siteId: 'site-123' });
    });
  });

  describe('getEquipmentById', () => {
    it('retourne un équipement par id', async () => {
      const result = await service.getEquipmentById('eq-1');
      expect(result).toEqual(mockEquipment);
      expect(MockEquipmentModel.findById).toHaveBeenCalledWith('eq-1');
    });
  });

  describe('updateEquipment', () => {
    it('met à jour un équipement', async () => {
      const dto = { hoursOperating: 120 };
      const result = await service.updateEquipment('eq-1', dto as any);
      expect(result).toEqual(mockEquipment);
      expect(MockEquipmentModel.findByIdAndUpdate).toHaveBeenCalledWith('eq-1', dto, { new: true });
    });
  });

  describe('deleteEquipment', () => {
    it('supprime un équipement', async () => {
      const result = await service.deleteEquipment('eq-1');
      expect(result).toEqual(mockEquipment);
      expect(MockEquipmentModel.findByIdAndDelete).toHaveBeenCalledWith('eq-1');
    });
  });

  // === WORKER ===
  describe('createWorker', () => {
    it('crée et sauvegarde un travailleur', async () => {
      const dto = { siteId: 'site-123', name: 'John', role: 'operator', hoursWorked: 40, costhourlyRate: 25 };
      const result = await service.createWorker(dto as any);
      expect(result).toEqual(mockWorker);
    });
  });

  describe('getAllWorkers', () => {
    it('retourne tous les travailleurs d\'un site', async () => {
      const result = await service.getAllWorkers('site-123');
      expect(result).toEqual([mockWorker]);
      expect(MockWorkerModel.find).toHaveBeenCalledWith({ siteId: 'site-123' });
    });
  });

  describe('getWorkerById', () => {
    it('retourne un travailleur par id', async () => {
      const result = await service.getWorkerById('w-1');
      expect(result).toEqual(mockWorker);
    });
  });

  describe('updateWorker', () => {
    it('met à jour un travailleur', async () => {
      const dto = { hoursWorked: 45 };
      const result = await service.updateWorker('w-1', dto as any);
      expect(result).toEqual(mockWorker);
    });
  });

  describe('deleteWorker', () => {
    it('supprime un travailleur', async () => {
      const result = await service.deleteWorker('w-1');
      expect(result).toEqual(mockWorker);
    });
  });

  // === ENERGY CONSUMPTION ===
  describe('recordEnergyConsumption', () => {
    it('enregistre la consommation énergétique avec calcul CO2', async () => {
      const dto = { siteId: 'site-123', electricity: 100, fuelConsumption: 50, dateLogged: new Date() };
      const result = await service.recordEnergyConsumption(dto as any);
      expect(result).toEqual(mockEnergy);
    });

    it('calcule les émissions CO2 correctement', async () => {
      const dto = { siteId: 'site-123', electricity: 100, fuelConsumption: 0, dateLogged: new Date() };
      await service.recordEnergyConsumption(dto as any);
      // electricity: 100 * 0.233 = 23.3 kg CO2
      expect(MockEnergyModel._mockSave).toHaveBeenCalled();
    });

    it('gère les valeurs nulles pour electricity et fuel', async () => {
      const dto = { siteId: 'site-123', dateLogged: new Date() };
      const result = await service.recordEnergyConsumption(dto as any);
      expect(result).toEqual(mockEnergy);
    });
  });

  describe('getEnergyConsumption', () => {
    it('retourne la consommation des 30 derniers jours par défaut', async () => {
      const result = await service.getEnergyConsumption('site-123');
      expect(result).toEqual([mockEnergy]);
      expect(MockEnergyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ siteId: 'site-123' }),
      );
    });

    it('retourne la consommation pour un nombre de jours personnalisé', async () => {
      await service.getEnergyConsumption('site-123', 7);
      expect(MockEnergyModel.find).toHaveBeenCalled();
    });
  });

  // === USAGE DATA ===
  describe('recordUsageData', () => {
    it('enregistre les données d\'utilisation', async () => {
      const start = new Date('2024-01-01T08:00:00');
      const end = new Date('2024-01-01T16:00:00');
      const result = await service.recordUsageData('eq-1', start, end, 'site-123');
      expect(result).toEqual(mockUsageData);
    });

    it('calcule correctement les heures d\'utilisation', async () => {
      const start = new Date('2024-01-01T08:00:00');
      const end = new Date('2024-01-01T10:00:00'); // 2 hours
      await service.recordUsageData('eq-1', start, end, 'site-123');
      expect(MockUsageModel._mockSave).toHaveBeenCalled();
    });
  });

  describe('getUsageData', () => {
    it('retourne les données d\'utilisation', async () => {
      const result = await service.getUsageData('site-123');
      expect(result).toEqual([mockUsageData]);
    });

    it('filtre par nombre de jours', async () => {
      await service.getUsageData('site-123', 7);
      expect(MockUsageModel.find).toHaveBeenCalled();
    });
  });
});
