import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFactureDto {
  @IsMongoId()
  @IsString()
  paymentId: string;

  @IsMongoId()
  @IsString()
  siteId: string;

  @IsString()
  @IsString()
  siteNom: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FactureFilterDto {
  @IsOptional()
  @IsString()
  siteNom?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

export class FacturePaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}
