import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageService } from './task-stage.service';

describe('TaskStageService', () => {
  let service: TaskStageService;

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
      providers: [
        {
          provide: TaskStageService,
          useValue: mockTaskStageService,
        },
      ],
    }).compile();

    service = module.get<TaskStageService>(TaskStageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
