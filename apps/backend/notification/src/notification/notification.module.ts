import { Module } from '@nestjs/common';

import { Notification as Notif, NotificationSchema} from 'src/entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEventsController } from './notification-events.controller';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notif.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    NotificationService,
    // JwtModule.register({
    //   secret: 'smartiste',
    //   signOptions: { expiresIn: '24h' },
    // }),
  ],
  controllers: [NotificationController, NotificationEventsController],
})
export class NotificationModule {}
