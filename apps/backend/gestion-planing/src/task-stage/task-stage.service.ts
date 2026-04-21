import { Milestone } from '../milestone/entities/milestone.entity';
import { Task } from '../task/entities/task.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskStage } from './entities/TaskStage.entities';

@Injectable()
export class TaskStageService {
  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskStage.name) private taskStageModel: Model<TaskStage>,
  ) {}

  async findONe(id: string) {
    return await this.taskStageModel.findById(id).exec();
  }

  async findByProjectId(projectId: string) {
    return await this.taskStageModel.find({ projectId }).exec();
  }

  async findByMilestoneId(milestoneId: string) {
    return await this.taskStageModel
      .find({ milestoneId }).sort({order:1})
      .select('_id name order color')
      .populate('tasks')
      .exec()
  }

  async findGanttTasksByMilestoneId(milestoneId: string) {
    const milestone = await this.milestoneModel
      .findById(milestoneId)
      .select('_id title startDate endDate')
      .lean()
      .exec();

    if (!milestone) {
      return [];
    }

    const stages = await this.taskStageModel
      .find({ milestoneId })
      .sort({ order: 1 })
      .populate({
        path: 'tasks',
        select: 'title startDate endDate progress',
      })
      .lean()
      .exec();

    const stageTasks = stages.flatMap((stage: any) =>
      Array.isArray(stage.tasks) ? stage.tasks : [],
    );

    const milestoneStart = this.asDate(milestone.startDate) ?? new Date();
    const milestoneEnd =
      this.asDate(milestone.endDate) ?? this.findMaxEndDate(stageTasks) ?? milestoneStart;

    const tasks = [
      {
        id: 1,
        text: milestone.title || 'Milestone',
        start: milestoneStart,
        end: milestoneEnd,
        progress: this.getSummaryProgress(stageTasks),
        type: 'summary',
        open: true,
      },
      ...stageTasks
        .sort((a: any, b: any) => {
          const aDate = this.asDate(a?.startDate)?.getTime() ?? 0;
          const bDate = this.asDate(b?.startDate)?.getTime() ?? 0;
          return aDate - bDate;
        })
        .map((task: any, index: number) => ({
          id: index + 2,
          text: task?.title || `Task ${index + 1}`,
          start: this.asDate(task?.startDate) ?? milestoneStart,
          end: this.asDate(task?.endDate) ?? milestoneEnd,
          progress: Number(task?.progress ?? 0),
          parent: 1,
        })),
    ];

    return tasks;
  }

  private asDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private findMaxEndDate(tasks: any[]): Date | null {
    const endDates = tasks
      .map((task) => this.asDate(task?.endDate))
      .filter((date): date is Date => Boolean(date));

    if (!endDates.length) {
      return null;
    }

    return endDates.reduce((max, current) =>
      current.getTime() > max.getTime() ? current : max,
    );
  }

  private getSummaryProgress(tasks: any[]): number {
    if (!tasks.length) {
      return 0;
    }

    const total = tasks.reduce(
      (sum, task) => sum + Number(task?.progress ?? 0),
      0,
    );

    return Math.round(total / tasks.length);
  }


  async findByMilestoneIdAndteamId(milestoneId: string,teamId:string) {
    return await this.taskStageModel
      .find({ milestoneId })
      .select('_id name order color')
      .populate({
        path: 'tasks',
        match: { assignedTeams: teamId },
      })
      .exec(); 
  }
  
  

  

  async findAll() {
    return await this.taskStageModel.find().exec();
  }

  async create(milestoneId: string, taskStage: TaskStage) {
    return await this.taskStageModel.create({ ...taskStage, milestoneId });
  }

  async update(id: string, taskStage: TaskStage) {
    return await this.taskStageModel
      .findByIdAndUpdate(id, taskStage, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.taskStageModel.findByIdAndDelete(id).exec();
  }
}
