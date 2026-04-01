import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationPriorityEnum, NotificationTypeEnum } from 'src/entities/notification.entity';
import { AffectedEventDto } from './dto/affected-event.dto';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationEventsController {
  private readonly logger = new Logger(NotificationEventsController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('task.created')
  async handleTaskCreatedEvent(
    @Payload() payload: AffectedEventDto | { value?: AffectedEventDto },
  ) {
    const maybeEvent =
      payload && typeof payload === 'object' && 'value' in payload
        ? payload.value
        : payload;
    console.log('Received task.created event:', maybeEvent);
    const event = maybeEvent as AffectedEventDto | undefined;

    if (!event?.recipients?.length) {
      this.logger.warn('task.created event received without recipients');
      return;
    }

    const priority =  
      event.priority === 'HIGH' ||
      event.priority === 'MEDIUM' ||
      event.priority === 'LOW'
        ? event.priority
        : 'MEDIUM';

    const type =
      event.type === 'INFO' ||
      event.type === 'WARNING' ||
      event.type === 'CRITICAL' ||
      event.type === 'SUCCESS'
        ? event.type
        : 'INFO';

    await Promise.allSettled(
      event.recipients.map((recipientId) =>
        this.notificationService.createNotification({
          title: event.title ?? 'Task update',
          message: event.message ?? 'A task has been updated.',
          recipentId: recipientId,
          isRead: false,
          priority: priority as NotificationPriorityEnum,
          type: type as NotificationTypeEnum,
          trash: false,
        }),
      ),
    );
  }
}
