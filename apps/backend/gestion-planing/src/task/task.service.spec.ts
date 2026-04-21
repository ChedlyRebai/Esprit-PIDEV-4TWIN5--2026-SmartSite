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
});
