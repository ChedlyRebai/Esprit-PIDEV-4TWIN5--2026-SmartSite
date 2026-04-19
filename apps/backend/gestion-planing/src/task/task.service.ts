import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '@/task/entities/task.entity';
import { Milestone } from '@/milestone/entities/milestone.entity';
import { TaskStage } from '@/task-stage/entities/TaskStage.entities';
import { Console, log } from 'console';
@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<Milestone>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskStage.name) private taskSTageModel: Model<TaskStage>,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    milestoneId: string,
    taskStageId: string,
  ) {
    const response = await this.milestoneModel.findById(milestoneId).exec();
    if (!response) {
      throw new Error(`Milestone with id ${milestoneId} not found`);
    }

    const newTask = await this.taskModel.create({
      ...createTaskDto,
      milestoneId,
    });

    await this.taskSTageModel
      .findByIdAndUpdate(taskStageId, {
        $push: { tasks: newTask._id },
      })
      .exec();

    response.tasks.push(newTask._id);
    await response.save();
    return newTask;
  }

  async prevcreate(createTaskDto: CreateTaskDto, milestoneId: string) {
    const response = await this.milestoneModel.findById(milestoneId).exec();
    if (!response) {
      throw new Error(`Milestone with id ${milestoneId} not found`);
    }

    const newTask = await this.taskModel.create({
      ...createTaskDto,
      milestoneId,
    });

    await this.taskSTageModel
      .findByIdAndUpdate('69c0561d9fc8a9ce45f45bee', {
        $push: { tasks: newTask._id },
      })
      .exec();

    response.tasks.push(newTask._id);
    await response.save();
    return newTask;
  }

  async findAll() {
    try {
      const response = await this.taskModel.find().exec();
      return response;
    } catch (error) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  /**
   * Tâches à afficher comme « urgentes » (priorité élevée ou échéance dépassée / proche).
   */
  async findUrgentForDashboard() {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);

    const tasks = await this.taskModel
      .find({
        $or: [
          {
            priority: {
              $in: ['urgent', 'high', 'Urgent', 'High', 'URGENT', 'HIGH'],
            },
          },
          { endDate: { $lte: soon } },
        ],
      })
      .populate('status')
      .sort({ endDate: 1 })
      .limit(80)
      .lean()
      .exec();

    return tasks;
  }

  async findOne(id: string) {
    try {
      const response = await this.taskModel.findById(id).exec();
      return response;
    } catch (error) {
      throw new Error(`Error fetching task: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les tâches d'un projet pour le Gantt
   * Retourne les tâches avec leurs dates, progression et statut
   */
  async getTasksForGantt(projectId: string) {
    try {
      const tasks = await this.taskModel
        .find({ projectId })
        .populate('status')
        .populate('milestoneId')
        .lean()
        .exec();

      // Transformer les données pour le Gantt
      return tasks.map((task) => ({
        id: task._id,
        text: task.title,
        start: task.startDate || new Date(),
        end: task.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Par défaut 7 jours
        progress: task.progress || 0,
        parent: task.parent || 0, // 0 = pas de parent (tâche principale)
        open: true,
        type: task.type === 'summary' ? 'summary' : 'task',
        priority: task.priority,
        assignedUsers: task.assignedUsers,
        description: task.description,
        milestoneId: task.milestoneId,
        status: task.status,
      }));
    } catch (error) {
      throw new Error(`Error fetching tasks for Gantt: ${error.message}`);
    }
  }

  /**
   * Met à jour les dates d'une tâche (pour drag & drop dans le Gantt)
   */
  async updateTaskDates(taskId: string, startDate: Date, endDate: Date) {
    try {
      const response = await this.taskModel
        .findByIdAndUpdate(taskId, { startDate, endDate }, { new: true })
        .exec();

      if (!response) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      return response;
    } catch (error) {
      throw new Error(`Error updating task dates: ${error.message}`);
    }
  }
  async updateNew(taskId: string, taskStageId: string) {
    //const response= await this.taskModel.findByIdAndUpdate(taskId, {task})
    console.log(`Updating task ${taskId} to new stage ${taskStageId}`);
    const task = await this.taskModel.findByIdAndUpdate(taskId, {
      status: taskStageId,
    });
    const oldTaskSTage = await this.taskSTageModel.findByIdAndUpdate(
      task?.status,
      {
        $pull: {
          tasks: task?._id,
        },
      },
    );
    console.log(`Old task stage after pull: ${oldTaskSTage}`);

    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const res = await this.taskSTageModel.findByIdAndUpdate(taskStageId, {
      $push: { tasks: task._id },
    });
    console.log(res);
    return res;
  }
  async update(id: string, updateTaskDto: UpdateTaskDto) {
    try {
      const response = await this.taskModel
        .findByIdAndUpdate(id, updateTaskDto, { new: true })
        .exec();
      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error: any) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      //const taskSTage= await this.taskSTageModel.findByIdAndUpdate()
      const response = await this.taskModel.findByIdAndDelete(id).exec();
      const taskSTage = await this.taskSTageModel.findByIdAndUpdate(
        response?.status,
        {
          $pull: {
            tasks: response?._id,
          },
        },
      );

      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error: any) {
      throw new Error(`Error removing task: ${error.message}`);
    }
  }

  async getMyTask(userId: string) {
    if (!userId) {
      return [];
    }

    return await this.taskModel
      .find({
        $or: [{ assignedUsers: userId }, { assignedUsers: { $in: [userId] } }],
      })
      .exec();
  }

  async getMyTasks(userId: string) {
    try {
      const response = await this.taskModel
        .aggregate([
          {
            $match: {
              $or: [
                { assignedUsers: userId },
                { assignedUsers: { $in: [userId] } },
              ],
            },
          },
          {
            $group: {
              _id: '$status',
              tasks: { $push: '$$ROOT' },
            },
          },

          {
            $project: {
              title: '$_id',
              tasks: 1,
              _id: 0,
            },
          },
          //where: { userId: { $in: [userId] } },
        ])
        .exec();
      const columns = response.map((group, i) => ({
        id: `${group.title}`, // or use uuid/v4 for random unique id
        title: group.title,
        color: getColorForStatus(group.status),
        tasks: group.tasks,
      }));

      return columns;
    } catch (error: any) {
      throw new Error(`Error fetching tasks by milestone id: ${error.message}`);
    }
  }

  async getTasksBYMilestoneId(milestoneId: string) {
    try {
      const response = await this.taskModel
        .aggregate([
          { $match: { milestoneId } },
          {
            $group: {
              _id: '$status',
              tasks: { $push: '$$ROOT' },
            },
          },

          {
            $project: {
              title: '$_id',
              tasks: 1,
              _id: 0,
            },
          },
        ])
        .exec();
      const columns = response.map((group, i) => ({
        id: `${group.title}`, // or use uuid/v4 for random unique id
        title: group.title,
        color: getColorForStatus(group.status),
        tasks: group.tasks,
      }));

      return columns;
    } catch (error: any) {
      throw new Error(`Error fetching tasks by milestone id: ${error.message}`);
    }
  }
}
function getColorForStatus(status: string) {
  return 'primary';
}
