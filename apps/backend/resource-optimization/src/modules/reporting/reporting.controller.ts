import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('performance/:siteId')
  async generatePerformanceReport(
    @Param('siteId') siteId: string,
    @Query('days') days: number = 30,
  ) {
    return this.reportingService.generatePerformanceReport(siteId, days);
  }

  @Get('environmental/:siteId')
  async generateEnvironmentalReport(@Param('siteId') siteId: string) {
    return this.reportingService.generateEnvironmentalReport(siteId);
  }

  @Get('financial/:siteId')
  async generateFinancialReport(@Param('siteId') siteId: string) {
    return this.reportingService.generateFinancialReport(siteId);
  }

  @Get('dashboard/:siteId')
  async generateDashboard(@Param('siteId') siteId: string) {
    return this.reportingService.generateDashboard(siteId);
  }

  @Get('export/:siteId')
  async exportReportData(
    @Param('siteId') siteId: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    return this.reportingService.exportReportData(siteId, format);
  }
}
