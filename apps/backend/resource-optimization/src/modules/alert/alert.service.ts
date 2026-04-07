import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert } from '@/schemas/alert.schema';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
    private resourceAnalysisService: ResourceAnalysisService,
  ) {}

  /**
   * Créer une alerte
   */
  async createAlert(
    siteId: string,
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    metadata?: any,
  ) {
    const alert = new this.alertModel({
      siteId,
      type,
      severity,
      title,
      message,
      metadata,
    });

    return alert.save();
  }

  /**
   * Générer automatiquement des alertes basées sur les seuils
   */
  async generateAlerts(siteId: string) {
    const analysis = await this.resourceAnalysisService.analyzeResources(siteId);
    const alerts = [];

    // ALERTE: Machines inutilisées
    if (analysis.idleEquipment.length > 0) {
      const alert = await this.createAlert(
        siteId,
        'equipment-idle',
        'high',
        '⚠️ Machines inutilisées détectées',
        `${analysis.idleEquipment.length} machines fonctionnent à moins de 20% de leur capacité. 
        Coût inutile: ~${analysis.idleEquipment.length * 500}€/jour.`,
        { equipmentList: analysis.idleEquipment },
      );
      alerts.push(alert);
    }

    // ALERTE: Pics de consommation énergétique
    if (analysis.peakConsumptionPeriods.length > 3) {
      const alert = await this.createAlert(
        siteId,
        'energy-spike',
        'medium',
        '⚡ Pics de consommation énergétique',
        `Vous avez ${analysis.peakConsumptionPeriods.length} pics de consommation. 
        Décalez certaines opérations aux heures creuses pour économiser jusqu'à 30%.`,
        { peakPeriods: analysis.peakConsumptionPeriods },
      );
      alerts.push(alert);
    }

    // ALERTE: Gaspillage environnemental
    if (analysis.environmentalImpact.totalCO2 > 1000) {
      const alert = await this.createAlert(
        siteId,
        'high-waste',
        'critical',
        '🌍 Empreinte carbone élevée',
        `Vous générez ${analysis.environmentalImpact.totalCO2.toFixed(0)} kg CO2. 
        C'est dangereux pour l'environnement. Appliquez les recommandations écologiques.`,
        { co2: analysis.environmentalImpact.totalCO2 },
      );
      alerts.push(alert);
    }

    // ALERTE: Faible productivité
    const lowProductivityWorkers = analysis.workerProductivity.filter(
      (w: any) => w.efficiency === 'low',
    );
    if (lowProductivityWorkers.length > 0) {
      const alert = await this.createAlert(
        siteId,
        'budget-exceed',
        'medium',
        '👷 Faible productivité détectée',
        `${lowProductivityWorkers.length} ouvriers ont une faible productivité. 
        Formation ou réorganisation recommandée.`,
        { lowProductivityWorkers },
      );
      alerts.push(alert);
    }

    // ALERTE: Budget dépassé
    if (analysis.costBreakdown.total > 10000) {
      const alert = await this.createAlert(
        siteId,
        'budget-exceed',
        'high',
        '💰 Budget de ressources dépassé',
        `Les coûts des ressources atteignent ${analysis.costBreakdown.total.toFixed(2)}€. 
        Appliquez l'optimisation pour réduire les coûts.`,
        { totalCost: analysis.costBreakdown.total },
      );
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Récupérer les alertes non lues
   */
  async getUnreadAlerts(siteId: string) {
    return this.alertModel
      .find({ siteId, isRead: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Récupérer les alertes critiques
   */
  async getCriticalAlerts(siteId: string) {
    return this.alertModel
      .find({ siteId, severity: 'critical' })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Récupérer toutes les alertes d'un site
   */
  async getAllAlerts(siteId: string, limit: number = 50) {
    return this.alertModel
      .find({ siteId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Marquer une alerte comme lue
   */
  async markAsRead(id: string) {
    return this.alertModel
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
      .exec();
  }

  /**
   * Marquer une alerte comme résolue
   */
  async markAsResolved(id: string) {
    return this.alertModel
      .findByIdAndUpdate(
        id,
        { status: 'resolved', resolvedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  /**
   * Supprimer les alertes lues et résolues (nettoyage)
   */
  async cleanupResolvedAlerts(siteId: string) {
    return this.alertModel
      .deleteMany({
        siteId,
        isRead: true,
        status: 'resolved',
        createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
      })
      .exec();
  }

  /**
   * Obtenir un résumé des alertes
   */
  async getAlertsSummary(siteId: string) {
    const allAlerts = await this.alertModel.find({ siteId }).exec();

    const summary = {
      total: allAlerts.length,
      unread: allAlerts.filter((a) => !a.isRead).length,
      critical: allAlerts.filter((a) => a.severity === 'critical').length,
      high: allAlerts.filter((a) => a.severity === 'high').length,
      medium: allAlerts.filter((a) => a.severity === 'medium').length,
      low: allAlerts.filter((a) => a.severity === 'low').length,
      byType: {
        equipmentIdle: allAlerts.filter((a) => a.type === 'equipment-idle').length,
        energySpike: allAlerts.filter((a) => a.type === 'energy-spike').length,
        highWaste: allAlerts.filter((a) => a.type === 'high-waste').length,
        budgetExceed: allAlerts.filter((a) => a.type === 'budget-exceed').length,
        deadlineRisk: allAlerts.filter((a) => a.type === 'deadline-risk').length,
      },
    };

    return summary;
  }
}
