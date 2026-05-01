import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { MilestoneService } from './milestone/milestone.service';
import { TaskService } from './task/task.service';

describe('AppService', () => {
  let service: AppService;
  let milestoneService: MilestoneService;
  let taskService: TaskService;

  const mockMilestoneService = {
    findAllForDashboard: jest.fn(),
  };

  const mockTaskService = {
    findUrgentForDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: MilestoneService,
          useValue: mockMilestoneService,
        },
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    milestoneService = module.get<MilestoneService>(MilestoneService);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return Hello World', () => {
      const result = service.getHello();
      expect(result).toBe('Hello World!');
    });
  });

  describe('getAllProjectsForSuperAdmin', () => {
    it('should be defined', () => {
      expect(service.getAllProjectsForSuperAdmin).toBeDefined();
    });

    it('should return empty array when no milestones found', async () => {
      mockMilestoneService.findAllForDashboard.mockResolvedValue([]);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result).toEqual([]);
    });

    it('should group milestones by projectId', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: '2',
          title: 'Milestone 2',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: '3',
          title: 'Milestone 3',
          projectId: 'project-2',
          createdBy: 'user2',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result).toHaveLength(2);
      const project1 = result.find((p) => p._id === 'project-1');
      const project2 = result.find((p) => p._id === 'project-2');
      expect(project1).toBeDefined();
      expect(project2).toBeDefined();
    });

    it('should include tasks in project data', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [
            {
              _id: 'task-1',
              title: 'Task 1',
              priority: 'high',
              progress: 50,
              endDate: new Date('2024-12-31'),
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-02'),
            },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].tasks).toHaveLength(1);
      expect(result[0].tasks[0].title).toBe('Task 1');
    });

    it('should calculate correct progress from tasks', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [
            { _id: 'task-1', progress: 100 },
            { _id: 'task-2', progress: 50 },
            { _id: 'task-3', progress: 0 },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      // Average: (100 + 50 + 0) / 3 = 50
      expect(result[0].progress).toBe(50);
    });

    it('should set status to terminé when progress is 100', async () => {
      const now = new Date();
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [{ _id: 'task-1', progress: 100, endDate: now }],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].status).toBe('terminé');
    });

    it('should set status to en_retard when deadline passed', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // 1 day ago

      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          endDate: pastDate,
          tasks: [{ _id: 'task-1', progress: 50 }],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].status).toBe('en_retard');
    });

    it('should determine priority as highest priority from tasks', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [
            { _id: 'task-1', priority: 'low' },
            { _id: 'task-2', priority: 'urgent' },
            { _id: 'task-3', priority: 'medium' },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].priority).toBe('urgent');
    });

    it('should use milestone title as project name', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Q1 Planning',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].name).toBe('Q1 Planning');
    });

    it('should concatenate descriptions from multiple milestones', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          description: 'Phase 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: '2',
          title: 'Milestone 2',
          description: 'Phase 2',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].description).toContain('Phase 1');
      expect(result[0].description).toContain('Phase 2');
    });

    it('should show milestone count in name when more than one', async () => {
      const milestones = [
        {
          _id: '1',
          title: 'Milestone 1',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: '2',
          title: 'Milestone 2',
          projectId: 'project-1',
          createdBy: 'user1',
          tasks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockMilestoneService.findAllForDashboard.mockResolvedValue(milestones);

      const result = await service.getAllProjectsForSuperAdmin();

      expect(result[0].name).toContain('+1 jalon');
    });
  });

  describe('getUrgentTasksForDashboard', () => {
    it('should be defined', () => {
      expect(service.getUrgentTasksForDashboard).toBeDefined();
    });

    it('should return empty array when no urgent tasks found', async () => {
      mockTaskService.findUrgentForDashboard.mockResolvedValue([]);

      const result = await service.getUrgentTasksForDashboard();

      expect(result).toEqual([]);
    });

    it('should return mapped urgent tasks', async () => {
      const tasks = [
        {
          _id: 'task-1',
          title: 'Urgent Task 1',
          priority: 'urgent',
          progress: 0,
          projectId: 'project-1',
          endDate: new Date('2024-12-31'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: 'task-2',
          title: 'Urgent Task 2',
          priority: 'urgent',
          progress: 25,
          projectId: 'project-2',
          endDate: new Date('2024-12-25'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockTaskService.findUrgentForDashboard.mockResolvedValue(tasks);

      const result = await service.getUrgentTasksForDashboard();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Urgent Task 1');
      expect(result[1].title).toBe('Urgent Task 2');
    });

    it('should map tasks with correct priority normalization', async () => {
      const tasks = [
        {
          _id: 'task-1',
          title: 'Task',
          priority: 'URGENT',
          progress: 0,
          projectId: 'project-1',
          endDate: new Date('2024-12-31'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockTaskService.findUrgentForDashboard.mockResolvedValue(tasks);

      const result = await service.getUrgentTasksForDashboard();

      expect(result[0].priority).toBe('urgent');
    });

    it('should format dates as ISO strings', async () => {
      const now = new Date('2024-01-15T10:30:00Z');
      const tasks = [
        {
          _id: 'task-1',
          title: 'Task',
          priority: 'urgent',
          progress: 0,
          projectId: 'project-1',
          endDate: now,
          createdAt: now,
          updatedAt: now,
        },
      ];

      mockTaskService.findUrgentForDashboard.mockResolvedValue(tasks);

      const result = await service.getUrgentTasksForDashboard();

      expect(result[0].deadline).toBe('2024-01-15');
      expect(result[0].createdAt).toContain('2024-01-15');
      expect(result[0].updatedAt).toContain('2024-01-15');
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
