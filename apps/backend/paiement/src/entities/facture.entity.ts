import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'factures' })
export class Facture extends Document {
  @Prop({ required: true, unique: true })
  numeroFacture: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  paymentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  siteNom: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, trim: true })
  paymentMethod: string;

  @Prop({ type: Date, required: true })
  paymentDate: Date;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  pdfPath?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const FactureSchema = SchemaFactory.createForClass(Facture);

FactureSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

FactureSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
