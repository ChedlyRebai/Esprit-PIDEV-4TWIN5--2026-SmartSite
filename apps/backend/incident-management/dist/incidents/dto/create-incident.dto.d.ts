import { IncidentType, IncidentDegree } from "../entities/incident.entity";
export declare class CreateIncidentDto {
    type: IncidentType;
    degree: IncidentDegree;
    title: string;
    description?: string;
    reportedBy?: string;
}
