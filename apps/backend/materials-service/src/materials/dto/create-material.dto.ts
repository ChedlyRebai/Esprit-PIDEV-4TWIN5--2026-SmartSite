import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsArray, IsObject, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  category: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  minimumStock: number;

  @IsNumber()
  @Min(0)
  maximumStock: number;

  @IsNumber()
  @Min(0)
  reorderPoint: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityGrade?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsArray()
  assignedProjects?: string[];
}