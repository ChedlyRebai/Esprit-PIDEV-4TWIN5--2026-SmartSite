import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationTypeEnum {
  TASK = 'TASK',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  OTHER = 'OTHER',
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

  @Prop({ type: String, enum: NotificationTypeEnum })
  type: string;

//   @Prop()
//   data: Record<string, any>;

  @Prop({ default: false })
  trash: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
