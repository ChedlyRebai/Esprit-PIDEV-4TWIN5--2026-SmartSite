import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from '../entities/notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const mockNotificationModel = {
      find: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
