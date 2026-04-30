import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equipment } from '@/schemas/equipment.schema';
import { Worker } from '@/schemas/worker.schema';
import { EnergyConsumption } from '@/schemas/energy-consumption.schema';
import { ExternalDataService, SiteData, TaskData, MilestoneData } from '../external-data/external-data.service';

export interface ResourceAnalysis {
  idleEquipment: any[];
  peakConsumptionPeriods: any[];
  workerProductivity: any[];
  costBreakdown: any;
  environmentalImpact: {
    totalCO2: number;
    totalWaste: number;
  };
  recommendations: string[];
  externalData?: {
    site: SiteData | null;
    tasks: TaskData[];
    milestones: MilestoneData[];
    taskCompletionRate: number;
    milestoneProgress: number;
  };
}

@Injectable()
export class ResourceAnalysisService {
  constructor(
    @InjectModel(Equipment.name) private equipmentModel: Model<Equipment>,
    @InjectModel(Worker.name) private workerModel: Model<Worker>,
    @InjectModel(EnergyConsumption.name) private energyConsumptionModel: Model<EnergyConsumption>,
    private readonly externalDataService: ExternalDataService,
  ) {}

  async detectIdleEquipment(siteId: string) {
    const equipment = await this.equipmentModel
      .find({ siteId, isActive: true })
      .exec();

    return equipment
      .filter((eq) => eq.utilizationRate < 20)
      .map((eq) => ({
        id: eq._id,
        name: eq.deviceName,
        utilizationRate: eq.utilizationRate,
        hoursOperating: eq.hoursOperating,
        type: eq.type,
        wastePercentage: 100 - eq.utilizationRate,
      }));
  }

  async analyzeEnergyConsumption(siteId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const energyData = await this.energyConsumptionModel
      .find({
        siteId,
        dateLogged: { $gte: startDate },
      })
      .exec();

    if (energyData.length === 0) {
      return { peakPeriods: [], averageDailyConsumption: 0, totalCO2: 0, totalWaste: 0 };
    }

    const dailyTotals: Record<string, { electricity: number; fuel: number; water: number; waste: number; co2: number }> = {};
    for (const entry of energyData) {
      const date = entry.dateLogged.toISOString().split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { electricity: 0, fuel: 0, water: 0, waste: 0, co2: 0 };
      }
      dailyTotals[date].electricity += entry.electricity || 0;
      dailyTotals[date].fuel += entry.fuelConsumption || 0;
      dailyTotals[date].water += entry.waterConsumption || 0;
      dailyTotals[date].waste += entry.wasteGenerated || 0;
      dailyTotals[date].co2 += entry.carbonEmissions || 0;
    }

    const sortedDates = Object.entries(dailyTotals)
      .sort((a, b) => {
        const aElectricity = (a[1] as any).electricity || 0;
        const bElectricity = (b[1] as any).electricity || 0;
        return bElectricity - aElectricity;
      })
      .slice(0, Math.ceil(Object.keys(dailyTotals).length * 0.25));

    const avgDaily = this.calculateAverageDailyConsumption(dailyTotals);

    return {
      peakPeriods: sortedDates.map(([date, data]: any) => ({ date, ...data })),
      averageDailyConsumption: avgDaily,
      totalCO2: energyData.reduce((sum, e) => sum + (e.carbonEmissions || 0), 0),
      totalWaste: energyData.reduce((sum, e) => sum + (e.wasteGenerated || 0), 0),
    };
  }

  async analyzeWorkerProductivity(siteId: string) {
    const workers = await this.workerModel.find({ siteId }).exec();

    return workers.map((worker) => ({
      id: worker._id,
      name: worker.name,
      role: worker.role,
      hoursWorked: worker.hoursWorked,
      costIncurred: worker.hoursWorked * worker.costhourlyRate,
      productivityScore: worker.productivityScore,
      efficiency: this.getWorkerEfficiencyLevel(worker.productivityScore),
    }));
  }

  async calculateResourceCosts(siteId: string) {
    const equipment = await this.equipmentModel.find({ siteId }).exec();
    const workers = await this.workerModel.find({ siteId }).exec();

    const equipmentCosts = equipment.reduce((total, eq) => {
      return total + (eq.hoursOperating * 50) + (eq.maintenanceCost || 0);
    }, 0);

    const workerCosts = workers.reduce((total, w) => {
      return total + (w.hoursWorked * w.costhourlyRate);
    }, 0);

    return {
      equipment: equipmentCosts,
      workers: workerCosts,
      total: equipmentCosts + workerCosts,
      breakdown: {
        equipmentPercentage: equipmentCosts + workerCosts > 0 ? (equipmentCosts / (equipmentCosts + workerCosts)) * 100 : 0,
        workersPercentage: equipmentCosts + workerCosts > 0 ? (workerCosts / (equipmentCosts + workerCosts)) * 100 : 0,
      },
    };
  }

  async analyzeResources(siteId: string): Promise<ResourceAnalysis> {
    const [idleEquipment, energyAnalysis, workerProductivity, resourceCosts, externalData] = await Promise.all([
      this.detectIdleEquipment(siteId),
      this.analyzeEnergyConsumption(siteId),
      this.analyzeWorkerProductivity(siteId),
      this.calculateResourceCosts(siteId),
      this.externalDataService.getAllSiteData(siteId).catch(() => null),
    ]);

    const recommendations = this.buildResourceRecommendations(idleEquipment, energyAnalysis, workerProductivity, resourceCosts, externalData);
    const taskCompletionRate = this.calculateTaskCompletionRateFromExternalData(externalData);
    const milestoneProgress = this.calculateMilestoneProgressFromExternalData(externalData);

    return {
      idleEquipment,
      peakConsumptionPeriods: energyAnalysis.peakPeriods,
      workerProductivity,
      costBreakdown: resourceCosts,
      environmentalImpact: {
        totalCO2: energyAnalysis.totalCO2,
        totalWaste: energyAnalysis.totalWaste,
      },
      recommendations,
      externalData: externalData ? {
        site: externalData.site,
        tasks: externalData.tasks,
        milestones: externalData.milestones,
        taskCompletionRate,
        milestoneProgress,
      } : undefined,
    };
  }

  private calculateAverageDailyConsumption(dailyTotals: Record<string, { electricity: number; fuel: number; water: number; waste: number; co2: number }>) {
    const totals = Object.values(dailyTotals);
    if (totals.length === 0) return 0;
    return totals.reduce((sum, daily) => sum + daily.electricity, 0) / totals.length;
  }

  private getWorkerEfficiencyLevel(productivityScore: number) {
    if (productivityScore > 70) return 'high';
    if (productivityScore > 50) return 'medium';
    return 'low';
  }

  private buildResourceRecommendations(
    idleEquipment: any[],
    energyAnalysis: { peakPeriods: any[] },
    workerProductivity: any[],
    resourceCosts: any,
    externalData: any,
  ): string[] {
    const recommendations: string[] = [];

    if (idleEquipment.length > 0) {
      recommendations.push(`Réduisez l'utilisation des ${idleEquipment.length} machines inutilisées`);
    }

    if (energyAnalysis.peakPeriods.length > 0) {
      recommendations.push('Lissez les pics de consommation d\'énergie pendant les heures creuses');
    }

    const lowProductivityWorkers = workerProductivity.filter((worker) => worker.efficiency === 'low');
    if (lowProductivityWorkers.length > 0) {
      recommendations.push(`Optimisez les horaires de ${lowProductivityWorkers.length} travailleurs peu productifs`);
    }

    if (externalData) {
      recommendations.push(...this.buildExternalDataRecommendations(externalData, resourceCosts));
    }

    return recommendations;
  }

  private buildExternalDataRecommendations(externalData: any, resourceCosts: any): string[] {
    const recommendations: string[] = [];
    const { tasks, milestones, siteStats, site } = externalData;

    if (tasks.length > 0) {
      const completionRate = this.calculateTaskCompletionRateFromExternalData(externalData);
      if (completionRate < 50) {
        recommendations.push(`Améliorez le suivi des tâches: seulement ${completionRate.toFixed(0)}% terminées`);
      }
      if (siteStats.activeTasks > 20) {
        recommendations.push(`Réduisez le nombre de tâches actives (${siteStats.activeTasks}) pour améliorer la productivité`);
      }
    }

    if (milestones.length > 0) {
      const milestoneProgress = this.calculateMilestoneProgressFromExternalData(externalData);
      if (milestoneProgress < 30 && siteStats.pendingMilestones > 3) {
        recommendations.push(`Accélérez la progression des jalons: ${milestoneProgress.toFixed(0)}% complétés, ${siteStats.pendingMilestones} en attente`);
      }
    }

    if (site && site.budget > 0 && resourceCosts.total > site.budget * 0.8) {
      recommendations.push(`Attention: les coûts(${resourceCosts.total}€) approche du budget(${site.budget}€)`);
    }

    return recommendations;
  }

  private calculateTaskCompletionRateFromExternalData(externalData: any) {
    if (!externalData || externalData.tasks.length === 0) return 0;
    return (externalData.siteStats.completedTasks / externalData.tasks.length) * 100;
  }

  private calculateMilestoneProgressFromExternalData(externalData: any) {
    if (!externalData || externalData.milestones.length === 0) return 0;
    return ((externalData.milestones.length - externalData.siteStats.pendingMilestones) / externalData.milestones.length) * 100;
  }
}
