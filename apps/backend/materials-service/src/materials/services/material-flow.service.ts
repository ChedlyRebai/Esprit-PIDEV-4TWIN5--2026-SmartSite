import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialFlowLog, FlowType, AnomalyType } from '../entities/material-flow-log.entity';
import { Material } from '../entities/material.entity';
import { CreateMaterialFlowDto, FlowValidationResult, DailyConsumptionStats, MaterialFlowQueryDto } from '../dto/material-flow.dto';
import { AnomalyEmailService } from '../../common/email/anomaly-email.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MaterialFlowService {
  private readonly logger = new Logger(MaterialFlowService.name);

  // Configuration des seuils d'anomalies
  private readonly MAX_DEVIATION_PERCENT = 50;  // 50% de déviation maximum
  private readonly DEFAULT_CONSUMPTION_RATE = 10; // 10 unités par jour par défaut

  constructor(
    @InjectModel(MaterialFlowLog.name) private flowLogModel: Model<MaterialFlowLog>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
    private readonly anomalyEmailService: AnomalyEmailService,
  ) {}

  /**
   * Enregistrer un mouvement de stock (entrée ou sortie)
   * Avec détection automatique d'anomalies
   */
  async recordMovement(
    createFlowDto: CreateMaterialFlowDto,
    userId: string,
  ): Promise<MaterialFlowLog> {
    try {
      this.logger.log(`📝 Recording ${createFlowDto.type} movement for material ${createFlowDto.materialId} on site ${createFlowDto.siteId}`);

      // 1. Récupérer le matériau et son stock actuel
      const material = await this.getMaterialWithSiteStock(
        createFlowDto.materialId,
        createFlowDto.siteId,
      );

      const previousStock = material.quantity;
      let newStock = previousStock;

      // 2. Calculer le nouveau stock
      switch (createFlowDto.type) {
        case FlowType.IN:
        case FlowType.RETURN:
          newStock = previousStock + createFlowDto.quantity;
          break;
        case FlowType.OUT:
        case FlowType.DAMAGE:
          if (createFlowDto.quantity > previousStock) {
            throw new BadRequestException(
              `Stock insuffisant. Stock actuel: ${previousStock}, Demande: ${createFlowDto.quantity}`,
            );
          }
          newStock = previousStock - createFlowDto.quantity;
          break;
        case FlowType.ADJUSTMENT:
          newStock = createFlowDto.quantity;
          break;
        case FlowType.RESERVE:
          material.reservedQuantity = (material.reservedQuantity || 0) + createFlowDto.quantity;
          newStock = previousStock;
          break;
      }

      // 3. Détecter les anomalies
      const validation = await this.validateMovement(createFlowDto, previousStock);

      // 4. Créer l'enregistrement de flux
      const flowLog = new this.flowLogModel({
        siteId: new Types.ObjectId(createFlowDto.siteId),
        materialId: new Types.ObjectId(createFlowDto.materialId),
        type: createFlowDto.type,
        quantity: createFlowDto.quantity,
        timestamp: new Date(),
        userId: new Types.ObjectId(userId),
        previousStock,
        newStock,
        reason: createFlowDto.reason,
        projectId: createFlowDto.projectId,
        reference: createFlowDto.reference,
        anomalyDetected: validation.anomalyType,
        anomalyMessage: validation.message,
        emailSent: false,
      });

      // 5. Sauvegarder le flux
      const savedFlow = await flowLog.save();

      // 6. Mettre à jour le stock du matériau
      await this.updateMaterialStock(
        createFlowDto.materialId,
        newStock,
        createFlowDto.type === FlowType.RESERVE ? material.reservedQuantity : undefined,
      );

      // 7. Si anomalie détectée, envoyer un email
      if (validation.anomalyType !== AnomalyType.NONE && !savedFlow.emailSent) {
        await this.sendAnomalyAlert(savedFlow, validation, material);
        savedFlow.emailSent = true;
        await savedFlow.save();
      }

      this.logger.log(`✅ Movement recorded: ${createFlowDto.type} ${createFlowDto.quantity} units`);

      return savedFlow;
    } catch (error) {
      this.logger.error(`❌ Error recording movement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valider un mouvement et détecter les anomalies
   */
  private async validateMovement(
    flow: CreateMaterialFlowDto,
    currentStock: number,
  ): Promise<FlowValidationResult> {
    // Récupérer les statistiques de consommation normale
    const consumptionStats = await this.getNormalConsumptionStats(
      flow.materialId,
      flow.siteId,
    );

    let anomalyType = AnomalyType.NONE;
    let message = '';
    let expectedQuantity: number | undefined;
    let deviationPercent: number | undefined;

    // Calculer la consommation normale par jour
    const normalDailyConsumption = consumptionStats?.averageDailyConsumption || this.DEFAULT_CONSUMPTION_RATE;
    const expectedDailyConsumption = normalDailyConsumption;

    if (flow.type === FlowType.OUT) {
      // Vérifier si la sortie dépasse la normale
      const isExcessive = flow.quantity > expectedDailyConsumption * (1 + this.MAX_DEVIATION_PERCENT / 100);
      
      if (isExcessive) {
        anomalyType = AnomalyType.EXCESSIVE_OUT;
        deviationPercent = ((flow.quantity - expectedDailyConsumption) / expectedDailyConsumption) * 100;
        expectedQuantity = expectedDailyConsumption;
        message = `🚨 ALERTE: Sortie excessive détectée! Quantité: ${flow.quantity} unités, Normale: ${expectedDailyConsumption.toFixed(1)} unités/jour. Déviation: ${deviationPercent.toFixed(1)}%.`;
      }

      // Vérifier le stock de sécurité
      if (currentStock - flow.quantity < 0) {
        anomalyType = AnomalyType.BELOW_SAFETY_STOCK;
        message = `⚠️ ALERTE: Stock insuffisant! Stock après sortie: ${currentStock - flow.quantity} unités (négatif).`;
      }
    }

    if (flow.type === FlowType.IN) {
      // Pour les entrées, vérifier si c'est anormalement élevé
      const maxExpectedIn = expectedDailyConsumption * 10; // 10 jours de consommation max
      
      if (flow.quantity > maxExpectedIn) {
        anomalyType = AnomalyType.EXCESSIVE_IN;
        deviationPercent = ((flow.quantity - maxExpectedIn) / maxExpectedIn) * 100;
        expectedQuantity = maxExpectedIn;
        message = `⚠️ ALERTE: Entrée anormalement élevée! Quantité: ${flow.quantity} unités, Attendue max: ${maxExpectedIn} unités. Déviation: ${deviationPercent.toFixed(1)}%.`;
      }
    }

    return {
      isValid: anomalyType === AnomalyType.NONE,
      anomalyType,
      message,
      expectedQuantity,
      deviationPercent,
    };
  }

  /**
   * Obtenir les statistiques de consommation normale
   */
  private async getNormalConsumptionStats(
    materialId: string,
    siteId: string,
  ): Promise<DailyConsumptionStats | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Récupérer toutes les sorties des 30 derniers jours
    const outMovements = await this.flowLogModel.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          siteId: new Types.ObjectId(siteId),
          type: FlowType.OUT,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          dailyTotal: { $sum: '$quantity' },
        },
      },
    ]);

    if (outMovements.length === 0) {
      return null;
    }

    const dailyTotals = outMovements.map(m => m.dailyTotal);
    const averageDaily = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length;
    const maxDaily = Math.max(...dailyTotals);
    const minDaily = Math.min(...dailyTotals);
    const totalConsumption = dailyTotals.reduce((a, b) => a + b, 0);

    return {
      materialId,
      siteId,
      averageDailyConsumption: averageDaily,
      maxDailyConsumption: maxDaily,
      minDailyConsumption: minDaily,
      totalConsumptionLast30Days: totalConsumption,
      daysWithData: outMovements.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Envoyer une alerte email pour anomalie
   */
  private async sendAnomalyAlert(
    flow: MaterialFlowLog,
    validation: FlowValidationResult,
    material: any,
  ): Promise<void> {
    try {
      this.logger.log(`📧 Sending anomaly alert email for material ${material.name}`);

      // Récupérer les informations du site et de l'utilisateur
      const siteInfo = await this.getSiteInfo(flow.siteId.toString());
      const userInfo = await this.getUserInfo(flow.userId.toString());

      await this.anomalyEmailService.sendStockAnomalyAlert({
        toEmail: userInfo?.email || process.env.ADMIN_EMAIL || 'admin@smartsite.com',
        userName: userInfo?.name || userInfo?.firstName || 'Admin',
        siteName: siteInfo?.nom || siteInfo?.name || 'Site inconnu',
        materialName: material.name,
        materialCode: material.code,
        flowType: flow.type,
        quantity: flow.quantity,
        anomalyType: validation.anomalyType,
        anomalyMessage: validation.message,
        currentStock: flow.newStock,
        previousStock: flow.previousStock,
        expectedQuantity: validation.expectedQuantity,
        deviationPercent: validation.deviationPercent,
        timestamp: flow.timestamp,
        reason: flow.reason,
      });

      this.logger.log(`✅ Anomaly email sent for flow ${flow._id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send anomaly email: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le stock du matériau
   */
  private async updateMaterialStock(
    materialId: string,
    newStock: number,
    reservedQuantity?: number,
  ): Promise<void> {
    const updateData: any = { quantity: newStock };
    if (reservedQuantity !== undefined) {
      updateData.reservedQuantity = reservedQuantity;
    }

    await this.materialModel.findByIdAndUpdate(materialId, updateData);
  }

  /**
   * Récupérer le matériau avec son stock par site
   */
  private async getMaterialWithSiteStock(materialId: string, siteId: string): Promise<any> {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Material ${materialId} not found`);
    }
    return material;
  }

  /**
   * Récupérer les informations du site
   */
  private async getSiteInfo(siteId: string): Promise<any> {
    try {
      const axios = require('axios');
      const response = await axios.get(`http://localhost:3001/api/gestion-sites/${siteId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Could not fetch site ${siteId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupérer les informations de l'utilisateur
   */
  private async getUserInfo(userId: string): Promise<any> {
    try {
      const axios = require('axios');
      const response = await axios.get(`http://localhost:3000/api/users/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Could not fetch user ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtenir tous les flux pour un matériau/site
   */
  async getFlows(query: MaterialFlowQueryDto): Promise<{ data: MaterialFlowLog[]; total: number }> {
    const filter: any = {};

    if (query.siteId) filter.siteId = new Types.ObjectId(query.siteId);
    if (query.materialId) filter.materialId = new Types.ObjectId(query.materialId);
    if (query.type) filter.type = query.type;
    if (query.anomalyDetected && query.anomalyDetected !== AnomalyType.NONE) {
      filter.anomalyDetected = query.anomalyDetected;
    }
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = query.startDate;
      if (query.endDate) filter.timestamp.$lte = query.endDate;
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 50);
    
    const [data, total] = await Promise.all([
      this.flowLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(query.limit || 50)
        .exec(),
      this.flowLogModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * Obtenir les anomalies non résolues
   */
  async getUnresolvedAnomalies(): Promise<MaterialFlowLog[]> {
    return this.flowLogModel
      .find({ 
        anomalyDetected: { $ne: AnomalyType.NONE },
        emailSent: true,
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Tâche cron: Vérification quotidienne des anomalies de stock
   * S'exécute tous les jours à 8h00
   */
  @Cron('0 8 * * *')
  async dailyStockCheck() {
    this.logger.log('🔍 Running daily stock anomaly check...');
    
    // Vérifier tous les matériaux en stock bas
    const lowStockMaterials = await this.materialModel.find({
      $expr: { $lte: ['$quantity', '$reorderPoint'] },
    }).exec();

    for (const material of lowStockMaterials) {
      const anomalyFlow = new this.flowLogModel({
        siteId: material.siteId,
        materialId: material._id,
        type: FlowType.OUT,
        quantity: 0,
        timestamp: new Date(),
        userId: new Types.ObjectId('000000000000000000000000'),
        previousStock: material.quantity,
        newStock: material.quantity,
        anomalyDetected: AnomalyType.BELOW_SAFETY_STOCK,
        anomalyMessage: `⚠️ Stock critique: ${material.quantity} ${material.unit} restants. Point de commande: ${material.reorderPoint}.`,
        emailSent: false,
      });

      await this.sendAnomalyAlert(
        anomalyFlow,
        {
          isValid: false,
          anomalyType: AnomalyType.BELOW_SAFETY_STOCK,
          message: anomalyFlow.anomalyMessage || '',
        },
        material,
      );
      
      anomalyFlow.emailSent = true;
      await anomalyFlow.save();
    }

    this.logger.log(`✅ Daily stock check completed. ${lowStockMaterials.length} low stock materials found.`);
  }

  /**
   * Obtenir les statistiques de flux pour un matériau
   */
  async getFlowStatistics(materialId: string, siteId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.flowLogModel.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          siteId: new Types.ObjectId(siteId),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          anomalies: { 
            $sum: { $cond: [{ $ne: ['$anomalyDetected', AnomalyType.NONE] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      period: `${days} days`,
      startDate,
      endDate: new Date(),
      statistics: stats,
    };
  }
}