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

    const avgDaily = Object.keys(dailyTotals).length > 0
      ? Object.values(dailyTotals).reduce((sum: number, daily: any) => sum + ((daily as any).electricity || 0), 0) / Object.keys(dailyTotals).length
      : 0;

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
      efficiency: worker.productivityScore > 70 ? 'high' : worker.productivityScore > 50 ? 'medium' : 'low',
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

    const recommendations: string[] = [];

    // Equipment recommendations
    if (idleEquipment.length > 0) {
      recommendations.push(
        `Réduisez l'utilisation des ${idleEquipment.length} machines inutilisées`,
      );
    }

    // Energy recommendations
    if (energyAnalysis.peakPeriods.length > 0) {
      recommendations.push(
        'Lissez les pics de consommation d\'énergie pendant les heures creuses',
      );
    }

    // Worker recommendations
    const lowProductivityWorkers = workerProductivity.filter((w) => w.efficiency === 'low');
    if (lowProductivityWorkers.length > 0) {
      recommendations.push(
        `Optimisez les horaires de ${lowProductivityWorkers.length} travailleurs peu productifs`,
      );
    }

    // Add recommendations based on external data
    if (externalData) {
      const { tasks, milestones, siteStats } = externalData;
      
      // Task completion recommendations
      if (tasks.length > 0) {
        const completionRate = (siteStats.completedTasks / tasks.length) * 100;
        if (completionRate < 50) {
          recommendations.push(
            `Améliorez le suivi des tâches: seulement ${completionRate.toFixed(0)}% terminées`,
          );
        }
        if (siteStats.activeTasks > 20) {
          recommendations.push(
            `Réduisez le nombre de tâches actives (${siteStats.activeTasks}) pour améliorer la productivité`,
          );
        }
      }

      // Milestone recommendations
      if (milestones.length > 0) {
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const progress = (completedMilestones / milestones.length) * 100;
        if (progress < 30 && siteStats.pendingMilestones > 3) {
          recommendations.push(
            `Accélérez la progression des jalons: ${progress.toFixed(0)}% complétés, ${siteStats.pendingMilestones} en attente`,
          );
        }
      }

      // Budget recommendations
      if (externalData?.site && externalData.site.budget > 0) {
        const site = externalData.site;
        const actualCosts = resourceCosts.total;
        if (actualCosts > site.budget * 0.8) {
          recommendations.push(
            `Attention: les coûts(${actualCosts}€) approche du budget(${site.budget}€)`,
          );
        }
      }
    }

    // Calculate task completion rate from external data
    const taskCompletionRate = externalData && externalData.tasks.length > 0
      ? (externalData.siteStats.completedTasks / externalData.tasks.length) * 100
      : 0;
    
    const milestoneProgress = externalData && externalData.milestones.length > 0
      ? ((externalData.milestones.length - externalData.siteStats.pendingMilestones) / externalData.milestones.length) * 100
      : 0;

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
}
