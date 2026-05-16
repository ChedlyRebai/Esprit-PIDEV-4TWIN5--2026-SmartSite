import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

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
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /notification', () => {
    it('should create a new notification', async () => {
      const notification = {
        title: 'Test Notification',
        message: 'Test message',
        recipentId: 'user-123',
        isRead: false,
      };

      jest
        .spyOn(service, 'createNotification')
        .mockResolvedValue(notification as any);

      const result = await controller.createNotification(notification as any);

      expect(service.createNotification).toHaveBeenCalledWith(notification);
      expect(result).toEqual(notification);
    });
  });

  describe('GET /notification', () => {
    it('should return all notifications with default pagination', async () => {
      const mockNotifications = [
        { _id: new Types.ObjectId(), title: 'Notif 1' },
      ];

      jest
        .spyOn(service, 'getAllNotificationsPaginated')
        .mockResolvedValue(mockNotifications as any);

      const result = await controller.getAllNotifications();

      expect(service.getAllNotificationsPaginated).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockNotifications);
    });

    it('should return paginated notifications with custom page and limit', async () => {
      const mockNotifications = [];

      jest
        .spyOn(service, 'getAllNotificationsPaginated')
        .mockResolvedValue(mockNotifications as any);

      await controller.getAllNotifications('2', '20');

      expect(service.getAllNotificationsPaginated).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('GET /notification/user/:userId', () => {
    it('should return notifications for a user', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        { _id: new Types.ObjectId(), recipentId: userId },
      ];

      jest
        .spyOn(service, 'getNotificationsByRecipientIdPaginated')
        .mockResolvedValue(mockNotifications as any);

      const result = await controller.getNotificationsByUserId(userId);

      expect(
        service.getNotificationsByRecipientIdPaginated,
      ).toHaveBeenCalledWith(userId, 1, 10);
      expect(result).toEqual(mockNotifications);
    });

    it('should handle custom pagination', async () => {
      jest
        .spyOn(service, 'getNotificationsByRecipientIdPaginated')
        .mockResolvedValue([]);

      await controller.getNotificationsByUserId('user-123', '3', '15');

      expect(
        service.getNotificationsByRecipientIdPaginated,
      ).toHaveBeenCalledWith('user-123', 3, 15);
    });
  });

  describe('GET /notification/team/:teamId', () => {
    it('should return notifications for a team', async () => {
      const teamId = 'team-456';

      jest
        .spyOn(service, 'getNotificationsByRecipientIdPaginated')
        .mockResolvedValue([]);

      await controller.getNotificationsByTeamId(teamId);

      expect(
        service.getNotificationsByRecipientIdPaginated,
      ).toHaveBeenCalledWith(teamId, 1, 10);
    });
  });

  describe('GET /notification/mynotifications', () => {
    it('should return current user notifications', async () => {
      const user = { sub: 'user-123' };
      const mockNotifications = [];

      jest
        .spyOn(service, 'getNotiFicationByUserId')
        .mockResolvedValue(mockNotifications as any);

      const result = await controller.getMyNotifications(user);

      expect(service.getNotiFicationByUserId).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockNotifications);
    });

    it('should extract userId from different token payload fields', async () => {
      const user = { userId: 'user-456' };

      jest
        .spyOn(service, 'getNotiFicationByUserId')
        .mockResolvedValue([]);

      await controller.getMyNotifications(user);

      expect(service.getNotiFicationByUserId).toHaveBeenCalledWith('user-456');
    });

    it('should fallback to id field', async () => {
      const user = { id: 'user-789' };

      jest
        .spyOn(service, 'getNotiFicationByUserId')
        .mockResolvedValue([]);

      await controller.getMyNotifications(user);

      expect(service.getNotiFicationByUserId).toHaveBeenCalledWith('user-789');
    });

    it('should fallback to _id field', async () => {
      const user = { _id: 'user-000' };

      jest
        .spyOn(service, 'getNotiFicationByUserId')
        .mockResolvedValue([]);

      await controller.getMyNotifications(user);

      expect(service.getNotiFicationByUserId).toHaveBeenCalledWith('user-000');
    });

    it('should throw UnauthorizedException if userId is missing', async () => {
      const user = {};

      await expect(controller.getMyNotifications(user)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('GET /notification/unread', () => {
    it('should return unread notifications for current user', async () => {
      const user = { sub: 'user-123' };
      const mockNotifications = [];

      jest
        .spyOn(service, 'getUnreadNotificationsByUserIdPaginated')
        .mockResolvedValue(mockNotifications as any);

      await controller.getUnreadNotificationsByUserId(user);

      expect(
        service.getUnreadNotificationsByUserIdPaginated,
      ).toHaveBeenCalledWith('user-123', 1, 10);
    });

    it('should throw UnauthorizedException if userId missing', async () => {
      const user = {};

      await expect(
        controller.getUnreadNotificationsByUserId(user),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle custom pagination', async () => {
      const user = { sub: 'user-123' };

      jest
        .spyOn(service, 'getUnreadNotificationsByUserIdPaginated')
        .mockResolvedValue([]);

      await controller.getUnreadNotificationsByUserId(user, '2', '5');

      expect(
        service.getUnreadNotificationsByUserIdPaginated,
      ).toHaveBeenCalledWith('user-123', 2, 5);
    });
  });

  describe('GET /notification/team/:teamId/unread', () => {
    it('should return unread notifications for team', async () => {
      const teamId = 'team-456';

      jest
        .spyOn(service, 'getUnreadNotificationsByTeamIdPaginated')
        .mockResolvedValue([]);

      await controller.getUnreadNotificationsByTeamId(teamId);

      expect(
        service.getUnreadNotificationsByTeamIdPaginated,
      ).toHaveBeenCalledWith(teamId, 1, 10);
    });
  });

  describe('GET /notification/read', () => {
    it('should return read notifications for current user', async () => {
      const user = { sub: 'user-123' };

      jest
        .spyOn(service, 'getReadNotificationsByUserIdPaginated')
        .mockResolvedValue([]);

      await controller.getReadNotificationsByUserId(user);

      expect(
        service.getReadNotificationsByUserIdPaginated,
      ).toHaveBeenCalledWith('user-123', 1, 10);
    });

    it('should throw UnauthorizedException if userId missing', async () => {
      const user = {};

      await expect(
        controller.getReadNotificationsByUserId(user),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /notification/team/:teamId/read', () => {
    it('should return read notifications for team', async () => {
      const teamId = 'team-456';

      jest
        .spyOn(service, 'getReadNotificationsByTeamIdPaginated')
        .mockResolvedValue([]);

      await controller.getReadNotificationsByTeamId(teamId);

      expect(
        service.getReadNotificationsByTeamIdPaginated,
      ).toHaveBeenCalledWith(teamId, 1, 10);
    });
  });

  describe('GET /notification/unread-count', () => {
    it('should return unread notification count for user', async () => {
      const user = { sub: 'user-123' };

      jest.spyOn(service, 'getUnreadNotificationLengthByserId').mockResolvedValue(5);

      const result = await controller.getUnreadNotificationLengthByserId(user);

      expect(service.getUnreadNotificationLengthByserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result).toEqual(5);
    });

    it('should throw UnauthorizedException if userId missing', async () => {
      const user = {};

      await expect(
        controller.getUnreadNotificationLengthByserId(user),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /notification/team/:teamId/unread-count', () => {
    it('should return unread notification count for team', async () => {
      const teamId = 'team-456';

      jest
        .spyOn(service, 'getUnreadNotificationLengthByTeamId')
        .mockResolvedValue(3);

      const result = await controller.getUnreadNotificationLengthByTeamId(teamId);

      expect(service.getUnreadNotificationLengthByTeamId).toHaveBeenCalledWith(
        teamId,
      );
      expect(result).toEqual(3);
    });
  });

  describe('POST /notification/team/:teamId/mark-all-read', () => {
    it('should mark all team notifications as read', async () => {
      const teamId = 'team-456';

      jest.spyOn(service, 'markAllAsReadByTeamId').mockResolvedValue(true);

      const result = await controller.markAllTeamNotificationsAsRead(teamId);

      expect(service.markAllAsReadByTeamId).toHaveBeenCalledWith(teamId);
      expect(result).toEqual(true);
    });
  });

  describe('DELETE /notification/:id', () => {
    it('should delete a notification', async () => {
      const notificationId = new Types.ObjectId().toString();

      jest.spyOn(service, 'deleteNotificationById').mockResolvedValue(true);

      const result = await controller.deleteNotification(notificationId);

      expect(service.deleteNotificationById).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toEqual(true);
    });
  });
});
