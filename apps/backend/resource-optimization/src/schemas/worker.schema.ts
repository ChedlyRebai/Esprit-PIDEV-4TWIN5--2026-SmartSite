import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Worker extends Document {
  @Prop({ required: true })
  workerId: string;

  @Prop({ required: true })
  siteId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  role: 'supervisor' | 'engineer' | 'operator' | 'laborer' | 'other';

  @Prop({ default: 0 })
  hoursWorked: number;

  @Prop({ default: 0 })
  costhourlyRate: number; // €/hour

  @Prop({ type: [String], default: [] })
  assignedTasks: string[];

  @Prop({ default: 0 })
  productivityScore: number; // 0-100

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
