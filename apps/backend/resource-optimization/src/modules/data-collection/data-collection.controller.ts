import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DataCollectionService } from './data-collection.service';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from '@/dto/equipment.dto';
import { CreateWorkerDto, UpdateWorkerDto } from '@/dto/worker.dto';
import { CreateEnergyConsumptionDto } from '@/dto/energy-consumption.dto';

@Controller('data-collection')
export class DataCollectionController {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  // === EQUIPMENT ENDPOINTS ===

  @Post('equipment')
  async createEquipment(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.dataCollectionService.createEquipment(createEquipmentDto);
  }

  @Get('equipment/:siteId')
  async getAllEquipment(@Param('siteId') siteId: string) {
    return this.dataCollectionService.getAllEquipment(siteId);
  }

  @Get('equipment/item/:id')
  async getEquipmentById(@Param('id') id: string) {
    return this.dataCollectionService.getEquipmentById(id);
  }

  @Put('equipment/:id')
  async updateEquipment(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.dataCollectionService.updateEquipment(id, updateEquipmentDto);
  }

  @Delete('equipment/:id')
  async deleteEquipment(@Param('id') id: string) {
    return this.dataCollectionService.deleteEquipment(id);
  }

  // === WORKER ENDPOINTS ===

  @Post('worker')
  async createWorker(@Body() createWorkerDto: CreateWorkerDto) {
    return this.dataCollectionService.createWorker(createWorkerDto);
  }

  @Get('worker/:siteId')
  async getAllWorkers(@Param('siteId') siteId: string) {
    return this.dataCollectionService.getAllWorkers(siteId);
  }

  @Get('worker/item/:id')
  async getWorkerById(@Param('id') id: string) {
    return this.dataCollectionService.getWorkerById(id);
  }

  @Put('worker/:id')
  async updateWorker(
    @Param('id') id: string,
    @Body() updateWorkerDto: UpdateWorkerDto,
  ) {
    return this.dataCollectionService.updateWorker(id, updateWorkerDto);
  }

  @Delete('worker/:id')
  async deleteWorker(@Param('id') id: string) {
    return this.dataCollectionService.deleteWorker(id);
  }

  // === ENERGY CONSUMPTION ENDPOINTS ===

  @Post('energy-consumption')
  async recordEnergyConsumption(
    @Body() createEnergyConsumptionDto: CreateEnergyConsumptionDto,
  ) {
    return this.dataCollectionService.recordEnergyConsumption(
      createEnergyConsumptionDto,
    );
  }

  @Get('energy-consumption/:siteId')
  async getEnergyConsumption(
    @Param('siteId') siteId: string,
    @Body('days') days: number = 30,
  ) {
    return this.dataCollectionService.getEnergyConsumption(siteId, days);
  }
}
