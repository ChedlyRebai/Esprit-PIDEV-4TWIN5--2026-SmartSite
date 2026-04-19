import { IsString, IsOptional } from 'class-validator';

export class AlertResponseDto {
  _id: string;
  siteId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MarkAlertAsReadDto {
  @IsString()
  @IsOptional()
  status?: 'resolved' | 'ignored';
}
