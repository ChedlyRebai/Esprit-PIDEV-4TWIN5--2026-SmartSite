import { StatusEnum } from '@/StatusEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TaskStage extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  color: string;

  @Prop()
  order: number;

  @Prop()
  projectId: string;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}
