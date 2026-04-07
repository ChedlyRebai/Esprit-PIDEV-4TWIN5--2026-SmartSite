import { IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Material } from '../entities/material.entity';

export class BulkImportMaterialDto {
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
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  specifications?: string;
}

export class BulkImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    code: string;
    error: string;
  }>;
  materials: Material[];
}