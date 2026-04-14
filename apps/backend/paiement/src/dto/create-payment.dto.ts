import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMongoId,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @IsMongoId({ message: 'siteId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'siteId is required' })
  siteId: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'Reference must contain only alphanumeric characters, hyphens and underscores' })
  @MaxLength(100, { message: 'Reference must not exceed 100 characters' })
  reference?: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(99_999_999, { message: 'Amount exceeds maximum allowed value' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(['cash', 'card', 'transfer', 'check'], {
    message: 'Payment method must be one of: cash, card, transfer, check',
  })
  paymentMethod: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\w\s\-.,éèêàâùûôîçÉÈÊÀÂÙÛÔÎÇ]+$/, { message: 'Description contains invalid characters' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'paymentDate must be a valid ISO date string' })
  paymentDate?: string;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled', 'refunded', 'paid'], {
    message: 'Status must be one of: pending, completed, cancelled, refunded, paid',
  })
  status?: string;
}
