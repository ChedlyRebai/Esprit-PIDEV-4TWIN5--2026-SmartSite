import { Test, TestingModule } from '@nestjs/testing';
import { ExternalDataController } from './external-data.controller';
import { ExternalDataService } from './external-data.service';

const mockSiteData = { _id: 'site-123', nom: 'Test Site', budget: 10000 };
const mockTeams = [{ _id: 'team-1', name: 'Team A' }];
const mockTasks = [{ _id: 'task-1', title: 'Task 1', status: 'in_progress' }];
const mockMilestones = [{ _id: 'ms-1', title: 'Milestone 1', status: 'pending' }];
const mockAllData = {
  site: mockSiteData,
  teams: mockTeams,
  tasks: mockTasks,
  milestones: mockMilestones,
  incidents: [],
  siteStats: { totalBudget: 10000, teamSize: 1, activeTasks: 1, completedTasks: 0, pendingMilestones: 1, openIncidents: 0, criticalIncidents: 0 },
};
const mockProjectData = { _id: 'proj-1', name: 'Project 1' };
const mockProjectSites = [{ id: 'site-1', name: 'Site 1' }];
const mockProjectContext = { project: mockProjectData, sites: mockProjectSites, tasks: [], milestones: [], incidents: [] };
const mockUsers = [{ _id: 'user-1', name: 'User 1' }];

const mockService = {
  getSiteData: jest.fn(),
  getSiteTeams: jest.fn(),
  getSiteTasks: jest.fn(),
  getSiteMilestones: jest.fn(),
  getAllSiteData: jest.fn(),
  getProjectData: jest.fn(),
  getProjectSites: jest.fn(),
  getProjectContext: jest.fn(),
  getUsers: jest.fn(),
};

describe('ExternalDataController', () => {
  let controller: ExternalDataController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalDataController],
      providers: [{ provide: ExternalDataService, useValue: mockService }],
    }).compile();

    controller = module.get<ExternalDataController>(ExternalDataController);
  });

  describe('getSiteData', () => {
    it('retourne les données du site', async () => {
      mockService.getSiteData.mockResolvedValue(mockSiteData);
      const result = await controller.getSiteData('site-123');
      expect(result).toEqual(mockSiteData);
      expect(mockService.getSiteData).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getSiteTeams', () => {
    it('retourne les équipes du site', async () => {
      mockService.getSiteTeams.mockResolvedValue(mockTeams);
      const result = await controller.getSiteTeams('site-123');
      expect(result).toEqual(mockTeams);
      expect(mockService.getSiteTeams).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getSiteTasks', () => {
    it('retourne les tâches du site', async () => {
      mockService.getSiteTasks.mockResolvedValue(mockTasks);
      const result = await controller.getSiteTasks('site-123');
      expect(result).toEqual(mockTasks);
      expect(mockService.getSiteTasks).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getSiteMilestones', () => {
    it('retourne les jalons du site', async () => {
      mockService.getSiteMilestones.mockResolvedValue(mockMilestones);
      const result = await controller.getSiteMilestones('site-123');
      expect(result).toEqual(mockMilestones);
      expect(mockService.getSiteMilestones).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getAllData', () => {
    it('retourne toutes les données du site', async () => {
      mockService.getAllSiteData.mockResolvedValue(mockAllData);
      const result = await controller.getAllData('site-123');
      expect(result).toEqual(mockAllData);
      expect(mockService.getAllSiteData).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getProject', () => {
    it('retourne les données du projet', async () => {
      mockService.getProjectData.mockResolvedValue(mockProjectData);
      const result = await controller.getProject('proj-1');
      expect(result).toEqual(mockProjectData);
      expect(mockService.getProjectData).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('getProjectSites', () => {
    it('retourne les sites du projet', async () => {
      mockService.getProjectSites.mockResolvedValue(mockProjectSites);
      const result = await controller.getProjectSites('proj-1');
      expect(result).toEqual(mockProjectSites);
      expect(mockService.getProjectSites).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('getProjectContext', () => {
    it('retourne le contexte du projet', async () => {
      mockService.getProjectContext.mockResolvedValue(mockProjectContext);
      const result = await controller.getProjectContext('proj-1');
      expect(result).toEqual(mockProjectContext);
      expect(mockService.getProjectContext).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('getProjectContextForSite', () => {
    it('retourne le contexte du projet pour un site', async () => {
      mockService.getProjectContext.mockResolvedValue(mockProjectContext);
      const result = await controller.getProjectContextForSite('proj-1', 'site-123');
      expect(result).toEqual(mockProjectContext);
      expect(mockService.getProjectContext).toHaveBeenCalledWith('proj-1', 'site-123');
    });
  });

  describe('getUsers', () => {
    it('retourne les utilisateurs', async () => {
      mockService.getUsers.mockResolvedValue(mockUsers);
      const result = await controller.getUsers();
      expect(result).toEqual(mockUsers);
      expect(mockService.getUsers).toHaveBeenCalled();
    });
  });
});
