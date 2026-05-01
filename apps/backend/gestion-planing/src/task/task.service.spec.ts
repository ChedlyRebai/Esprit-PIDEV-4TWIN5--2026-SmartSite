import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getModelToken } from '@nestjs/mongoose';
import { Milestone } from '../milestone/entities/milestone.entity';
import { Task } from './entities/task.entity';
import { TaskStage } from '../task-stage/entities/TaskStage.entities';
import { ClientKafka } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskPriorityEnum } from './entities/TaskPriorityEnum';

describe('TaskService', () => {
  let service: TaskService;
  let milestoneModel: {
    findById: jest.Mock;
  };
  let taskModel: {
    create: jest.Mock;
  };
  let taskStageModel: {
    findByIdAndUpdate: jest.Mock;
  };
  let notificationClient: {
    connect: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(async () => {
    milestoneModel = {
      findById: jest.fn(),
    };

    taskModel = {
      create: jest.fn(),
    };

    taskStageModel = {
      findByIdAndUpdate: jest.fn(),
    };

    notificationClient = {
      connect: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
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
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: notificationClient as unknown as ClientKafka,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a task, updates the milestone and stage, and emits a notification', async () => {
    const milestoneId = new Types.ObjectId().toString();
    const taskStageId = new Types.ObjectId().toString();
    const taskId = new Types.ObjectId();

    const milestoneDocument = {
      tasks: [] as Types.ObjectId[],
      save: jest.fn().mockResolvedValue(undefined),
    };

    const createdTask = {
      _id: taskId,
      title: 'Task alpha',
      description: 'Important work item',
      priority: TaskPriorityEnum.HIGH,
    };

    milestoneModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(milestoneDocument),
    });

    taskModel.create.mockResolvedValue(createdTask);

    taskStageModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acknowledged: true }),
    });

    notificationClient.emit.mockReturnValue(of(undefined));

    const createTaskDto: CreateTaskDto = {
      title: 'Task alpha',
      description: 'Important work item',
      milestoneId,
      assignedTeams: [' team-a ', 'team-b'],
      priority: TaskPriorityEnum.HIGH,
    };

    const result = await service.create(
      createTaskDto,
      milestoneId,
      taskStageId,
    );

    expect(milestoneModel.findById).toHaveBeenCalledWith(milestoneId);
    expect(taskModel.create).toHaveBeenCalledWith({
      ...createTaskDto,
      milestoneId,
      assignedTeams: ['team-a', 'team-b'],
    });
    expect(taskStageModel.findByIdAndUpdate).toHaveBeenCalledWith(
      taskStageId,
      { $push: { tasks: taskId } },
    );
    expect(milestoneDocument.tasks).toEqual([taskId]);
    expect(milestoneDocument.save).toHaveBeenCalled();
    expect(notificationClient.emit).toHaveBeenCalledWith(
      'task.created',
      expect.objectContaining({
        taskId: taskId.toString(),
        recipients: ['team-a', 'team-b'],
        priority: 'HIGH',
      }),
    );
    expect(result).toBe(createdTask);
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'Task 1',
          priority: TaskPriorityEnum.HIGH,
        },
        {
          _id: new Types.ObjectId(),
          title: 'Task 2',
          priority: TaskPriorityEnum.LOW,
        },
      ];

      taskModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTasks),
      });

      const result = await service.findAll();

      expect(taskModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });

    it('should throw error on failure', async () => {
      taskModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(service.findAll()).rejects.toThrow(
        'Error fetching tasks: DB error',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const taskId = new Types.ObjectId().toString();
      const mockTask = {
        _id: taskId,
        title: 'Single Task',
        priority: TaskPriorityEnum.MEDIUM,
      };

      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      });

      const result = await service.findOne(taskId);

      expect(taskModel.findById).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found', async () => {
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Not found')),
      });

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Error fetching task: Not found',
      );
    });
  });

  describe('findUrgentForDashboard', () => {
    it('should return urgent or soon-ending tasks', async () => {
      const mockTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'Critical Task',
          priority: 'CRITICAL',
          endDate: new Date(),
        },
      ];

      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTasks),
      });

      const result = await service.findUrgentForDashboard();

      expect(taskModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = new Types.ObjectId().toString();
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
        priority: TaskPriorityEnum.LOW,
      };

      const updatedTask = {
        _id: taskId,
        ...updateDto,
      };

      taskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTask),
      });

      const result = await service.update(taskId, updateDto);

      expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedTask);
    });

    it('should normalize assigned teams when updating', async () => {
      const taskId = new Types.ObjectId().toString();
      const updateDto = {
        title: 'Task',
        assignedTeams: [' team-a ', 'team-b'],
      };

      taskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: taskId, ...updateDto }),
      });

      await service.update(taskId, updateDto);

      expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({
          assignedTeams: ['team-a', 'team-b'],
        }),
        { new: true },
      );
    });

    it('should throw error when task not found', async () => {
      taskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('invalid-id', { title: 'Updated' }),
      ).rejects.toThrow('Error updating task: Task with id invalid-id not found');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = new Types.ObjectId().toString();
      const taskStageId = new Types.ObjectId().toString();

      const deletedTask = {
        _id: taskId,
        title: 'Task to delete',
        status: taskStageId,
      };

      taskModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedTask),
      });

      taskStageModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ acknowledged: true }),
      });

      const result = await service.remove(taskId);

      expect(taskModel.findByIdAndDelete).toHaveBeenCalledWith(taskId);
      expect(taskStageModel.findByIdAndUpdate).toHaveBeenCalledWith(
        taskStageId,
        { $pull: { tasks: taskId } },
      );
      expect(result).toEqual(deletedTask);
    });

    it('should throw error when task not found', async () => {
      taskModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Error removing task: Task with id invalid-id not found',
      );
    });
  });

  describe('getMyTask', () => {
    it('should return empty array when userId is empty', async () => {
      const result = await service.getMyTask('');

      expect(result).toEqual([]);
    });

    it('should return tasks assigned to user', async () => {
      const userId = 'user-123';
      const mockTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'User Task 1',
          assignedTeams: [userId],
        },
      ];

      taskModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTasks),
      });

      const result = await service.getMyTask(userId);

      expect(taskModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getTaskByTeamid', () => {
    it('should return tasks for a team', async () => {
      const teamId = 'team-123';
      const mockTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'Team Task',
          assignedTeams: [teamId],
        },
      ];

      taskModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTasks),
      });

      const result = await service.getTaskByTeamid(teamId);

      expect(taskModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });

    it('should throw error on failure', async () => {
      taskModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(service.getTaskByTeamid('team-123')).rejects.toThrow(
        'Error fetching tasks for team team-123: DB error',
      );
    });
  });

  describe('getTasksForGantt', () => {
    it('should return tasks formatted for Gantt', async () => {
      const projectId = 'project-123';
      const mockTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'Gantt Task',
          projectId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          progress: 50,
          priority: 'HIGH',
          type: 'task',
        },
      ];

      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTasks),
      });

      const result = await service.getTasksForGantt(projectId);

      expect(taskModel.find).toHaveBeenCalledWith({ projectId });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text', 'Gantt Task');
      expect(result[0]).toHaveProperty('progress', 50);
    });

    it('should throw error on failure', async () => {
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(service.getTasksForGantt('project-123')).rejects.toThrow(
        'Error fetching tasks for Gantt: DB error',
      );
    });
  });

  describe('updateTaskDates', () => {
    it('should update task dates', async () => {
      const taskId = new Types.ObjectId().toString();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const updatedTask = {
        _id: taskId,
        title: 'Task',
        startDate,
        endDate,
      };

      taskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTask),
      });

      const result = await service.updateTaskDates(
        taskId,
        startDate,
        endDate,
      );

      expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        { startDate, endDate },
        { new: true },
      );
      expect(result).toEqual(updatedTask);
    });

    it('should throw error when task not found', async () => {
      taskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateTaskDates(
          'invalid-id',
          new Date(),
          new Date(),
        ),
      ).rejects.toThrow('Error updating task dates: Task with id invalid-id not found');
    });
  });
});
