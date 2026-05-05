import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Types } from 'mongoose';
import { TaskPriorityEnum } from './entities/TaskPriorityEnum';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getTasksForGantt: jest.fn(),
    getMyTask: jest.fn(),
    getTAsksByTeamId: jest.fn(),
    getTasksBYMilestoneId: jest.fn(),
    updateNew: jest.fn(),
    updateTaskDates: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUrgentForDashboard: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  describe('create', () => {
    it('should create a task', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const taskStageId = new Types.ObjectId().toString();
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriorityEnum.HIGH,
        assignedTeams: ['team-1'],
      };

      const createdTask = {
        _id: new Types.ObjectId(),
        ...createTaskDto,
        milestoneId,
      };

      mockTaskService.create.mockResolvedValue(createdTask);

      const result = await controller.create(
        createTaskDto,
        milestoneId,
        taskStageId,
      );

      expect(service.create).toHaveBeenCalledWith(
        createTaskDto,
        milestoneId,
        taskStageId,
      );
      expect(result).toEqual(createdTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = [
        { _id: new Types.ObjectId(), title: 'Task 1' },
        { _id: new Types.ObjectId(), title: 'Task 2' },
      ];

      mockTaskService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });

    it('should return empty array when no tasks exist', async () => {
      mockTaskService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const taskId = new Types.ObjectId().toString();
      const task = {
        _id: taskId,
        title: 'Single Task',
        priority: TaskPriorityEnum.MEDIUM,
      };

      mockTaskService.findOne.mockResolvedValue(task);

      const result = await controller.findOne(taskId);

      expect(service.findOne).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(task);
    });
  });

  describe('getMytasks', () => {
    it('should return tasks for the current user', async () => {
      const userTasks = [
        { _id: new Types.ObjectId(), title: 'My Task 1' },
        { _id: new Types.ObjectId(), title: 'My Task 2' },
      ];

      mockTaskService.getMyTask.mockResolvedValue(userTasks);

      const result = await controller.getMytasks();

      expect(service.getMyTask).toHaveBeenCalled();
      expect(result).toEqual(userTasks);
    });
  });

  describe('getTasksByTeamId', () => {
    it('should return tasks for a specific team', async () => {
      const teamId = 'team-123';
      const teamTasks = [
        {
          _id: new Types.ObjectId(),
          title: 'Team Task',
          assignedTeams: [teamId],
        },
      ];

      mockTaskService.getTAsksByTeamId.mockResolvedValue(teamTasks);

      const result = await controller.getTasksByTeamId(teamId);

      expect(service.getTAsksByTeamId).toHaveBeenCalledWith(teamId);
      expect(result).toEqual(teamTasks);
    });
  });

  describe('findBYmilestoneId', () => {
    it('should return tasks for a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const milestoneTasks = [
        { id: 1, text: 'Milestone Task', parent: 0 },
      ];

      mockTaskService.getTasksBYMilestoneId.mockResolvedValue(milestoneTasks);

      const result = await controller.findBYmilestoneId(milestoneId);

      expect(service.getTasksBYMilestoneId).toHaveBeenCalledWith(milestoneId);
      expect(result).toEqual(milestoneTasks);
    });
  });

  describe('getTasksForGantt', () => {
    it('should return Gantt formatted tasks for a project', async () => {
      const projectId = 'project-123';
      const ganttTasks = [
        {
          id: new Types.ObjectId(),
          text: 'Gantt Task',
          start: new Date(),
          end: new Date(),
          progress: 50,
        },
      ];

      mockTaskService.getTasksForGantt.mockResolvedValue(ganttTasks);

      const result = await controller.getTasksForGantt(projectId);

      expect(service.getTasksForGantt).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(ganttTasks);
    });
  });

  describe('updateTaskDates', () => {
    it('should update task dates', async () => {
      const taskId = new Types.ObjectId().toString();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const body = { startDate, endDate };

      const updatedTask = {
        _id: taskId,
        title: 'Updated Task',
        startDate,
        endDate,
      };

      mockTaskService.updateTaskDates.mockResolvedValue(updatedTask);

      const result = await controller.updateTaskDates(taskId, body);

      expect(service.updateTaskDates).toHaveBeenCalledWith(
        taskId,
        startDate,
        endDate,
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('updateTaskStage', () => {
    it('should move task to a new stage', async () => {
      const taskId = new Types.ObjectId().toString();
      const colunId = new Types.ObjectId().toString();

      const updatedTask = {
        _id: taskId,
        status: colunId,
      };

      mockTaskService.updateNew.mockResolvedValue(updatedTask);

      const result = await controller.updateTaskStage(taskId, colunId);

      expect(service.updateNew).toHaveBeenCalledWith(taskId, colunId);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = new Types.ObjectId().toString();
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Title',
        priority: TaskPriorityEnum.LOW,
      };

      const updatedTask = {
        _id: taskId,
        ...updateTaskDto,
      };

      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(taskId, updateTaskDto);

      expect(service.update).toHaveBeenCalledWith(taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = new Types.ObjectId().toString();
      const deletedTask = { _id: taskId, title: 'Deleted Task' };

      mockTaskService.remove.mockResolvedValue(deletedTask);

      const result = await controller.remove(taskId);

      expect(service.remove).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(deletedTask);
    });
  });

  describe('controller definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
