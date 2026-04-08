import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Types } from 'mongoose';

export class CreateSupplierEvaluationDto {
  @IsString()
  supplierId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  qualityRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  priceRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  deliveryRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  overallRating?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  evaluatedBy: string;

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsNumber()
  @IsOptional()
  deliveryDays?: number;

  @IsString()
  @IsOptional()
  priceRange?: string;
}

export class UpdateSupplierEvaluationDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  qualityRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  priceRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  deliveryRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  communicationRating?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  overallRating?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsNumber()
  @IsOptional()
  deliveryDays?: number;

  @IsString()
  @IsOptional()
  priceRange?: string;
}

export class SupplierEvaluationQueryDto {
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
