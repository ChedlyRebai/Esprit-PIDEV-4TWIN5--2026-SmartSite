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

  async findOne(id: number) {
    try {
      const response = await this.taskModel.findById(id).exec();
      return response;
    } catch (error) {
      throw new Error(`Error fetching task: ${error.message}`);
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
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    try {
      const response = await this.taskModel
        .findByIdAndUpdate(id, updateTaskDto, { new: true })
        .exec();
      if (!response) {
        throw new Error(`Task with id ${id} not found`);
      }
      return response;
    } catch (error) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  async remove(id: number) {
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
    } catch (error) {
      throw new Error(`Error removing task: ${error.message}`);
    }
  }

  async getMyTask(userId: string) {
    if (!userId) {
      return [];
    }

    return await this.taskModel
      .find({
        $or: [{ assignedTeams: userId }, { assignedTeams: { $in: [userId] } }],
      })
      .exec();
  }

  async getMyTasks(userId: string) {
    try {
      if (!userId) {
        return [];
      }

      // 1) Fetch all tasks assigned to the current user
      const tasks = await this.taskModel
        .find({
          $or: [
            { assignedTeams: userId },
            { assignedTeams: { $in: [userId] } },
          ],
        })
        .lean()
        .exec();

      if (!tasks.length) {
        return [];
      }

      // 2) Collect distinct status (TaskStage) ids from these tasks
      const statusIds = Array.from(
        new Set(
          tasks
            .map((task: any) => task.status)
            .filter((id) => !!id)
            .map((id) => id.toString()),
        ),
      );

      // 3) Load the corresponding TaskStages to get their name & color
      const stages = await this.taskSTageModel
        .find({ _id: { $in: statusIds } })
        .lean()
        .exec();

      const stageMap = new Map(
        stages.map((stage: any) => [stage._id.toString(), stage]),
      );

      // 4) Group tasks by status into columns
      const columnsMap = new Map<
        string,
        { id: string; title: string; color: string; tasks: any[] }
      >();

      tasks.forEach((task: any) => {
        const statusId = task.status ? task.status.toString() : 'no-status';

        if (!columnsMap.has(statusId)) {
          const stage = stageMap.get(statusId);
          columnsMap.set(statusId, {
            id: statusId,
            title: stage?.name || 'No status',
            color: stage?.color || getColorForStatus(statusId),
            tasks: [],
          });
        }

        columnsMap.get(statusId)!.tasks.push(task);
      });

      return Array.from(columnsMap.values());
    } catch (error: any) {
      throw new Error(`Error fetching tasks for user: ${error.message}`);
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
