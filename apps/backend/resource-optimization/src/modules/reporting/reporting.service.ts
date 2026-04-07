import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from '@/schemas/recommendation.schema';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';

export interface PerformanceReport {
  period: string;
  totalSavings: number;
  co2Reduction: number;
  implementedRecommendations: number;
  resourceUtilization: {
    equipment: number;
    workforce: number;
  };
  costBreakdown: any;
  environmentalMetrics: any;
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<Recommendation>,
    private resourceAnalysisService: ResourceAnalysisService,
  ) {}

  /**
   * Générer un rapport de performance
   */
  async generatePerformanceReport(siteId: string, days: number = 30): Promise<PerformanceReport> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get implemented recommendations in period
    const implementedRecs = await this.recommendationModel
      .find({
        siteId,
        status: 'implemented',
        implementedAt: { $gte: startDate },
      })
      .exec();

    const totalSavings = implementedRecs.reduce(
      (sum, r) => sum + (r.estimatedSavings || 0),
      0,
    );
    const totalCO2Reduction = implementedRecs.reduce(
      (sum, r) => sum + (r.estimatedCO2Reduction || 0),
      0,
    );

    // Get current resource analysis
    const analysis = await this.resourceAnalysisService.analyzeResources(siteId);

    return {
      period: `${days} jours`,
      totalSavings,
      co2Reduction: totalCO2Reduction,
      implementedRecommendations: implementedRecs.length,
      resourceUtilization: {
        equipment: this.calculateAverageUtilization(analysis.idleEquipment),
        workforce: this.calculateWorkforceEfficiency(analysis.workerProductivity),
      },
      costBreakdown: analysis.costBreakdown,
      environmentalMetrics: {
        totalCO2Emissions: analysis.environmentalImpact.totalCO2,
        totalWaste: analysis.environmentalImpact.totalWaste,
        reductionTargetMet: totalCO2Reduction > 0,
      },
    };
  }

  /**
   * Générer un rapport d'impact environnemental
   */
  async generateEnvironmentalReport(siteId: string) {
    const analysis = await this.resourceAnalysisService.analyzeResources(siteId);
    const recommendations = await this.recommendationModel
      .find({ siteId, type: 'environmental' })
      .exec();

    const implemented = recommendations.filter((r) => r.status === 'implemented');

    return {
      currentCO2Emissions: analysis.environmentalImpact.totalCO2.toFixed(0),
      wasteGenerated: analysis.environmentalImpact.totalWaste.toFixed(0),
      potentialCO2Reduction: recommendations
        .reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0)
        .toFixed(0),
      actualCO2Reduction: implemented
        .reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0)
        .toFixed(0),
      reductionPercentage: (
        (implemented.reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0) /
          analysis.environmentalImpact.totalCO2) *
        100
      ).toFixed(1),
      recommendations: recommendations.map((r) => ({
        id: r._id,
        title: r.title,
        status: r.status,
        co2Reduction: r.estimatedCO2Reduction,
      })),
    };
  }

  /**
   * Générer un rapport financier
   */
  async generateFinancialReport(siteId: string) {
    const analysis = await this.resourceAnalysisService.analyzeResources(siteId);
    const recommendations = await this.recommendationModel
      .find({ siteId })
      .exec();

    const approved = recommendations.filter((r) => r.status === 'approved');
    const implemented = recommendations.filter((r) => r.status === 'implemented');

    const potentialSavings = recommendations.reduce(
      (sum, r) => sum + (r.estimatedSavings || 0),
      0,
    );
    const approvedSavings = approved.reduce(
      (sum, r) => sum + (r.estimatedSavings || 0),
      0,
    );
    const realizedSavings = implemented.reduce(
      (sum, r) => sum + (r.estimatedSavings || 0),
      0,
    );

    const roi =
      analysis.costBreakdown.total > 0
        ? ((realizedSavings / analysis.costBreakdown.total) * 100).toFixed(1)
        : 0;

    return {
      currentResourcesCosts: analysis.costBreakdown.total.toFixed(2),
      breakdown: analysis.costBreakdown.breakdown,
      potentialSavings: potentialSavings.toFixed(2),
      approvedSavings: approvedSavings.toFixed(2),
      realizedSavings: realizedSavings.toFixed(2),
      roi: `${roi}%`,
      savingsByCategory: this.categorizeSavings(recommendations),
    };
  }

  /**
   * Générer un dashboard complet
   */
  async generateDashboard(siteId: string) {
    const performanceReport = await this.generatePerformanceReport(siteId);
    const environmentalReport = await this.generateEnvironmentalReport(siteId);
    const financialReport = await this.generateFinancialReport(siteId);
    const recommendations = await this.recommendationModel.find({ siteId }).exec();

    return {
      performance: performanceReport,
      environmental: environmentalReport,
      financial: financialReport,
      recommendations: {
        total: recommendations.length,
        pending: recommendations.filter((r) => r.status === 'pending').length,
        approved: recommendations.filter((r) => r.status === 'approved').length,
        implemented: recommendations.filter((r) => r.status === 'implemented').length,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Exporter les données pour génération PDF/Excel
   */
  async exportReportData(siteId: string, format: 'json' | 'csv' = 'json') {
    const dashboard = await this.generateDashboard(siteId);

    if (format === 'json') {
      return dashboard;
    }

    // CSV format
    const csvHeader = 'Metric,Value\n';
    const csvData = [
      `Savings (€),${dashboard.financial.realizedSavings}`,
      `CO2 Reduction (kg),${dashboard.environmental.actualCO2Reduction}`,
      `Recommendations Implemented,${dashboard.recommendations.implemented}`,
      `ROI (%),${dashboard.financial.roi}`,
    ].join('\n');

    return csvHeader + csvData;
  }

  // ========== HELPER METHODS ==========

  private calculateAverageUtilization(idleEquipment: any[]): number {
    if (idleEquipment.length === 0) return 100;
    const totalUtilization = idleEquipment.reduce(
      (sum, eq) => sum + eq.utilizationRate,
      0,
    );
    return (totalUtilization / idleEquipment.length) * 0.95; // Safe assumption
  }

  private calculateWorkforceEfficiency(workerProductivity: any[]): number {
    if (workerProductivity.length === 0) return 0;
    const totalEfficiency = workerProductivity.reduce(
      (sum, w) => sum + w.productivityScore,
      0,
    );
    return Math.round(totalEfficiency / workerProductivity.length);
  }

  private categorizeSavings(recommendations: any[]) {
    const categories = {
      energy: 0,
      equipment: 0,
      workforce: 0,
      scheduling: 0,
      environmental: 0,
    };

    for (const rec of recommendations) {
      if (rec.status === 'implemented') {
        categories[rec.type] = (categories[rec.type] || 0) + (rec.estimatedSavings || 0);
      }
    }

    return categories;
  }
}
