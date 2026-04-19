import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EnergyConsumption extends Document {
  @Prop({ required: true })
  siteId: string;

  @Prop({ required: true })
  dateLogged: Date;

  @Prop({ default: 0 })
  electricity: number; // kWh

  @Prop({ default: 0 })
  fuelConsumption: number; // litres

  @Prop({ default: 0 })
  waterConsumption: number; // m³

  @Prop({ default: 0 })
  wasteGenerated: number; // kg

  @Prop({ default: 0 })
  carbonEmissions: number; // kg CO2

  @Prop({ type: Object, default: {} })
  source: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EnergyConsumptionSchema =
  SchemaFactory.createForClass(EnergyConsumption);
