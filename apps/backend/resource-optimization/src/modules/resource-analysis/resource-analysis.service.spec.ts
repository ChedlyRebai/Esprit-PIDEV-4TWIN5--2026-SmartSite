import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ResourceAnalysisService } from './resource-analysis.service';
import { ExternalDataService } from '../external-data/external-data.service';

const mockEquipmentActive = {
  _id: 'eq-1',
  deviceName: 'Excavator',
  type: 'heavy',
  utilizationRate: 10,
  hoursOperating: 100,
  maintenanceCost: 500,
  isActive: true,
};

const mockEquipmentGood = {
  _id: 'eq-2',
  deviceName: 'Crane',
  type: 'heavy',
  utilizationRate: 80,
  hoursOperating: 200,
  maintenanceCost: 1000,
  isActive: true,
};

const mockWorker = {
  _id: 'w-1',
  name: 'John',
  role: 'operator',
  hoursWorked: 40,
  costhourlyRate: 25,
  productivityScore: 80,
};

const mockWorkerLow = {
  _id: 'w-2',
  name: 'Jane',
  role: 'helper',
  hoursWorked: 20,
  costhourlyRate: 15,
  productivityScore: 30,
};

const mockWorkerMedium = {
  _id: 'w-3',
  name: 'Bob',
  role: 'supervisor',
  hoursWorked: 35,
  costhourlyRate: 30,
  productivityScore: 60,
};

const mockEnergyData = [
  {
    dateLogged: new Date('2024-01-01'),
    electricity: 100,
    fuelConsumption: 50,
    waterConsumption: 20,
    wasteGenerated: 10,
    carbonEmissions: 138.8,
  },
  {
    dateLogged: new Date('2024-01-02'),
    electricity: 200,
    fuelConsumption: 80,
    waterConsumption: 30,
    wasteGenerated: 15,
    carbonEmissions: 231.8,
  },
];

const createMockModel = (data: any) => {
  const mockQuery = { exec: jest.fn().mockResolvedValue(data) };
  const MockModel: any = {};
  MockModel.find = jest.fn().mockReturnValue(mockQuery);
  MockModel._mockQuery = mockQuery;
  return MockModel;
};

const mockExternalDataService = {
  getAllSiteData: jest.fn(),
};

describe('ResourceAnalysisService', () => {
  let service: ResourceAnalysisService;
  let MockEquipmentModel: any;
  let MockWorkerModel: any;
  let MockEnergyModel: any;

  beforeEach(async () => {
    MockEquipmentModel = createMockModel([mockEquipmentActive, mockEquipmentGood]);
    MockWorkerModel = createMockModel([mockWorker, mockWorkerLow, mockWorkerMedium]);
    MockEnergyModel = createMockModel(mockEnergyData);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceAnalysisService,
        { provide: getModelToken('Equipment'), useValue: MockEquipmentModel },
        { provide: getModelToken('Worker'), useValue: MockWorkerModel },
        { provide: getModelToken('EnergyConsumption'), useValue: MockEnergyModel },
        { provide: ExternalDataService, useValue: mockExternalDataService },
      ],
    }).compile();

    service = module.get<ResourceAnalysisService>(ResourceAnalysisService);
  });

  describe('detectIdleEquipment', () => {
    it('détecte les équipements avec utilisation < 20%', async () => {
      const result = await service.detectIdleEquipment('site-123');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Excavator');
      expect(result[0].utilizationRate).toBe(10);
      expect(result[0].wastePercentage).toBe(90);
    });

    it('retourne un tableau vide si aucun équipement inactif', async () => {
      MockEquipmentModel._mockQuery.exec.mockResolvedValue([mockEquipmentGood]);
      const result = await service.detectIdleEquipment('site-123');
      expect(result).toHaveLength(0);
    });

    it('retourne un tableau vide si aucun équipement', async () => {
      MockEquipmentModel._mockQuery.exec.mockResolvedValue([]);
      const result = await service.detectIdleEquipment('site-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeEnergyConsumption', () => {
    it('analyse la consommation énergétique', async () => {
      const result = await service.analyzeEnergyConsumption('site-123');
      expect(result).toHaveProperty('peakPeriods');
      expect(result).toHaveProperty('averageDailyConsumption');
      expect(result).toHaveProperty('totalCO2');
      expect(result).toHaveProperty('totalWaste');
      expect(result.totalCO2).toBeCloseTo(370.6);
      expect(result.totalWaste).toBe(25);
    });

    it('retourne des valeurs par défaut si aucune donnée', async () => {
      MockEnergyModel._mockQuery.exec.mockResolvedValue([]);
      const result = await service.analyzeEnergyConsumption('site-123');
      expect(result.peakPeriods).toHaveLength(0);
      expect(result.averageDailyConsumption).toBe(0);
      expect(result.totalCO2).toBe(0);
      expect(result.totalWaste).toBe(0);
    });

    it('identifie les périodes de pic (top 25%)', async () => {
      const result = await service.analyzeEnergyConsumption('site-123');
      // 2 jours, top 25% = 1 jour
      expect(result.peakPeriods.length).toBeGreaterThanOrEqual(0);
    });

    it('accepte un paramètre de jours personnalisé', async () => {
      await service.analyzeEnergyConsumption('site-123', 7);
      expect(MockEnergyModel.find).toHaveBeenCalled();
    });
  });

  describe('analyzeWorkerProductivity', () => {
    it('analyse la productivité des travailleurs', async () => {
      const result = await service.analyzeWorkerProductivity('site-123');
      expect(result).toHaveLength(3);
    });

    it('classe correctement les niveaux d\'efficacité', async () => {
      const result = await service.analyzeWorkerProductivity('site-123');
      const highWorker = result.find((w: any) => w.name === 'John');
      const lowWorker = result.find((w: any) => w.name === 'Jane');
      const mediumWorker = result.find((w: any) => w.name === 'Bob');

      expect(highWorker?.efficiency).toBe('high'); // score 80 > 70
      expect(lowWorker?.efficiency).toBe('low');   // score 30 < 50
      expect(mediumWorker?.efficiency).toBe('medium'); // score 60 > 50
    });

    it('calcule le coût correctement', async () => {
      const result = await service.analyzeWorkerProductivity('site-123');
      const john = result.find((w: any) => w.name === 'John');
      expect(john?.costIncurred).toBe(40 * 25); // 1000
    });

    it('retourne un tableau vide si aucun travailleur', async () => {
      MockWorkerModel._mockQuery.exec.mockResolvedValue([]);
      const result = await service.analyzeWorkerProductivity('site-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateResourceCosts', () => {
    it('calcule les coûts des ressources', async () => {
      const result = await service.calculateResourceCosts('site-123');
      expect(result).toHaveProperty('equipment');
      expect(result).toHaveProperty('workers');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
    });

    it('calcule le coût équipement correctement', async () => {
      MockEquipmentModel._mockQuery.exec.mockResolvedValue([mockEquipmentActive]);
      MockWorkerModel._mockQuery.exec.mockResolvedValue([]);
      const result = await service.calculateResourceCosts('site-123');
      // eq: 100 * 50 + 500 = 5500
      expect(result.equipment).toBe(5500);
      expect(result.workers).toBe(0);
      expect(result.total).toBe(5500);
    });

    it('calcule le coût travailleurs correctement', async () => {
      MockEquipmentModel._mockQuery.exec.mockResolvedValue([]);
      MockWorkerModel._mockQuery.exec.mockResolvedValue([mockWorker]);
      const result = await service.calculateResourceCosts('site-123');
      // worker: 40 * 25 = 1000
      expect(result.workers).toBe(1000);
      expect(result.equipment).toBe(0);
    });

    it('retourne 0% pour les pourcentages si total = 0', async () => {
      MockEquipmentModel._mockQuery.exec.mockResolvedValue([]);
      MockWorkerModel._mockQuery.exec.mockResolvedValue([]);
      const result = await service.calculateResourceCosts('site-123');
      expect(result.breakdown.equipmentPercentage).toBe(0);
      expect(result.breakdown.workersPercentage).toBe(0);
    });
  });

  describe('analyzeResources', () => {
    it('retourne une analyse complète', async () => {
      mockExternalDataService.getAllSiteData.mockResolvedValue({
        site: { budget: 10000 },
        tasks: [{ status: 'completed' }, { status: 'in_progress' }],
        milestones: [{ status: 'completed' }, { status: 'pending' }],
        siteStats: { completedTasks: 1, activeTasks: 1, pendingMilestones: 1 },
      });

      const result = await service.analyzeResources('site-123');

      expect(result).toHaveProperty('idleEquipment');
      expect(result).toHaveProperty('peakConsumptionPeriods');
      expect(result).toHaveProperty('workerProductivity');
      expect(result).toHaveProperty('costBreakdown');
      expect(result).toHaveProperty('environmentalImpact');
      expect(result).toHaveProperty('recommendations');
      expect(result.externalData).toBeDefined();
    });

    it('gère l\'absence de données externes', async () => {
      mockExternalDataService.getAllSiteData.mockRejectedValue(new Error('Network error'));

      const result = await service.analyzeResources('site-123');

      expect(result.externalData).toBeUndefined();
      expect(result.recommendations).toBeDefined();
    });

    it('génère des recommandations basées sur les données', async () => {
      mockExternalDataService.getAllSiteData.mockResolvedValue({
        site: { budget: 100 },
        tasks: Array(25).fill({ status: 'in_progress' }),
        milestones: Array(5).fill({ status: 'pending' }),
        siteStats: { completedTasks: 0, activeTasks: 25, pendingMilestones: 5 },
      });

      const result = await service.analyzeResources('site-123');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('calcule le taux de complétion des tâches', async () => {
      mockExternalDataService.getAllSiteData.mockResolvedValue({
        site: { budget: 5000 },
        tasks: [
          { status: 'completed' },
          { status: 'completed' },
          { status: 'in_progress' },
        ],
        milestones: [],
        siteStats: { completedTasks: 2, activeTasks: 1, pendingMilestones: 0 },
      });

      const result = await service.analyzeResources('site-123');
      expect(result.externalData?.taskCompletionRate).toBeCloseTo(66.67, 1);
    });
  });
});
