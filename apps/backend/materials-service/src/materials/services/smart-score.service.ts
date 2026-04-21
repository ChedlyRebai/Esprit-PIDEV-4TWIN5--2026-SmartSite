import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';

export interface SiteHealthScoreResult {
  siteId: string;
  siteName: string;
  progress: number;
  stockHealth: number;
  anomalies: number;
  score: number;
  level: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  details: {
    totalMaterials: number;
    lowStockCount: number;
    outOfStockCount: number;
    anomalyCount: number;
    averageConsumptionRate: number;
    criticalMaterials: Array<{
      id: string;
      name: string;
      code: string;
      quantity: number;
      reorderPoint: number;
    }>;
  };
  recommendations: string[];
}

@Injectable()
export class SmartScoreService {
  private readonly logger = new Logger(SmartScoreService.name);

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  /**
   * Calcule le Smart Score pour un chantier selon la formule:
   * SiteHealthScore = (progress % * 0.4) + (stock health * 0.3) + (anomalies * 0.3)
   */
  async calculateSiteHealthScore(
    siteId: string,
    siteName: string,
    progress: number,
  ): Promise<SiteHealthScoreResult> {
    try {
      this.logger.log(`📊 Calcul du Smart Score pour chantier ${siteId}`);

      // Récupérer tous les matériaux du chantier
      const materials = await this.materialModel.find({
        $or: [
          { siteId: new Types.ObjectId(siteId) },
          { assignedSites: new Types.ObjectId(siteId) }
        ]
      }).exec();

      if (materials.length === 0) {
        return this.getDefaultScore(siteId, siteName, progress, 'Aucun matériau trouvé');
      }

      const totalMaterials = materials.length;
      const lowStockMaterials = materials.filter(m => 
        m.quantity > 0 && m.quantity <= m.reorderPoint
      );
      const outOfStockMaterials = materials.filter(m => m.quantity === 0);
      const healthyMaterials = materials.filter(m => 
        m.quantity > m.reorderPoint && m.quantity > 0
      );

      // Stock Health (0-100)
      const stockHealth = (healthyMaterials.length / totalMaterials) * 100;

      // Calcul des Anomalies
      let anomalyWeight = 0;
      const maxAnomalyWeight = totalMaterials * 3;

      for (const material of materials) {
        if (material.quantity === 0) {
          anomalyWeight += 3;
        } else if (material.quantity <= material.reorderPoint) {
          anomalyWeight += 2;
        }
        
        if (material.expiryDate) {
          const daysToExpiry = Math.ceil(
            (material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            anomalyWeight += 1;
          }
        }
      }

      const anomalies = maxAnomalyWeight > 0 
        ? Math.max(0, 100 - (anomalyWeight / maxAnomalyWeight) * 100)
        : 100;

      // Score final selon formule
      const progressWeighted = Math.min(100, Math.max(0, progress)) * 0.4;
      const stockHealthWeighted = stockHealth * 0.3;
      const anomaliesWeighted = anomalies * 0.3;
      const finalScore = progressWeighted + stockHealthWeighted + anomaliesWeighted;

      // Niveau
      let level: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
      if (finalScore >= 80) level = 'excellent';
      else if (finalScore >= 60) level = 'good';
      else if (finalScore >= 40) level = 'average';
      else if (finalScore >= 20) level = 'poor';
      else level = 'critical';

      const recommendations = this.generateRecommendations(
        finalScore,
        lowStockMaterials.length,
        outOfStockMaterials.length,
        anomalyWeight
      );

      // Mettre à jour les scores
      await this.updateMaterialScores(siteId, materials, stockHealth, anomalies, finalScore);

      const result: SiteHealthScoreResult = {
        siteId,
        siteName,
        progress: Math.min(100, Math.max(0, progress)),
        stockHealth: Math.round(stockHealth * 100) / 100,
        anomalies: Math.round(anomalies * 100) / 100,
        score: Math.round(finalScore * 100) / 100,
        level,
        details: {
          totalMaterials,
          lowStockCount: lowStockMaterials.length,
          outOfStockCount: outOfStockMaterials.length,
          anomalyCount: anomalyWeight,
          averageConsumptionRate: this.calculateAverageConsumptionRate(materials),
          criticalMaterials: [...outOfStockMaterials, ...lowStockMaterials.slice(0, 5)].map(m => ({
            id: m._id.toString(),
            name: m.name,
            code: m.code,
            quantity: m.quantity,
            reorderPoint: m.reorderPoint,
          })),
        },
        recommendations,
      };

      this.logger.log(`✅ Smart Score pour ${siteName}: ${result.score} (${level})`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur Smart Score: ${error.message}`);
      return this.getDefaultScore(siteId, siteName, progress, error.message);
    }
  }

  private async updateMaterialScores(
    siteId: string,
    materials: Material[],
    stockHealth: number,
    anomalies: number,
    siteHealthScore: number
  ): Promise<void> {
    for (const material of materials) {
      let consumptionScore = 50;
      if (material.consumptionRate > 0) {
        consumptionScore = Math.max(0, 100 - (material.consumptionRate * 2));
      }

      material.consumptionScore = Math.round(consumptionScore);
      material.stockHealthScore = Math.round(stockHealth);
      material.anomaliesScore = Math.round(anomalies);
      material.siteHealthScore = Math.round(siteHealthScore);
      material.lastScoreUpdate = new Date();
      await material.save();
    }
  }

  private calculateAverageConsumptionRate(materials: Material[]): number {
    const rates = materials.filter(m => m.consumptionRate > 0).map(m => m.consumptionRate);
    if (rates.length === 0) return 0;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  private generateRecommendations(
    score: number,
    lowStockCount: number,
    outOfStockCount: number,
    anomalyWeight: number
  ): string[] {
    const recommendations: string[] = [];

    if (score >= 80) {
      recommendations.push('✅ Excellent état du stock. Continuez la surveillance.');
    } else if (score >= 60) {
      recommendations.push('📊 Stock correct. Surveillez les matériaux en stock bas.');
    } else if (score >= 40) {
      recommendations.push('⚠️ Stock précaire. Passez commande rapidement.');
    } else {
      recommendations.push('🚨 URGENT: Rupture de stock imminente! Commandez immédiatement.');
    }

    if (outOfStockCount > 0) {
      recommendations.push(`🔴 ${outOfStockCount} matériau(x) en rupture. Action immédiate requise.`);
    }
    if (lowStockCount > 0) {
      recommendations.push(`🟡 ${lowStockCount} matériau(x) en stock bas. Prévoyez une commande.`);
    }
    if (anomalyWeight > 0) {
      recommendations.push('📋 Planifiez un inventaire pour vérifier les anomalies.');
    }

    return recommendations;
  }

  private getDefaultScore(
    siteId: string,
    siteName: string,
    progress: number,
    errorMessage: string
  ): SiteHealthScoreResult {
    return {
      siteId,
      siteName,
      progress: Math.min(100, Math.max(0, progress)),
      stockHealth: 0,
      anomalies: 0,
      score: 0,
      level: 'critical',
      details: {
        totalMaterials: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        anomalyCount: 0,
        averageConsumptionRate: 0,
        criticalMaterials: [],
      },
      recommendations: [`❌ Erreur: ${errorMessage}`, 'Ajoutez des matériaux pour commencer le suivi.'],
    };
  }

  async getAllSitesScores(sitesData: Array<{ id: string; name: string; progress: number }>): Promise<SiteHealthScoreResult[]> {
    const scores: SiteHealthScoreResult[] = [];
    for (const site of sitesData) {
      try {
        const score = await this.calculateSiteHealthScore(site.id, site.name, site.progress);
        scores.push(score);
      } catch (error) {
        this.logger.error(`Erreur pour site ${site.id}: ${error.message}`);
        scores.push(this.getDefaultScore(site.id, site.name, site.progress, error.message));
      }
    }
    return scores.sort((a, b) => b.score - a.score);
  }
}