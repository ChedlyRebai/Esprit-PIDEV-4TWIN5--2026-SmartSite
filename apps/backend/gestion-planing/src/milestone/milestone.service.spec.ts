import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneService } from './milestone.service';

describe('MilestoneService', () => {
  let service: MilestoneService;

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
      providers: [
        {
          provide: MilestoneService,
          useValue: mockMilestoneService,
        },
      ],
    }).compile();

    service = module.get<MilestoneService>(MilestoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
