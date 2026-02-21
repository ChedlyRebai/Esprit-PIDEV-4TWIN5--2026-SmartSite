import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { Incident } from "./entities/incident.entity";
export declare class IncidentsService {
    private incidents;
    findAll(): Incident[];
    findOne(id: string): Incident;
    create(dto: CreateIncidentDto): Incident;
    update(id: string, dto: UpdateIncidentDto): Incident;
    remove(id: string): {
        removed: boolean;
    };
}
