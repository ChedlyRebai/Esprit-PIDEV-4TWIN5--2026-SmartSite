import { Test, TestingModule } from '@nestjs/testing';
import { StaticsController } from './statics.controller';
import { StaticsService } from './statics.service';

describe('StaticsController', () => {
  let controller: StaticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticsController],
      providers: [
        {
          provide: StaticsService,
          useValue: { getStats: jest.fn().mockResolvedValue({ totalUsers: 1, totalRoles: 2, totalPermissions: 3 }) },
        },
      ],
    }).compile();

    controller = module.get<StaticsController>(StaticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
