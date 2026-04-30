import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageController } from './task-stage.controller';
import { TaskStageService } from './task-stage.service';

describe('TaskStageController', () => {
  let controller: TaskStageController;

  beforeEach(async () => {
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
