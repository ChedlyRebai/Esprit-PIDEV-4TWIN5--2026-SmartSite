import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  PLANNING = "planning",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ProjectPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @Prop({ required: true, enum: ProjectPriority, default: ProjectPriority.MEDIUM })
  priority: ProjectPriority;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  manager?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Client", required: false })
  client?: Types.ObjectId;

  @Prop()
  budget?: number;

  @Prop()
  actualCost?: number;

  @Prop({ type: [Types.ObjectId], ref: "Site", default: [] })
  sites?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "User", default: [] })
  teamMembers?: Types.ObjectId[];

  @Prop()
  progress?: number;

  @Prop()
  siteCount?: number;

  @Prop({ trim: true })
  clientName?: string;

  @Prop({ trim: true })
  clientContact?: string;

  @Prop({ trim: true })
  clientEmail?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id?.toString() ?? ret.id;
    if (ret.startDate instanceof Date) ret.startDate = ret.startDate.toISOString();
    if (ret.endDate instanceof Date) ret.endDate = ret.endDate.toISOString();
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
    return ret;
  },
});
