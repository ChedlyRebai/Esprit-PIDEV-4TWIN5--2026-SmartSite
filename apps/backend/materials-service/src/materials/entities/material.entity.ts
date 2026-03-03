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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Supplier' }] })
  preferredSuppliers: Types.ObjectId[];

  // CORRECTION: Utiliser Object au lieu de Map
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

  // CORRECTION: Rendu optionnel
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  // SUPPRESSION: Localisation géographique (supprimé car pas utilisé)
  // @Prop({ ... }) geoLocation: ... (supprimé)

  // Images du matériau (optionnel)
  @Prop({ type: [String] })
  images?: string[];
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

// Index pour recherche textuelle
MaterialSchema.index({ name: 'text', code: 'text' });

// Index pour les filtres
MaterialSchema.index({ category: 1 });
MaterialSchema.index({ status: 1 });

// SUPPRESSION: Index géospatial (supprimé car pas utilisé)
// MaterialSchema.index({ geoLocation: '2dsphere' });