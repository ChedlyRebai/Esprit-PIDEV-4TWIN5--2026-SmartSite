import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnergyConsumptionDto {
  @IsString()
  siteId: string;

  @Type(() => Date)
  @IsDate()
  dateLogged: Date;

  @IsNumber()
  @IsOptional()
  electricity?: number;

  @IsNumber()
  @IsOptional()
  fuelConsumption?: number;

  @IsNumber()
  @IsOptional()
  waterConsumption?: number;

  @IsNumber()
  @IsOptional()
  wasteGenerated?: number;

  @IsNumber()
  @IsOptional()
  carbonEmissions?: number;
}

export class EnergyConsumptionResponseDto {
  _id: string;
  siteId: string;
  dateLogged: Date;
  electricity: number;
  fuelConsumption: number;
  waterConsumption: number;
  wasteGenerated: number;
  carbonEmissions: number;
  createdAt: Date;
  updatedAt: Date;
}
