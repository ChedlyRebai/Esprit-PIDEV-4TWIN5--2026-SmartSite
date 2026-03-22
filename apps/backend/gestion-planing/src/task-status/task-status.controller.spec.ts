import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusController } from './task-status.controller';

describe('TaskStatusController', () => {
  let controller: TaskStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskStatusController],
    }).compile();

    controller = module.get<TaskStatusController>(TaskStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
