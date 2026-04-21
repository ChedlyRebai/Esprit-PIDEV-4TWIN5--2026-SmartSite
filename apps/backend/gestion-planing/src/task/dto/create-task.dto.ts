import { StatusEnum } from "../../StatusEnum";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TaskPriorityEnum } from "../entities/TaskPriorityEnum";

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  description?: string;
  milestoneId: string;
  assignedTeams?: string[];
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;
  projectId?: string;
  siteId?: string;
  createdBy?: string;
  updatedBy?: string;
  status?: StatusEnum;
  progress?: number;
  startDate?: Date;
  endDate?: Date;
}
