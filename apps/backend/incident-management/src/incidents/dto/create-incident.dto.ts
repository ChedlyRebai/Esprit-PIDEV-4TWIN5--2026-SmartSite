import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IncidentType, IncidentDegree } from "../entities/incident.entity";

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentDegree)
  degree: IncidentDegree;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;
}
