import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equipment } from '@/schemas/equipment.schema';
import { Worker } from '@/schemas/worker.schema';
import { EnergyConsumption } from '@/schemas/energy-consumption.schema';
import { UsageData } from '@/schemas/usage-data.schema';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from '@/dto/equipment.dto';
import { CreateWorkerDto, UpdateWorkerDto } from '@/dto/worker.dto';
import { CreateEnergyConsumptionDto } from '@/dto/energy-consumption.dto';

@Injectable()
export class DataCollectionService {
  constructor(
    @InjectModel(Equipment.name) private equipmentModel: Model<Equipment>,
    @InjectModel(Worker.name) private workerModel: Model<Worker>,
    @InjectModel(EnergyConsumption.name)
    private energyConsumptionModel: Model<EnergyConsumption>,
    @InjectModel(UsageData.name) private usageDataModel: Model<UsageData>,
  ) {}

  // === EQUIPMENT MANAGEMENT ===

  async createEquipment(createEquipmentDto: CreateEquipmentDto) {
    const equipment = new this.equipmentModel(createEquipmentDto);
    return equipment.save();
  }

  async getAllEquipment(siteId: string) {
    return this.equipmentModel.find({ siteId }).exec();
  }

  async getEquipmentById(id: string) {
    return this.equipmentModel.findById(id).exec();
  }

  async updateEquipment(id: string, updateEquipmentDto: UpdateEquipmentDto) {
    return this.equipmentModel
      .findByIdAndUpdate(id, updateEquipmentDto, { new: true })
      .exec();
  }

  async deleteEquipment(id: string) {
    return this.equipmentModel.findByIdAndDelete(id).exec();
  }

  // === WORKER MANAGEMENT ===

  async createWorker(createWorkerDto: CreateWorkerDto) {
    const worker = new this.workerModel(createWorkerDto);
    return worker.save();
  }

  async getAllWorkers(siteId: string) {
    return this.workerModel.find({ siteId }).exec();
  }

  async getWorkerById(id: string) {
    return this.workerModel.findById(id).exec();
  }

  async updateWorker(id: string, updateWorkerDto: UpdateWorkerDto) {
    return this.workerModel
      .findByIdAndUpdate(id, updateWorkerDto, { new: true })
      .exec();
  }

  async deleteWorker(id: string) {
    return this.workerModel.findByIdAndDelete(id).exec();
  }

  // === ENERGY CONSUMPTION ===

  async recordEnergyConsumption(
    createEnergyConsumptionDto: CreateEnergyConsumptionDto,
  ) {
    const energyData = new this.energyConsumptionModel(
      createEnergyConsumptionDto,
    );

    // Calculate carbon emissions (rough estimation)
    const carbonFactor = 0.233; // kg CO2 per kWh (average)
    const estimatedCO2 = (createEnergyConsumptionDto.electricity || 0) * carbonFactor +
      (createEnergyConsumptionDto.fuelConsumption || 0) * 2.31; // 2.31 kg CO2 per litre

    energyData.carbonEmissions = estimatedCO2;

    return energyData.save();
  }

  async getEnergyConsumption(siteId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.energyConsumptionModel
      .find({
        siteId,
        dateLogged: { $gte: startDate },
      })
      .exec();
  }

  // === USAGE DATA ===

  async recordUsageData(resourceId: string, startTime: Date, endTime: Date, siteId: string) {
    const utilizationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const usageData = new this.usageDataModel({
      siteId,
      resourceId,
      resourceType: 'equipment', // Can be parameterized
      startTime,
      endTime,
      utilizationHours,
      idleHours: 0,
      costIncurred: 0,
      carbonFootprint: 0,
    });

    return usageData.save();
  }

  async getUsageData(siteId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.usageDataModel
      .find({
        siteId,
        startTime: { $gte: startDate },
      })
      .exec();
  }
}
