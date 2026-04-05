import { Module } from '@nestjs/common';
import { AIRecommendationService } from './ai-recommendation.service';

@Module({
  providers: [AIRecommendationService],
  exports: [AIRecommendationService],
})
export class AIModule { }
