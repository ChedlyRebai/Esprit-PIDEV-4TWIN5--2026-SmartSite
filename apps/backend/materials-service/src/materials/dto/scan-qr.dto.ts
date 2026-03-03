import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanQRDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}

// SUPPRESSION: NearbyQueryDto (supprimé car pas utilisé)
// export class NearbyQueryDto { ... } (supprimé)