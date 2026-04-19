import { Controller, Get, Param } from '@nestjs/common';
import { ResourceAnalysisService } from './resource-analysis.service';

@Controller('resource-analysis')
export class ResourceAnalysisController {
  constructor(
    private readonly resourceAnalysisService: ResourceAnalysisService,
  ) {}

  @Get('idle-equipment/:siteId')
  async detectIdleEquipment(@Param('siteId') siteId: string) {
    return this.resourceAnalysisService.detectIdleEquipment(siteId);
  }

  @Get('energy-consumption/:siteId')
  async analyzeEnergyConsumption(@Param('siteId') siteId: string) {
    return this.resourceAnalysisService.analyzeEnergyConsumption(siteId);
  }

  @Get('worker-productivity/:siteId')
  async analyzeWorkerProductivity(@Param('siteId') siteId: string) {
    return this.resourceAnalysisService.analyzeWorkerProductivity(siteId);
  }

  @Get('resource-costs/:siteId')
  async calculateResourceCosts(@Param('siteId') siteId: string) {
    return this.resourceAnalysisService.calculateResourceCosts(siteId);
  }

  @Get('full-analysis/:siteId')
  async analyzeResources(@Param('siteId') siteId: string) {
    return this.resourceAnalysisService.analyzeResources(siteId);
  }
}
