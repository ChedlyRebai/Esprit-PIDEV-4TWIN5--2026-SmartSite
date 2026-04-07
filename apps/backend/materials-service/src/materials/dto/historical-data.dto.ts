import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class HistoricalDataPointDto {
  @IsDateString()
  hour: string;

  @IsNumber()
  stock: number;

  @IsNumber()
  consumption: number;

  @IsString()
  @IsOptional()
  project?: string;
}

export class UploadCsvDto {
  @IsString()
  materialId: string;
}

export interface ParsedHistoricalData {
  materialId: string;
  data: HistoricalDataPointDto[];
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  averageConsumption: number;
}

export interface TrainingResult {
  materialId: string;
  success: boolean;
  epochs: number;
  loss: number;
  accuracy: number;
  sampleSize: number;
  trainedAt: Date;
}

export interface PredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  consumptionRate: number;
  modelTrained: boolean;
  confidence: number;
  status: 'safe' | 'warning' | 'critical';
  trainingDataAvailable: boolean;
  message: string;
}