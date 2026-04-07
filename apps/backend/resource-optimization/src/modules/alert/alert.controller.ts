import { Controller, Get, Post, Put, Param } from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post('generate/:siteId')
  async generateAlerts(@Param('siteId') siteId: string) {
    return this.alertService.generateAlerts(siteId);
  }

  @Get('unread/:siteId')
  async getUnreadAlerts(@Param('siteId') siteId: string) {
    return this.alertService.getUnreadAlerts(siteId);
  }

  @Get('critical/:siteId')
  async getCriticalAlerts(@Param('siteId') siteId: string) {
    return this.alertService.getCriticalAlerts(siteId);
  }

  @Get(':siteId')
  async getAllAlerts(@Param('siteId') siteId: string) {
    return this.alertService.getAllAlerts(siteId);
  }

  @Get(':siteId/summary')
  async getAlertsSummary(@Param('siteId') siteId: string) {
    return this.alertService.getAlertsSummary(siteId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.alertService.markAsRead(id);
  }

  @Put(':id/resolve')
  async markAsResolved(@Param('id') id: string) {
    return this.alertService.markAsResolved(id);
  }

  @Post(':siteId/cleanup')
  async cleanupResolvedAlerts(@Param('siteId') siteId: string) {
    return this.alertService.cleanupResolvedAlerts(siteId);
  }
}
