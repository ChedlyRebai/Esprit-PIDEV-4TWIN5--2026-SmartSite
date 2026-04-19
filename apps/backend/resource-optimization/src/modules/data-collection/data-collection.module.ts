import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataCollectionService } from './data-collection.service';
import { DataCollectionController } from './data-collection.controller';
import { Equipment, EquipmentSchema } from '@/schemas/equipment.schema';
import { Worker, WorkerSchema } from '@/schemas/worker.schema';
import { EnergyConsumption, EnergyConsumptionSchema } from '@/schemas/energy-consumption.schema';
import { UsageData, UsageDataSchema } from '@/schemas/usage-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Worker.name, schema: WorkerSchema },
      { name: EnergyConsumption.name, schema: EnergyConsumptionSchema },
      { name: UsageData.name, schema: UsageDataSchema },
    ]),
  ],
  controllers: [DataCollectionController],
  providers: [DataCollectionService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}
