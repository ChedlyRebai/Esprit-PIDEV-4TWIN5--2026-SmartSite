import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  supplierCode: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ trim: true })
  specialty: string;

  @Prop({ trim: true })
  contactName: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  country: string;

  @Prop({ trim: true })
  paymentTerms: string;

  @Prop()
  averageDeliveryDays: number;

  @Prop({ type: String })
  notes: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);