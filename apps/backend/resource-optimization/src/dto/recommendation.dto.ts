import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRecommendationDto {
  @IsString()
  siteId: string;

  @IsString()
  type: 'energy' | 'workforce' | 'equipment' | 'scheduling' | 'environmental';

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
}

export class UpdateRecommendationStatusDto {
  @IsString()
  status: 'approved' | 'rejected' | 'implemented';
}

export class RecommendationResponseDto {
  _id: string;
  siteId: string;
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
