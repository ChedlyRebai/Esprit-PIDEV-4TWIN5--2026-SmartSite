import { IsEnum, IsOptional, IsString } from "class-validator";
import { IncidentType, IncidentDegree } from "../entities/incident.entity";

export class UpdateIncidentDto {
  @IsEnum(IncidentType)
  @IsOptional()
  type?: IncidentType;

  @IsEnum(IncidentDegree)
  @IsOptional()
  degree?: IncidentDegree;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;
}
