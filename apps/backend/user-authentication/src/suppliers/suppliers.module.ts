import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierSchema } from './entities/supplier.entity';
import { SupplierEvaluationsController } from './supplier-evaluations.controller';
import { SupplierEvaluationsService } from './supplier-evaluations.service';
import { SupplierEvaluation, SupplierEvaluationSchema } from './entities/supplier-evaluation.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierEvaluation.name, schema: SupplierEvaluationSchema },
    ]),
  ],
  controllers: [SuppliersController, SupplierEvaluationsController],
  providers: [SuppliersService, SupplierEvaluationsService],
  exports: [SuppliersService, SupplierEvaluationsService],
})
export class SuppliersModule {}