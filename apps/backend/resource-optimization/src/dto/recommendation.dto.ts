import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRecommendationDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  scope?: 'project' | 'site';

  @IsString()
  type:
    | 'energy'
    | 'workforce'
    | 'equipment'
    | 'scheduling'
    | 'environmental'
    | 'budget'
    | 'timeline'
    | 'task_distribution'
    | 'resource_allocation'
    | 'individual_task_management';

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  estimatedSavings?: number;

  @IsNumber()
  @IsOptional()
  estimatedCO2Reduction?: number;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsOptional()
  actionItems?: string[];
}

export class UpdateRecommendationStatusDto {
  @IsString()
  status: 'approved' | 'rejected' | 'implemented';
}

export class RecommendationResponseDto {
  projectId?: string;
  _id: string;
  siteId?: string;
  scope?: 'project' | 'site';
  type: string;
  title: string;
  description: string;
  status: string;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  priority: number;
  confidenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}
