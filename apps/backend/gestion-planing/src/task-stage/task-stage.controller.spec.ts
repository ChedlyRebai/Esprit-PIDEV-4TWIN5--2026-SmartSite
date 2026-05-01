import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageController } from './task-stage.controller';
import { TaskStageService } from './task-stage.service';
import { TaskStage } from './entities/TaskStage.entities';
import { Types } from 'mongoose';

describe('TaskStageController', () => {
  let controller: TaskStageController;
  let service: TaskStageService;

  const mockTaskStageService = {
    findONe: jest.fn(),
    findByProjectId: jest.fn(),
    findByMilestoneId: jest.fn(),
    findGanttTasksByMilestoneId: jest.fn(),
    findByMilestoneIdAndteamId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskStageController],
      providers: [
        {
          provide: TaskStageService,
          useValue: mockTaskStageService,
        },
      ],
    }).compile();

    controller = module.get<TaskStageController>(TaskStageController);
    service = module.get<TaskStageService>(TaskStageService);
  });

  describe('findAll', () => {
    it('should return all task stages', async () => {
      const mockStages = [
        { _id: new Types.ObjectId(), name: 'To Do', order: 1 },
        { _id: new Types.ObjectId(), name: 'In Progress', order: 2 },
        { _id: new Types.ObjectId(), name: 'Done', order: 3 },
      ];

      mockTaskStageService.findAll.mockResolvedValue(mockStages);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockStages);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no stages exist', async () => {
      mockTaskStageService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByprojectId', () => {
    it('should return task stages for a project', async () => {
      const projectId = 'project-123';
      const mockStages = [
        { _id: new Types.ObjectId(), name: 'Backlog', projectId },
        { _id: new Types.ObjectId(), name: 'Sprint', projectId },
      ];

      mockTaskStageService.findByProjectId.mockResolvedValue(mockStages);

      const result = await controller.findByprojectId(projectId);

      expect(service.findByProjectId).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockStages);
    });

    it('should return empty array when project has no stages', async () => {
      mockTaskStageService.findByProjectId.mockResolvedValue([]);

      const result = await controller.findByprojectId('project-no-stages');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new task stage', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const newStage: TaskStage = {
        name: 'New Stage',
        order: 1,
        color: '#FF0000',
      } as any;

      const createdStage = {
        _id: new Types.ObjectId(),
        ...newStage,
        milestoneId,
      };

      mockTaskStageService.create.mockResolvedValue(createdStage);

      const result = await controller.create(milestoneId, newStage);

      expect(service.create).toHaveBeenCalledWith(milestoneId, newStage);
      expect(result).toEqual(createdStage);
    });
  });

  describe('findByMilestoneIdAndteamId', () => {
    it('should return stages filtered by milestone and team', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const teamId = 'team-123';
      const mockStages = [
        {
          _id: new Types.ObjectId(),
          name: 'Stage',
          tasks: [
            {
              _id: new Types.ObjectId(),
              title: 'Team Task',
              assignedTeams: [teamId],
            },
          ],
        },
      ];

      mockTaskStageService.findByMilestoneIdAndteamId.mockResolvedValue(
        mockStages,
      );

      const result = await controller.findByMilestoneIdAndteamId(
        milestoneId,
        teamId,
      );

      expect(service.findByMilestoneIdAndteamId).toHaveBeenCalledWith(
        milestoneId,
        teamId,
      );
      expect(result).toEqual(mockStages);
    });
  });

  describe('findByMilestoneId', () => {
    it('should return stages for a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const mockStages = [
        { _id: new Types.ObjectId(), name: 'To Do', order: 1, tasks: [] },
        { _id: new Types.ObjectId(), name: 'Done', order: 2, tasks: [] },
      ];

      mockTaskStageService.findByMilestoneId.mockResolvedValue(mockStages);

      const result = await controller.findByMilestoneId(milestoneId);

      expect(service.findByMilestoneId).toHaveBeenCalledWith(milestoneId);
      expect(result).toEqual(mockStages);
    });

    it('should return empty array when milestone has no stages', async () => {
      mockTaskStageService.findByMilestoneId.mockResolvedValue([]);

      const result = await controller.findByMilestoneId('milestone-empty');

      expect(result).toEqual([]);
    });
  });

  describe('findGanttTasksByMilestoneId', () => {
    it('should return Gantt formatted tasks', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const ganttTasks = [
        {
          id: 1,
          text: 'Milestone',
          start: new Date(),
          end: new Date(),
          progress: 50,
          type: 'summary',
        },
        {
          id: 2,
          text: 'Task 1',
          start: new Date(),
          end: new Date(),
          progress: 75,
          parent: 1,
        },
      ];

      mockTaskStageService.findGanttTasksByMilestoneId.mockResolvedValue(
        ganttTasks,
      );

      const result = await controller.findGanttTasksByMilestoneId(milestoneId);

      expect(service.findGanttTasksByMilestoneId).toHaveBeenCalledWith(
        milestoneId,
      );
      expect(result).toEqual(ganttTasks);
      expect(result[0].type).toBe('summary');
    });

    it('should handle empty Gantt data', async () => {
      mockTaskStageService.findGanttTasksByMilestoneId.mockResolvedValue([]);

      const result = await controller.findGanttTasksByMilestoneId(
        'milestone-empty',
      );

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single task stage', async () => {
      const stageId = new Types.ObjectId().toString();
      const mockStage = {
        _id: stageId,
        name: 'Single Stage',
        order: 1,
        color: '#0000FF',
      };

      mockTaskStageService.findONe.mockResolvedValue(mockStage);

      const result = await controller.findOne(stageId);

      expect(service.findONe).toHaveBeenCalledWith(stageId);
      expect(result).toEqual(mockStage);
    });

    it('should return null when stage not found', async () => {
      mockTaskStageService.findONe.mockResolvedValue(null);

      const result = await controller.findOne('invalid-id');

      expect(result).toBeNull();
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

      mockTaskStageService.update.mockResolvedValue(updatedStage);

      const result = await controller.update(stageId, updateData);

      expect(service.update).toHaveBeenCalledWith(stageId, updateData);
      expect(result).toEqual(updatedStage);
    });

    it('should handle partial updates', async () => {
      const stageId = new Types.ObjectId().toString();
      const updateData: TaskStage = {
        name: 'Only Name Updated',
      } as any;

      mockTaskStageService.update.mockResolvedValue({
        _id: stageId,
        ...updateData,
      });

      const result = await controller.update(stageId, updateData);

      expect(service.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('removeTaskSatge', () => {
    it('should delete a task stage', async () => {
      const stageId = new Types.ObjectId().toString();
      const deletedStage = {
        _id: stageId,
        name: 'Deleted Stage',
      };

      mockTaskStageService.remove.mockResolvedValue(deletedStage);

      const result = await controller.removeTaskSatge(stageId);

      expect(service.remove).toHaveBeenCalledWith(stageId);
      expect(result).toEqual(deletedStage);
    });

    it('should throw error when stage not found', async () => {
      mockTaskStageService.remove.mockRejectedValue(
        new Error('Stage not found'),
      );

      await expect(controller.removeTaskSatge('invalid-id')).rejects.toThrow(
        'Stage not found',
      );
    });
  });

  describe('controller definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
