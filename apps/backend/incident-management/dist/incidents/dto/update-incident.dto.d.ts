import { IncidentType, IncidentDegree } from "../entities/incident.entity";
export declare class UpdateIncidentDto {
    type?: IncidentType;
    degree?: IncidentDegree;
    title?: string;
    description?: string;
    reportedBy?: string;
}
