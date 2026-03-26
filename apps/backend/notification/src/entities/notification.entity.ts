import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationTypeEnum {
  TASK = 'TASK',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  OTHER = 'OTHER',
}

export enum NotificationPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  message: string;

  @Prop()
  recipentId: string;

  @Prop()
  isRead: boolean;

  @Prop({type: String, enum: NotificationPriorityEnum})
  priority: NotificationPriorityEnum;

  @Prop({ type: String, enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

//   @Prop()
//   data: Record<string, any>;

  @Prop({ default: false })
  trash: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
