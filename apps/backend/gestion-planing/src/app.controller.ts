import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('projects/all')
  async getAllProjects() {
    return this.appService.getAllProjectsForSuperAdmin();
  }

  @Get('tasks/urgent')
  async getUrgentTasks() {
    return this.appService.getUrgentTasksForDashboard();
  }
}
