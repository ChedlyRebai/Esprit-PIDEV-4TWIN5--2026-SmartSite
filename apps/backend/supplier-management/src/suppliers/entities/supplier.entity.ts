import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, match: /^[0-9]{6}$/ })
  code: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ default: 7.0, min: 0, max: 10 })
  quality_score: number;

  @Prop({ default: 7 })
  avg_delivery_days: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// Indexes
SupplierSchema.index({ code: 1 });
SupplierSchema.index({ email: 1 });
SupplierSchema.index({ is_active: 1 });
SupplierSchema.index({ name: 'text' });
