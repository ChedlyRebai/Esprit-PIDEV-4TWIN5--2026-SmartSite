import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Milestone, MilestoneSchema } from '../milestone/entities/milestone.entity';
import { Task, TaskSchema } from './entities/task.entity';
import { TaskStage, TaskStageSchema } from '../task-stage/entities/TaskStage.entities';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: Milestone.name, schema: MilestoneSchema },
        { name: Task.name, schema: TaskSchema },
        { name: TaskStage.name, schema: TaskStageSchema },
      ]),
      ClientsModule.register([
        {
          name: 'NOTIFICATION_SERVICE',
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: process.env.KAFKA_CLIENT_ID ?? 'gestion-planing',
              brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
                .split(',')
                .map((broker) => broker.trim())
                .filter(Boolean),
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        },
      ]),
    ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
