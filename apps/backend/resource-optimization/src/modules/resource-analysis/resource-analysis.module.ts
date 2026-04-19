import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceAnalysisService } from './resource-analysis.service';
import { ResourceAnalysisController } from './resource-analysis.controller';
import { Equipment, EquipmentSchema } from '@/schemas/equipment.schema';
import { Worker, WorkerSchema } from '@/schemas/worker.schema';
import { EnergyConsumption, EnergyConsumptionSchema } from '@/schemas/energy-consumption.schema';
import { UsageData, UsageDataSchema } from '@/schemas/usage-data.schema';
import { ExternalDataModule } from '../external-data/external-data.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Worker.name, schema: WorkerSchema },
      { name: EnergyConsumption.name, schema: EnergyConsumptionSchema },
      { name: UsageData.name, schema: UsageDataSchema },
    ]),
    ExternalDataModule,
  ],
  controllers: [ResourceAnalysisController],
  providers: [ResourceAnalysisService],
  exports: [ResourceAnalysisService],
})
export class ResourceAnalysisModule {}
