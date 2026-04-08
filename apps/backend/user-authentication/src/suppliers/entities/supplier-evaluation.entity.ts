import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SupplierEvaluation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  qualityRating: number;

  @Prop({ required: true })
  priceRating: number;

  @Prop({ required: true })
  deliveryRating: number;

  @Prop({ required: true })
  communicationRating: number;

  @Prop()
  overallRating: number;

  @Prop()
  comment: string;

  @Prop({ required: true })
  evaluatedBy: string;

  @Prop()
  projectName: string;

  @Prop()
  deliveryDays: number;

  @Prop()
  priceRange: string;
}

export const SupplierEvaluationSchema = SchemaFactory.createForClass(SupplierEvaluation);
