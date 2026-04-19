import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: false })
  userId?: string;

  @Prop({ required: false })
  userCin?: string;

  @Prop({ required: false })
  userName?: string;

  @Prop({ required: false })
  userRole?: string;

  @Prop({ required: true })
  actionType: string; // login, logout, create, update, delete, etc.

  @Prop({ required: true })
  actionLabel: string; // readable description

  @Prop({ required: false })
  resourceType?: string; // user, role, auth, permissions...

  @Prop({ required: false })
  resourceId?: string;

  @Prop({ required: false })
  status?: string; // success, failed

  @Prop({ required: false })
  severity?: string; // normal, important, critical

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  details?: string;

  @Prop({ required: false })
  sessionId?: string;

  @Prop({ required: false })
  sessionDurationSec?: number;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
