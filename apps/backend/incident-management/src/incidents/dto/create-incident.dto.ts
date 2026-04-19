import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from "../entities/incident.entity";

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  reporterName?: string;

  @IsString()
  @IsOptional()
  reporterPhone?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // CIN optionnel de l'utilisateur auquel l'incident est adressé
  @IsString()
  @IsOptional()
  assignedToCin?: string;

  @IsString()
  @IsOptional()
  assignedUserRole?: string;

  @IsString()
  @IsOptional()
  affectedPersons?: string;

  @IsString()
  @IsOptional()
  immediateAction?: string;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}
