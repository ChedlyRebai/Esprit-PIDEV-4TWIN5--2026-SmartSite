import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEventsController } from './notification-events.controller';
import { NotificationService } from './notification.service';
import {
  NotificationPriorityEnum,
  NotificationTypeEnum,
} from '../entities/notification.entity';

describe('NotificationEventsController', () => {
  let controller: NotificationEventsController;
  let service: NotificationService;

  beforeEach(async () => {
    const mockNotificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationEventsController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationEventsController>(
      NotificationEventsController,
    );
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleTaskCreatedEvent', () => {
    it('should create notifications for all recipients', async () => {
      const payload = {
        title: 'Task Created',
        message: 'A new task has been created',
        recipients: ['user-1', 'user-2'],
        priority: 'HIGH',
        type: 'INFO',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).toHaveBeenCalledTimes(2);
      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task Created',
          recipentId: 'user-1',
          isRead: false,
          priority: 'HIGH',
          type: 'INFO',
          trash: false,
        }),
      );
      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task Created',
          recipentId: 'user-2',
          isRead: false,
          priority: 'HIGH',
          type: 'INFO',
          trash: false,
        }),
      );
    });

    it('should handle nested payload format with value property', async () => {
      const payload = {
        value: {
          title: 'Task Update',
          message: 'Task has been updated',
          recipients: ['user-3'],
          priority: 'MEDIUM',
          type: 'WARNING',
        },
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task Update',
          recipentId: 'user-3',
          priority: 'MEDIUM',
          type: 'WARNING',
        }),
      );
    });

    it('should use default priority if not provided', async () => {
      const payload = {
        title: 'Task',
        message: 'Task message',
        recipients: ['user-4'],
        priority: 'UNKNOWN',
        type: 'INFO',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'MEDIUM',
        }),
      );
    });

    it('should use default type if not provided', async () => {
      const payload = {
        title: 'Task',
        message: 'Task message',
        recipients: ['user-5'],
        priority: 'HIGH',
        type: 'UNKNOWN',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INFO',
        }),
      );
    });

    it('should use default title and message if not provided', async () => {
      const payload = {
        recipients: ['user-6'],
        priority: 'LOW',
        type: 'SUCCESS',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task update',
          message: 'A task has been updated.',
        }),
      );
    });

    it('should not create notifications if recipients list is empty', async () => {
      const payload = {
        title: 'Task',
        message: 'Task message',
        recipients: [],
        priority: 'HIGH',
        type: 'INFO',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).not.toHaveBeenCalled();
    });

    it('should handle missing recipients gracefully', async () => {
      const payload = {
        title: 'Task',
        message: 'Task message',
        priority: 'HIGH',
        type: 'INFO',
      };

      await controller.handleTaskCreatedEvent(payload);

      expect(service.createNotification).not.toHaveBeenCalled();
    });

    it('should handle all valid priority values', async () => {
      const priorities = ['HIGH', 'MEDIUM', 'LOW'];

      for (const priority of priorities) {
        jest.clearAllMocks();
        const payload = {
          title: 'Task',
          recipients: ['user'],
          priority,
          type: 'INFO',
        };

        await controller.handleTaskCreatedEvent(payload);

        expect(service.createNotification).toHaveBeenCalledWith(
          expect.objectContaining({ priority }),
        );
      }
    });

    it('should handle all valid type values', async () => {
      const types = ['INFO', 'WARNING', 'CRITICAL', 'SUCCESS'];

      for (const type of types) {
        jest.clearAllMocks();
        const payload = {
          title: 'Task',
          recipients: ['user'],
          priority: 'HIGH',
          type,
        };

        await controller.handleTaskCreatedEvent(payload);

        expect(service.createNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type }),
        );
      }
    });
  });
});
