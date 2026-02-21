import { IncidentsService } from "./incidents.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
export declare class IncidentsController {
    private readonly incidentsService;
    constructor(incidentsService: IncidentsService);
    findAll(): import("./entities/incident.entity").Incident[];
    findOne(id: string): import("./entities/incident.entity").Incident;
    create(dto: CreateIncidentDto): import("./entities/incident.entity").Incident;
    update(id: string, dto: UpdateIncidentDto): import("./entities/incident.entity").Incident;
    remove(id: string): {
        removed: boolean;
    };
}
