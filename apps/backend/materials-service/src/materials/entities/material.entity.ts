import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  minimumStock: number;

  @Prop({ required: true, min: 0 })
  maximumStock: number;

  @Prop({ required: true, min: 0 })
  reorderPoint: number;

  @Prop({ type: Number, min: 0, max: 1 })
  qualityGrade: number;

  @Prop({ type: String })
  location: string;

  @Prop({ type: String })
  barcode: string;

  @Prop({ type: String })
  qrCode: string;

  @Prop({ type: String })
  qrCodeImage: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Supplier' }] })
  preferredSuppliers: Types.ObjectId[];

  @Prop({ type: Object })
  priceHistory?: Record<string, number>;

  @Prop({ type: String })
  manufacturer: string;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: Date })
  lastOrdered: Date;

  @Prop({ type: Date })
  lastReceived: Date;

  @Prop({ type: Number, default: 0 })
  reservedQuantity: number;

  @Prop({ type: Number, default: 0 })
  damagedQuantity: number;

  @Prop({ type: String, enum: ['active', 'discontinued', 'obsolete'], default: 'active' })
  status: string;

  @Prop({ type: Object })
  specifications: Record<string, any>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  assignedProjects: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  reorderCount: number;

  @Prop({ type: Date })
  lastCountDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: [String] })
  images?: string[];
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
MaterialSchema.index({ name: 'text', code: 'text' });
MaterialSchema.index({ category: 1 });
MaterialSchema.index({ status: 1 });