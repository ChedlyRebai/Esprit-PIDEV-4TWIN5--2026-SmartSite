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
  siteId?: string;
  projectId?: string;
  scope?: 'project' | 'site';
}

interface UpdateRecommendationStatusDto {
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) { }

  @Post('generate/:siteId')
  async generateRecommendations(@Param('siteId') siteId: string, @Query('projectId') projectId?: string) {
    try {
      const savedRecommendations = projectId
        ? await this.recommendationService.generateForProject(projectId, siteId)
        : await this.recommendationService.generateForSite(siteId);

      return {
        message: 'Recommendations generated successfully',
        count: savedRecommendations.length,
        recommendations: savedRecommendations,
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  @Post('generate')
  async generateByProject(@Body() body: { projectId: string; siteId?: string }) {
    if (!body?.projectId) {
      throw new Error('projectId is required');
    }

    const savedRecommendations = await this.recommendationService.generateForProject(
      body.projectId,
      body.siteId,
    );

    return {
      message: 'Recommendations generated successfully',
      count: savedRecommendations.length,
      recommendations: savedRecommendations,
    };
  }

  @Post('generate/project/:projectId')
  async generateProjectOnly(@Param('projectId') projectId: string) {
    const savedRecommendations = await this.recommendationService.generateForProject(projectId);

    return {
      message: 'Project recommendations generated successfully',
      count: savedRecommendations.length,
      recommendations: savedRecommendations,
    };
  }

  @Post()
  async createRecommendation(@Body() createRecommendationDto: CreateRecommendationDto) {
    return this.recommendationService.create(createRecommendationDto);
  }

  @Get()
  async getRecommendations(
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('scope') scope?: string,
  ) {
    return this.recommendationService.findAll(siteId, status, projectId, scope);
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

  @Get('project/:projectId')
  async getRecommendationsByProject(@Param('projectId') projectId: string) {
    return this.recommendationService.findAll(undefined, undefined, projectId, 'project');
  }

  @Get('project/:projectId/summary')
  async getProjectSummary(@Param('projectId') projectId: string) {
    return this.recommendationService.getSummary(undefined, projectId, 'project');
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

  @Get('project/:projectId/analytics')
  async getProjectAnalytics(@Param('projectId') projectId: string) {
    return this.recommendationService.getAnalytics(undefined, projectId, 'project');
  }
}
