import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Recommendation extends Document {
  @Prop({ required: true })
  siteId: string;

  @Prop({ required: true })
  type: 'energy' | 'workforce' | 'equipment' | 'scheduling' | 'environmental';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'implemented';

  @Prop({ default: 0 })
  estimatedSavings: number; // €

  @Prop({ default: 0 })
  estimatedCO2Reduction: number; // kg

  @Prop({ default: 0 })
  priority: number; // 1-10

  @Prop({ default: 0 })
  confidenceScore: number; // 0-100

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  approvedAt: Date;

  @Prop()
  implementedAt: Date;
}
export const RecommendationSchema =
  SchemaFactory.createForClass(Recommendation); 
