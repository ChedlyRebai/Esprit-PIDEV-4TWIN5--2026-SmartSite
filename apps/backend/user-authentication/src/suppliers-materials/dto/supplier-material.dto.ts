import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export class CreateSupplierMaterialDto {
  @IsString()
  supplierId: string;

  @IsString()
  catalogItemId: string;

  @IsString()
  @IsOptional()
  supplierRef?: string;

  @IsNumber()
  unitPrice: number;

  @IsEnum(['DT', 'EUR', 'USD'])
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  deliveryDays?: number;

  @IsEnum(['available', 'limited', 'unavailable'])
  @IsOptional()
  availability?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  qualityScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  deliveryScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  communicationScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priceScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  reliabilityScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  overallScore?: number;

  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;

  @IsBoolean()
  @IsOptional()
  recommended?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSupplierMaterialDto {
  @IsString()
  @IsOptional()
  supplierRef?: string;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsEnum(['DT', 'EUR', 'USD'])
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  deliveryDays?: number;

  @IsEnum(['available', 'limited', 'unavailable'])
  @IsOptional()
  availability?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  qualityScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  deliveryScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  communicationScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priceScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  reliabilityScore?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  overallScore?: number;

  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;

  @IsBoolean()
  @IsOptional()
  recommended?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SupplierMaterialQueryDto {
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  catalogItemId?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}