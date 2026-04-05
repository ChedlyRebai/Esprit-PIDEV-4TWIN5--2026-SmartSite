import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { Recommendation, RecommendationSchema } from '@/schemas/recommendation.schema';
import { ResourceAnalysisModule } from '../resource-analysis/resource-analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
    ResourceAnalysisModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
