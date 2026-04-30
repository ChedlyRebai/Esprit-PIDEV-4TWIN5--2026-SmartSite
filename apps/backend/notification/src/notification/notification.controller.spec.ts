import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const mockNotificationService = {
      createNotification: jest.fn(),
      getAllNotificationsPaginated: jest.fn(),
      getNotificationsByRecipientIdPaginated: jest.fn(),
      getNotiFicationByUserId: jest.fn(),
      getUnreadNotificationsByUserIdPaginated: jest.fn(),
      getUnreadNotificationsByTeamIdPaginated: jest.fn(),
      getReadNotificationsByUserIdPaginated: jest.fn(),
      getReadNotificationsByTeamIdPaginated: jest.fn(),
      getUnreadNotificationLengthByserId: jest.fn(),
      getUnreadNotificationLengthByTeamId: jest.fn(),
      markAllAsReadByTeamId: jest.fn(),
      deleteNotificationById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
