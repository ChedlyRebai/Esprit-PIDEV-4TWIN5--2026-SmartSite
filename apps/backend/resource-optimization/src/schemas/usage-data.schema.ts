import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UsageData extends Document {
  @Prop({ required: true })
  siteId: string;

  @Prop({ required: true })
  resourceId: string; // Can be equipment or worker ID

  @Prop({ required: true })
  resourceType: 'equipment' | 'worker';

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ default: 0 })
  utilizationHours: number;

  @Prop({ default: 0 })
  idleHours: number;

  @Prop({ default: 0 })
  costIncurred: number; // €

  @Prop({ default: 0 })
  carbonFootprint: number; // kg CO2

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const UsageDataSchema = SchemaFactory.createForClass(UsageData);
