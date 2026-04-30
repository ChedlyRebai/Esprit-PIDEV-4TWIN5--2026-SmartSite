import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';

describe('MilestoneController', () => {
  let controller: MilestoneController;

  beforeEach(async () => {
    const mockMilestoneService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findAllForDashboard: jest.fn(),
      getMilestonesByProjectId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestoneController],
      providers: [
        {
          provide: MilestoneService,
          useValue: mockMilestoneService,
        },
      ],
    }).compile();

    controller = module.get<MilestoneController>(MilestoneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
