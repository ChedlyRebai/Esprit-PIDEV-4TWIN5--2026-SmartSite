import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { Incident } from "./entities/incident.entity";

@Injectable()
export class IncidentsService {
  private incidents: Incident[] = [];

  findAll(): Incident[] {
    return this.incidents;
  }

  findOne(id: string): Incident {
    const inc = this.incidents.find((i) => i.id === id);
    if (!inc) throw new NotFoundException("Incident not found");
    return inc;
  }

  create(dto: CreateIncidentDto): Incident {
    const incident: Incident = {
      id: (Date.now() + Math.random()).toString(36),
      type: dto.type,
      degree: dto.degree,
      title: dto.title,
      description: dto.description ?? null,
      reportedAt: new Date().toISOString(),
      reportedBy: dto.reportedBy ?? null,
    };
    this.incidents.push(incident);
    return incident;
  }

  update(id: string, dto: UpdateIncidentDto): Incident {
    const inc = this.findOne(id);
    Object.assign(inc, dto);
    return inc;
  }

  remove(id: string): { removed: boolean } {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new NotFoundException("Incident not found");
    this.incidents.splice(idx, 1);
    return { removed: true };
  }
}
