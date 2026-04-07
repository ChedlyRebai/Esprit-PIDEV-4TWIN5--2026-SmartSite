import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Equipment extends Document {
  @Prop({ required: true })
  deviceName: string;

  @Prop({ required: true })
  siteId: string;

  @Prop({ required: true })
  type: 'excavator' | 'dozer' | 'crane' | 'compressor' | 'generator' | 'other';

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  hoursOperating: number;

  @Prop({ default: 0 })
  fuelConsumption: number; // litres

  @Prop({ default: 0 })
  maintenanceCost: number; // €

  @Prop()
  lastMaintenance: Date;

  @Prop({ default: 0 })
  utilizationRate: number; // percentage

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);
