import { Milestone } from '@/milestone/entities/milestone.entity';
import { Task } from '@/task/entities/task.entity';
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

  async findAll() {
    return await this.taskStageModel.find().exec();
  }

  async create(taskStage: TaskStage) {
    return await this.taskStageModel.create(taskStage);
  }

  async update(id: string, taskStage: TaskStage) {
    return await this.taskStageModel
      .findByIdAndUpdate(id, taskStage, { new: true })
      .exec();
  }
}
