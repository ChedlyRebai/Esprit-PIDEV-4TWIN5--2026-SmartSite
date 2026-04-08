import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ExternalDataService, ExternalDataResponse } from './external-data.service';

@Controller('external-data')
export class ExternalDataController {
  private readonly logger = new Logger(ExternalDataController.name);

  constructor(private readonly externalDataService: ExternalDataService) {}

  @Get('site/:siteId')
  async getSiteData(@Param('siteId') siteId: string) {
    this.logger.log(`Fetching external data for site: ${siteId}`);
    return this.externalDataService.getSiteData(siteId);
  }

  @Get('teams/:siteId')
  async getSiteTeams(@Param('siteId') siteId: string) {
    return this.externalDataService.getSiteTeams(siteId);
  }

  @Get('tasks/:siteId')
  async getSiteTasks(@Param('siteId') siteId: string) {
    return this.externalDataService.getSiteTasks(siteId);
  }

  @Get('milestones/:siteId')
  async getSiteMilestones(@Param('siteId') siteId: string) {
    return this.externalDataService.getSiteMilestones(siteId);
  }

  @Get('all/:siteId')
  async getAllData(@Param('siteId') siteId: string): Promise<ExternalDataResponse> {
    return this.externalDataService.getAllSiteData(siteId);
  }

  @Get('users')
  async getUsers() {
    return this.externalDataService.getUsers();
  }
}
