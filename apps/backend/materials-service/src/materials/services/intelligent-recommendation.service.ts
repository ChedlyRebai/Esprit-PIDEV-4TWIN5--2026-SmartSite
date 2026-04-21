import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';
import { MLTrainingService } from './ml-training.service';

export interface AutoOrderRecommendation {
  materialId: string;
  materialName: string;
  materialCode: string;
  currentStock: number;
  consumptionRate: number;
  predictedHoursToOutOfStock: number;
  autoSuggestOrder: boolean;
  recommendedQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
  message: string;
  reason: string;
}

export interface SupplierSuggestion {
  supplierId: string;
  supplierName: string;
  estimatedDeliveryDays: number;
  price?: number;
  isPreferred: boolean;
}

@Injectable()
export class IntelligentRecommendationService {
  private readonly logger = new Logger(IntelligentRecommendationService.name);
  private readonly DEFAULT_LEAD_TIME_DAYS = 7;
  private readonly SAFETY_STOCK_FACTOR = 1.5;

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    private readonly mlTrainingService: MLTrainingService,
  ) {}

  async checkAutoOrderNeeded(materialId: string): Promise<AutoOrderRecommendation> {
    const material = await this.materialModel.findById(materialId).exec();
    if (!material) {
      throw new Error(`Materiau ${materialId} non trouve`);
    }

    let consumptionRate = material.consumptionRate || 1;
    let predictedHoursToOutOfStock = 999;

    if (this.mlTrainingService.hasModel(materialId)) {
      try {
        const prediction = await this.mlTrainingService.predictStock(
          materialId,
          24,
          material.quantity,
          material.reorderPoint,
        );
        predictedHoursToOutOfStock = prediction.hoursToOutOfStock;
        consumptionRate = prediction.consumptionRate;
      } catch {
        this.logger.warn(`ML prediction failed for ${materialId}, using fallback`);
      }
    }

    if (predictedHoursToOutOfStock === 999) {
      const effectiveRate = Math.max(1, consumptionRate);
      predictedHoursToOutOfStock = material.quantity / effectiveRate;
    }

    const autoSuggestOrder = predictedHoursToOutOfStock < 48;
    const leadTimeDays = this.getLeadTimeForMaterial(material);
    const leadTimeHours = leadTimeDays * 24;
    const safetyStock = this.calculateSafetyStock(material, consumptionRate);
    const recommendedQuantity = Math.ceil((consumptionRate * leadTimeHours) + safetyStock);

    let urgencyLevel: 'critical' | 'warning' | 'info' = 'info';
    let message = '';
    let reason = '';

    if (predictedHoursToOutOfStock < 24) {
      urgencyLevel = 'critical';
      message = `URGENT: Rupture dans ${Math.floor(predictedHoursToOutOfStock)}h!`;
      reason = `Stock critique: ${material.quantity} ${material.unit} restants`;
    } else if (predictedHoursToOutOfStock < 48) {
      urgencyLevel = 'warning';
      message = `Attention: Rupture dans ${Math.floor(predictedHoursToOutOfStock)}h`;
      reason = `Stock bas: ${material.quantity} ${material.unit} / seuil ${material.reorderPoint}`;
    } else {
      message = `Stock suffisant pour ${Math.floor(predictedHoursToOutOfStock / 24)} jours`;
      reason = 'Pas de commande immediate necessaire';
    }

    return {
      materialId: material._id.toString(),
      materialName: material.name,
      materialCode: material.code,
      currentStock: material.quantity,
      consumptionRate: Math.round(consumptionRate * 100) / 100,
      predictedHoursToOutOfStock: Math.floor(predictedHoursToOutOfStock),
      autoSuggestOrder,
      recommendedQuantity,
      leadTimeDays,
      safetyStock,
      urgencyLevel,
      message,
      reason,
    };
  }

  async getAllAutoOrderMaterials(siteId?: string): Promise<AutoOrderRecommendation[]> {
    const filter: any = { status: 'active' };
    if (siteId && Types.ObjectId.isValid(siteId)) {
      const siteObjId = new Types.ObjectId(siteId);
      filter.$or = [{ siteId: siteObjId }, { assignedSites: siteObjId }];
    }

    const materials = await this.materialModel.find(filter).exec();
    const recommendations: AutoOrderRecommendation[] = [];

    for (const material of materials) {
      try {
        const rec = await this.checkAutoOrderNeeded(material._id.toString());
        if (rec.autoSuggestOrder) {
          recommendations.push(rec);
        }
      } catch {
        this.logger.warn(`Failed to check auto order for ${material._id}`);
      }
    }

    recommendations.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.urgencyLevel] - order[b.urgencyLevel];
    });

    return recommendations;
  }

  private getLeadTimeForMaterial(_material: Material): number {
    return this.DEFAULT_LEAD_TIME_DAYS;
  }

  private calculateSafetyStock(material: Material, consumptionRate: number): number {
    const dailyConsumption = consumptionRate * 24;
    const safetyStock = Math.ceil(dailyConsumption * this.SAFETY_STOCK_FACTOR);
    if (material.maximumStock > 0) {
      return Math.max(0, Math.min(safetyStock, material.maximumStock - material.quantity));
    }
    return safetyStock;
  }

  async suggestSuppliers(materialId: string): Promise<SupplierSuggestion[]> {
    const material = await this.materialModel.findById(materialId).exec();
    if (!material) return [];

    const suggestions: SupplierSuggestion[] = [];
    if (material.preferredSuppliers && material.preferredSuppliers.length > 0) {
      for (const supplierId of material.preferredSuppliers) {
        try {
          const response = await fetch(`http://localhost:3005/fournisseurs/${supplierId.toString()}`);
          if (response.ok) {
            const supplier = await response.json();
            suggestions.push({
              supplierId: supplier._id,
              supplierName: supplier.nom,
              estimatedDeliveryDays: this.DEFAULT_LEAD_TIME_DAYS,
              isPreferred: true,
            });
          }
        } catch {
          this.logger.warn(`Failed to fetch supplier ${supplierId.toString()}`);
        }
      }
    }

    return suggestions;
  }
}
