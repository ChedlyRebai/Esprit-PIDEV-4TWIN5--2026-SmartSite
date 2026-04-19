import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsArray, IsMongoId } from "class-validator";
import { ProjectStatus, ProjectPriority } from "../entities/project.entity";

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsMongoId()
  @IsOptional()
  manager?: string;

  @IsMongoId()
  @IsOptional()
  client?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  sites?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  teamMembers?: string[];

  @IsNumber()
  @IsOptional()
  progress?: number;

  @IsNumber()
  @IsOptional()
  siteCount?: number;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientContact?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsMongoId()
  @IsOptional()
  manager?: string;

  @IsMongoId()
  @IsOptional()
  client?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  sites?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  teamMembers?: string[];

  @IsNumber()
  @IsOptional()
  progress?: number;

  @IsNumber()
  @IsOptional()
  siteCount?: number;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientContact?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;
}

export class ProjectFilterDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @IsDateString()
  @IsOptional()
  startDateTo?: string;

  @IsNumber()
  @IsOptional()
  minBudget?: number;

  @IsNumber()
  @IsOptional()
  maxBudget?: number;

  @IsMongoId()
  @IsOptional()
  manager?: string;

  @IsMongoId()
  @IsOptional()
  client?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
