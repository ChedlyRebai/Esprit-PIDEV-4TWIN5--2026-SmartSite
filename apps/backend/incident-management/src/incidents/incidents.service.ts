import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import {
  Incident,
  IncidentDocument,
  IncidentSeverity,
  IncidentStatus,
} from "./entities/incident.entity";

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) { }

  async findAll(): Promise<Incident[]> {
    return this.incidentModel.find().exec();
  }

  async findOne(id: string): Promise<Incident> {
    const inc = await this.incidentModel.findById(id).exec();
    if (!inc) {
      throw new NotFoundException("Incident not found");
    }
    return inc;
  }

  async create(dto: CreateIncidentDto): Promise<Incident> {
    const payload: Partial<Incident> = {
      type: dto.type,
      severity: dto.severity ?? IncidentSeverity.MEDIUM,
      title: dto.title,
      description: dto.description ?? undefined,
      reporterName: dto.reporterName,
      reporterPhone: dto.reporterPhone,
      imageUrl: (dto as any).imageUrl,
      assignedToCin: (dto as any).assignedToCin,
      assignedUserRole: (dto as any).assignedUserRole,
      status: dto.status as IncidentStatus || IncidentStatus.OPEN,
    };

    if (dto.siteId && Types.ObjectId.isValid(dto.siteId)) {
      (payload as any).site = new Types.ObjectId(dto.siteId);
    }

    // Gérer reportedBy - utiliser la chaîne directement si fournie
    if (dto.reportedBy && typeof dto.reportedBy === 'string') {
      (payload as any).reportedBy = dto.reportedBy;
      console.log('✅ reportedBy défini comme chaîne:', dto.reportedBy);
    }

    if (dto.assignedTo && Types.ObjectId.isValid(dto.assignedTo)) {
      (payload as any).assignedTo = new Types.ObjectId(dto.assignedTo);
    }

    const created = new this.incidentModel(payload);
    return created.save();
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const updatePayload: any = { ...dto };

    if (dto.siteId && Types.ObjectId.isValid(dto.siteId)) {
      updatePayload.site = new Types.ObjectId(dto.siteId);
      delete updatePayload.siteId;
    }
    if (dto.reportedBy && Types.ObjectId.isValid(dto.reportedBy)) {
      updatePayload.reportedBy = new Types.ObjectId(dto.reportedBy);
    }
    if (dto.assignedTo && Types.ObjectId.isValid(dto.assignedTo)) {
      updatePayload.assignedTo = new Types.ObjectId(dto.assignedTo);
    }

    const updated = await this.incidentModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Incident not found");
    }
    return updated;
  }

  async remove(id: string): Promise<{ removed: boolean }> {
    const res = await this.incidentModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Incident not found");
    }
    return { removed: true };
  }
}
