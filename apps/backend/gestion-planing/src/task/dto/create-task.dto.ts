import { StatusEnum } from "@/StatusEnum";
import { IsNotEmpty } from "class-validator";

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  description?: string;
  milestoneId: string;
  assignedTeams?: string[];
  priority?: string;
  projectId?: string;
  siteId?: string;
  createdBy?: string;
  updatedBy?: string;
  status?: StatusEnum;
  progress?: number;
  startDate?: Date;
  endDate?: Date;
}
