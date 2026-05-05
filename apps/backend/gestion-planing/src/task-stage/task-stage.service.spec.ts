import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageService } from './task-stage.service';
import { getModelToken } from '@nestjs/mongoose';
import { Milestone } from '../milestone/entities/milestone.entity';
import { Task } from '../task/entities/task.entity';
import { TaskStage } from './entities/TaskStage.entities';
import { Types } from 'mongoose';

describe('TaskStageService', () => {
  let service: TaskStageService;
  let milestoneModel: any;
  let taskModel: any;
  let taskStageModel: any;

  beforeEach(async () => {
    milestoneModel = {
      findById: jest.fn(),
    };

    taskModel = {
      find: jest.fn(),
    };

    taskStageModel = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStageService,
        {
          provide: getModelToken(Milestone.name),
          useValue: milestoneModel,
        },
        {
          provide: getModelToken(Task.name),
          useValue: taskModel,
        },
        {
          provide: getModelToken(TaskStage.name),
          useValue: taskStageModel,
        },
      ],
    }).compile();

    service = module.get<TaskStageService>(TaskStageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findONe', () => {
    it('should return a task stage by id', async () => {
      const stageId = new Types.ObjectId().toString();
      const mockStage = {
        _id: stageId,
        name: 'To Do',
        order: 1,
        color: '#FF0000',
      };

      taskStageModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStage),
      });

      const result = await service.findONe(stageId);

      expect(taskStageModel.findById).toHaveBeenCalledWith(stageId);
      expect(result).toEqual(mockStage);
    });
  });

  describe('findByProjectId', () => {
    it('should return all stages for a project', async () => {
      const projectId = 'project-123';
      const mockStages = [
        { _id: new Types.ObjectId(), name: 'To Do', projectId },
        { _id: new Types.ObjectId(), name: 'In Progress', projectId },
      ];

      taskStageModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStages),
      });

      const result = await service.findByProjectId(projectId);

      expect(taskStageModel.find).toHaveBeenCalledWith({ projectId });
      expect(result).toEqual(mockStages);
    });
  });

  describe('findByMilestoneId', () => {
    it('should return stages for a milestone with sorted order', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const mockStages = [
        {
          _id: new Types.ObjectId(),
          name: 'Backlog',
          order: 1,
          tasks: [],
        },
        {
          _id: new Types.ObjectId(),
          name: 'In Progress',
          order: 2,
          tasks: [],
        },
      ];

      taskStageModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStages),
      });

      const result = await service.findByMilestoneId(milestoneId);

      expect(taskStageModel.find).toHaveBeenCalledWith({ milestoneId });
      expect(result).toEqual(mockStages);
    });
  });

  describe('findGanttTasksByMilestoneId', () => {
    it('should return empty array when milestone not found', async () => {
      milestoneModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findGanttTasksByMilestoneId('invalid-id');

      expect(result).toEqual([]);
    });

    it('should return Gantt formatted tasks for a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const mockMilestone = {
        _id: milestoneId,
        title: 'Q1 Planning',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      };

      const mockStages = [
        {
          _id: new Types.ObjectId(),
          name: 'To Do',
          order: 1,
          tasks: [
            {
              _id: new Types.ObjectId(),
              title: 'Task 1',
              startDate: new Date('2024-01-05'),
              endDate: new Date('2024-01-10'),
              progress: 50,
            },
          ],
        },
      ];

      milestoneModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMilestone),
      });

      taskStageModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStages),
      });

      const result = await service.findGanttTasksByMilestoneId(milestoneId);

      expect(result).toHaveLength(2); // 1 summary + 1 task
      expect(result[0].type).toBe('summary');
      expect(result[0].text).toBe('Q1 Planning');
      expect(result[1].parent).toBe(1);
    });

    it('should handle tasks without dates', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const mockMilestone = {
        _id: milestoneId,
        title: 'Milestone',
        startDate: null,
        endDate: null,
      };

      milestoneModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMilestone),
      });

      taskStageModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findGanttTasksByMilestoneId(milestoneId);

      expect(result).toHaveLength(1); // Just the summary
      expect(result[0].type).toBe('summary');
    });
  });

  describe('findByMilestoneIdAndteamId', () => {
    it('should return stages with team-filtered tasks', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const teamId = 'team-123';
      const mockStages = [
        {
          _id: new Types.ObjectId(),
          name: 'To Do',
          order: 1,
          tasks: [
            {
              _id: new Types.ObjectId(),
              title: 'Team Task',
              assignedTeams: [teamId],
            },
          ],
        },
      ];

      taskStageModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStages),
      });

      const result = await service.findByMilestoneIdAndteamId(
        milestoneId,
        teamId,
      );

      expect(taskStageModel.find).toHaveBeenCalledWith({ milestoneId });
      expect(result).toEqual(mockStages);
    });
  });

  describe('findAll', () => {
    it('should return all task stages', async () => {
      const mockStages = [
        { _id: new Types.ObjectId(), name: 'To Do' },
        { _id: new Types.ObjectId(), name: 'Done' },
      ];

      taskStageModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStages),
      });

      const result = await service.findAll();

      expect(taskStageModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockStages);
    });
  });

  describe('create', () => {
    it('should create a new task stage', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const stageData: TaskStage = {
        name: 'New Stage',
        order: 3,
        color: '#00FF00',
      } as any;

      const createdStage = {
        _id: new Types.ObjectId(),
        ...stageData,
        milestoneId,
      };

      taskStageModel.create.mockResolvedValue(createdStage);

      const result = await service.create(milestoneId, stageData);

      expect(taskStageModel.create).toHaveBeenCalledWith({
        ...stageData,
        milestoneId,
      });
      expect(result).toEqual(createdStage);
    });
  });

  describe('update', () => {
    it('should update a task stage', async () => {
      const stageId = new Types.ObjectId().toString();
      const updateData: TaskStage = {
        name: 'Updated Stage',
        order: 2,
      } as any;

      const updatedStage = {
        _id: stageId,
        ...updateData,
      };

      taskStageModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedStage),
      });

      const result = await service.update(stageId, updateData);

      expect(taskStageModel.findByIdAndUpdate).toHaveBeenCalledWith(
        stageId,
        updateData,
        { new: true },
      );
      expect(result).toEqual(updatedStage);
    });
  });

  describe('remove', () => {
    it('should delete a task stage', async () => {
      const stageId = new Types.ObjectId().toString();
      const deletedStage = {
        _id: stageId,
        name: 'Deleted Stage',
      };

      taskStageModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedStage),
      });

      const result = await service.remove(stageId);

      expect(taskStageModel.findByIdAndDelete).toHaveBeenCalledWith(stageId);
      expect(result).toEqual(deletedStage);
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
