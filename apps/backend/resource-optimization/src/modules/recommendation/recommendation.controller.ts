import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

// Using the interfaces from the service file
interface CreateRecommendationDto {
  type: string;
  title: string;
  description: string;
  priority: number;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  confidenceScore: number;
  actionItems: string[];
  siteId: string;
}

interface UpdateRecommendationStatusDto {
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) { }

  @Post('generate/:siteId')
  async generateRecommendations(@Param('siteId') siteId: string) {
    try {
      // Create mock recommendations for now
      const mockRecommendations = [
        {
          type: 'energy',
          title: 'Optimisation de la consommation énergétique',
          description: 'Réduire la consommation pendant les heures creuses',
          estimatedSavings: 1500,
          estimatedCO2Reduction: 200,
          priority: 8,
          confidenceScore: 85,
          actionItems: ['Installer des horloges intelligents', 'Optimiser les équipements'],
          siteId,
        },
        {
          type: 'equipment',
          title: 'Maintenance préventive des équipements',
          description: 'Planifier la maintenance avant les pannes',
          estimatedSavings: 800,
          estimatedCO2Reduction: 100,
          priority: 7,
          confidenceScore: 90,
          actionItems: ['Inspecter les équipements', 'Planifier la maintenance'],
          siteId,
        }
      ];

      // Save all generated recommendations
      const savedRecommendations = [];
      for (const rec of mockRecommendations) {
        const savedRec = await this.recommendationService.create(rec);
        savedRecommendations.push(savedRec);
      }

      return {
        message: 'Recommendations generated successfully',
        count: savedRecommendations.length,
        recommendations: savedRecommendations,
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  @Post()
  async createRecommendation(@Body() createRecommendationDto: CreateRecommendationDto) {
    return this.recommendationService.create(createRecommendationDto);
  }

  @Get()
  async getRecommendations(
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
  ) {
    return this.recommendationService.findAll(siteId, status);
  }

  /** Liste des recommandations pour un site (évite la confusion avec GET :id = id MongoDB) */
  @Get('site/:siteId')
  async getRecommendationsBySite(@Param('siteId') siteId: string) {
    return this.recommendationService.findAll(siteId);
  }

  @Get('site/:siteId/summary')
  async getRecommendationsSummary(@Param('siteId') siteId: string) {
    return this.recommendationService.getSummary(siteId);
  }

  @Get('site/:siteId/savings')
  async getSavingsSummary(@Param('siteId') siteId: string) {
    return this.recommendationService.getAnalytics(siteId);
  }

  @Get(':id')
  async getRecommendationById(@Param('id') id: string) {
    return this.recommendationService.findOne(id);
  }

  @Put(':id/status')
  async updateRecommendationStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRecommendationStatusDto,
  ) {
    if (updateStatusDto.status === 'approved') {
      return this.recommendationService.approveRecommendation(id);
    } else if (updateStatusDto.status === 'implemented') {
      return this.recommendationService.implementRecommendation(id);
    } else {
      return this.recommendationService.update(id, { status: updateStatusDto.status });
    }
  }

  @Get(':id/analytics')
  async getRecommendationAnalytics(@Param('id') id: string) {
    const recommendation = await this.recommendationService.findOne(id);
    if (!recommendation) {
      return { message: 'Recommendation not found' };
    }

    // Return analytics for this specific recommendation
    return {
      recommendation,
      beforeMetrics: recommendation.beforeMetrics,
      afterMetrics: recommendation.afterMetrics,
      improvement: recommendation.improvement,
    };
  }

  @Get('site/:siteId/analytics')
  async getSiteAnalytics(@Param('siteId') siteId: string) {
    return this.recommendationService.getAnalytics(siteId);
  }
}
