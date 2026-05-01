import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from '../entities/notification.entity';
import { Types } from 'mongoose';

describe('NotificationService', () => {
  let service: NotificationService;
  let notifModel: any;

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
    notifModel = module.get(getModelToken(Notification.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllNotifications', () => {
    it('should return all notifications', async () => {
      const mockNotifications = [
        { _id: new Types.ObjectId(), title: 'Notif 1', isRead: false },
        { _id: new Types.ObjectId(), title: 'Notif 2', isRead: true },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getAllNotifications();

      expect(notifModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should handle empty notifications', async () => {
      notifModel.exec.mockResolvedValue([]);

      const result = await service.getAllNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('getAllNotificationsPaginated', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { _id: new Types.ObjectId(), title: 'Notif 1' },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getAllNotificationsPaginated(1, 10);

      expect(notifModel.find).toHaveBeenCalled();
      expect(notifModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(notifModel.skip).toHaveBeenCalledWith(0);
      expect(notifModel.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockNotifications);
    });

    it('should handle page 2 with limit 10', async () => {
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getAllNotificationsPaginated(2, 10);

      expect(notifModel.skip).toHaveBeenCalledWith(10);
    });

    it('should normalize invalid page to 1', async () => {
      notifModel.exec.mockResolvedValue([]);

      await service.getAllNotificationsPaginated(0, 10);

      expect(notifModel.skip).toHaveBeenCalledWith(0);
    });

    it('should normalize invalid limit to 1', async () => {
      notifModel.exec.mockResolvedValue([]);

      await service.getAllNotificationsPaginated(1, 0);

      expect(notifModel.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('getNotificationsByRecipientId', () => {
    it('should return notifications for a recipient', async () => {
      const recipientId = 'user-123';
      const mockNotifications = [
        { _id: new Types.ObjectId(), recipentId: recipientId },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationsByRecipientId(recipientId);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: recipientId,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array if no notifications', async () => {
      notifModel.exec.mockResolvedValue([]);

      const result = await service.getNotificationsByRecipientId('user-999');

      expect(result).toEqual([]);
    });
  });

  describe('getNotificationsByRecipientIdPaginated', () => {
    it('should return paginated notifications by recipient', async () => {
      const recipientId = 'user-123';
      const mockNotifications = [
        { _id: new Types.ObjectId(), recipentId: recipientId },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationsByRecipientIdPaginated(
        recipientId,
        1,
        10,
      );

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: recipientId,
      });
      expect(notifModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockNotifications);
    });

    it('should handle page boundaries', async () => {
      notifModel.exec.mockResolvedValue([]);

      await service.getNotificationsByRecipientIdPaginated('user-123', 5, 20);

      expect(notifModel.skip).toHaveBeenCalledWith(80);
      expect(notifModel.limit).toHaveBeenCalledWith(20);
    });
  });

  describe('getNotiFicationByUserId', () => {
    it('should call getNotificationsByRecipientId with userId', async () => {
      const userId = 'user-123';
      notifModel.exec.mockResolvedValue([]);

      const spy = jest.spyOn(
        service,
        'getNotificationsByRecipientId',
      );

      await service.getNotiFicationByUserId(userId);

      expect(spy).toHaveBeenCalledWith(userId);
    });
  });

  describe('getNotificationsByTeamId', () => {
    it('should call getNotificationsByRecipientId with teamId', async () => {
      const teamId = 'team-456';
      notifModel.exec.mockResolvedValue([]);

      const spy = jest.spyOn(
        service,
        'getNotificationsByRecipientId',
      );

      await service.getNotificationsByTeamId(teamId);

      expect(spy).toHaveBeenCalledWith(teamId);
    });
  });

  describe('createNotification', () => {
    it('should have createNotification method', () => {
      expect(typeof service.createNotification).toBe('function');
    });
  });

  describe('getUnreadNotificationLengthByserId', () => {
    it('should return unread notification count for user', async () => {
      const userId = 'user-123';

      notifModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await service.getUnreadNotificationLengthByserId(userId);

      expect(notifModel.countDocuments).toHaveBeenCalledWith({
        recipentId: userId,
        isRead: false,
      });
      expect(result).toEqual(5);
    });

    it('should return 0 for user with no unread notifications', async () => {
      notifModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.getUnreadNotificationLengthByserId('user-999');

      expect(result).toEqual(0);
    });
  });

  describe('getUnreadNotificationLengthByTeamId', () => {
    it('should return unread notification count for team', async () => {
      const teamId = 'team-456';

      notifModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(3),
      });

      const result = await service.getUnreadNotificationLengthByTeamId(teamId);

      expect(notifModel.countDocuments).toHaveBeenCalledWith({
        recipentId: teamId,
        isRead: false,
      });
      expect(result).toEqual(3);
    });
  });

  describe('markAllAsReadByTeamId', () => {
    it('should call markAllAsReadByRecipientId with teamId', async () => {
      const teamId = 'team-456';

      notifModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ acknowledged: true }),
      });

      const spy = jest.spyOn(service, 'markAllAsReadByRecipientId');

      await service.markAllAsReadByTeamId(teamId);

      expect(spy).toHaveBeenCalledWith(teamId);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = new Types.ObjectId().toString();

      notifModel.findByIdAndUpdate.mockResolvedValue({
        _id: notificationId,
        isRead: true,
      });

      const result = await service.markAsRead(notificationId);

      expect(notifModel.findByIdAndUpdate).toHaveBeenCalledWith(notificationId, {
        isRead: true,
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsReadByRecipientId', () => {
    it('should mark all unread notifications as read for recipient', async () => {
      const recipientId = 'user-123';

      notifModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ acknowledged: true }),
      });

      await service.markAllAsReadByRecipientId(recipientId);

      expect(notifModel.updateMany).toHaveBeenCalledWith(
        { recipentId: recipientId, isRead: false },
        { $set: { isRead: true } },
      );
    });
  });

  describe('deleteNotificationById', () => {
    it('should delete a notification', async () => {
      const notificationId = new Types.ObjectId().toString();

      notifModel.findByIdAndDelete.mockResolvedValue({
        _id: notificationId,
      });

      const result = await service.deleteNotificationById(notificationId);

      expect(notifModel.findByIdAndDelete).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result._id).toEqual(notificationId);
    });
  });

  describe('getUnreadNotificationsByUserId', () => {
    it('should return unread notifications for user', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        { _id: new Types.ObjectId(), recipentId: userId, isRead: false },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getUnreadNotificationsByUserId(userId);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: userId,
        isRead: false,
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getUnreadNotificationsByUserIdPaginated', () => {
    it('should return paginated unread notifications', async () => {
      const userId = 'user-123';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getUnreadNotificationsByUserIdPaginated(userId, 1, 10);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: userId,
        isRead: false,
      });
      expect(notifModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('getUnreadNotificationsByTeamId', () => {
    it('should return unread notifications for team', async () => {
      const teamId = 'team-456';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getUnreadNotificationsByTeamId(teamId);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: teamId,
        isRead: false,
      });
    });
  });

  describe('getUnreadNotificationsByTeamIdPaginated', () => {
    it('should return paginated unread notifications for team', async () => {
      const teamId = 'team-456';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getUnreadNotificationsByTeamIdPaginated(teamId, 1, 5);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: teamId,
        isRead: false,
      });
      expect(notifModel.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('getReadNotificationsByUserId', () => {
    it('should return read notifications for user', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        { _id: new Types.ObjectId(), recipentId: userId, isRead: true },
      ];

      notifModel.exec.mockResolvedValue(mockNotifications);

      const result = await service.getReadNotificationsByUserId(userId);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: userId,
        isRead: true,
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getReadNotificationsByUserIdPaginated', () => {
    it('should return paginated read notifications', async () => {
      const userId = 'user-123';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getReadNotificationsByUserIdPaginated(userId, 1, 10);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: userId,
        isRead: true,
      });
      expect(notifModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('getReadNotificationsByTeamId', () => {
    it('should return read notifications for team', async () => {
      const teamId = 'team-456';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getReadNotificationsByTeamId(teamId);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: teamId,
        isRead: true,
      });
    });
  });

  describe('getReadNotificationsByTeamIdPaginated', () => {
    it('should return paginated read notifications for team', async () => {
      const teamId = 'team-456';
      const mockNotifications = [];

      notifModel.exec.mockResolvedValue(mockNotifications);

      await service.getReadNotificationsByTeamIdPaginated(teamId, 1, 5);

      expect(notifModel.find).toHaveBeenCalledWith({
        recipentId: teamId,
        isRead: true,
      });
      expect(notifModel.limit).toHaveBeenCalledWith(5);
    });
  });
});
