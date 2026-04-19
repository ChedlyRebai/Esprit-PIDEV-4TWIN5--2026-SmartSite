import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStage } from './entities/TaskStage.entities';

@Controller('task-stage')
export class TaskStageController {
  constructor(private readonly taskStageService: TaskStageService) {}

  @Get()
  async findAll() {
    return await this.taskStageService.findAll();
  }

  @Get('project/:projectId')
  async findByprojectId(@Param('projectId') projectId: string) {
    const taskStages = await this.taskStageService.findByProjectId(projectId);
    return taskStages;
  }



  @Post('milestone/:milestoneId')
  async create(
    @Param('milestoneId') milestoneId: string,
    @Body() taskStage: TaskStage,
  ) {
    return this.taskStageService.create(milestoneId, taskStage);
  }

  @Get('milestone/:milestoneId/team/:teamId')
  async findByMilestoneIdAndteamId(
    @Param('milestoneId') milestoneId: string,
    @Param('teamId') teamId: string,
  ) {
    const taskStages =
      await this.taskStageService.findByMilestoneIdAndteamId(
        milestoneId,
        teamId,
      );
    return taskStages;
  }

  @Get('milestone/:milestoneId')
  async findByMilestoneId(@Param('milestoneId') milestoneId: string) {
    const taskStages =
      await this.taskStageService.findByMilestoneId(milestoneId);
    return taskStages;
  }

  @Get('milestone/:milestoneId/gantt')
  async findGanttTasksByMilestoneId(@Param('milestoneId') milestoneId: string) {
    return this.taskStageService.findGanttTasksByMilestoneId(milestoneId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.taskStageService.findONe(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() taskStage: TaskStage) {
    return await this.taskStageService.update(id, taskStage);
  }

  @Delete(':id')
  async removeTaskSatge(@Param('id') id: string) {
    return await this.taskStageService.remove(id);
  }
}
