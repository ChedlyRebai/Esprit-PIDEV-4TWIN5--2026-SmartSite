import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { Alert, AlertSchema } from '@/schemas/alert.schema';
import { ResourceAnalysisModule } from '../resource-analysis/resource-analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
    ResourceAnalysisModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
