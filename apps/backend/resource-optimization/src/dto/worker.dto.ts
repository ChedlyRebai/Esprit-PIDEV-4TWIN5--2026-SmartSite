import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  workerId: string;

  @IsString()
  siteId: string;

  @IsString()
  name: string;

  @IsString()
  role: 'supervisor' | 'engineer' | 'operator' | 'laborer' | 'other';

  @IsNumber()
  @IsOptional()
  hoursWorked?: number;

  @IsNumber()
  @IsOptional()
  costhourlyRate?: number;
}

export class UpdateWorkerDto {
  @IsOptional()
  @IsNumber()
  hoursWorked?: number;

  @IsOptional()
  @IsNumber()
  productivityScore?: number;
}

export class WorkerResponseDto {
  _id: string;
  workerId: string;
  siteId: string;
  name: string;
  role: string;
  hoursWorked: number;
  costhourlyRate: number;
  productivityScore: number;
  createdAt: Date;
  updatedAt: Date;
}
