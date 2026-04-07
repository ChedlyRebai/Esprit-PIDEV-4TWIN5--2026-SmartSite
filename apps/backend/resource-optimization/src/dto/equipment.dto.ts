import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  deviceName: string;

  @IsString()
  siteId: string;

  @IsString()
  type: 'excavator' | 'dozer' | 'crane' | 'compressor' | 'generator' | 'other';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  hoursOperating?: number;
}

export class UpdateEquipmentDto {
  @IsOptional()
  @IsNumber()
  hoursOperating?: number;

  @IsOptional()
  @IsNumber()
  fuelConsumption?: number;

  @IsOptional()
  @IsNumber()
  utilizationRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EquipmentResponseDto {
  _id: string;
  deviceName: string;
  siteId: string;
  type: string;
  isActive: boolean;
  hoursOperating: number;
  fuelConsumption: number;
  utilizationRate: number;
  createdAt: Date;
  updatedAt: Date;
}
