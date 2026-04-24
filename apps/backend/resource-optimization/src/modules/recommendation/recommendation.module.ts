import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Recommendation, RecommendationSchema } from '../../schemas/recommendation.schema';
import { ExternalDataModule } from '../external-data/external-data.module';
import { AIModule } from '../../ai/ai.module';
import { ResourceAnalysisModule } from '../resource-analysis/resource-analysis.module';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
    ExternalDataModule,
    AIModule,
    ResourceAnalysisModule,
    AlertModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule { }
