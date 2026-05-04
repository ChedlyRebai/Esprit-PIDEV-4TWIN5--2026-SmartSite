import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { MLTrainingService, PredictionResult } from './ml-training.service';

@Injectable()
export class AutoMLPredictionService {
  private readonly logger = new Logger(AutoMLPredictionService.name);
  private trainedModels: Map<string, string> = new Map(); // materialId -> modelPath
  private isTraining = false;

  constructor(
    private readonly mlTrainingService: MLTrainingService,
    @InjectModel('Material') private materialModel: Model<any>,
  ) {}

  /**
   * Entraîner automatiquement le modèle avec test.csv au démarrage
   * TEMPORAIREMENT DÉSACTIVÉ - Problème de compatibilité TensorFlow sur Windows
   */
  async autoTrainOnStartup(): Promise<void> {
    this.logger.warn('⚠️ ML Training temporairement désactivé (problème compatibilité Windows)');
    this.logger.log('📊 Utilisation des prédictions historiques uniquement');
    return;
    
    /* CODE DÉSACTIVÉ
    if (this.isTraining) {
      this.logger.warn('⚠️ Entraînement déjà en cours, skip');
      return;
    }

    try {
      this.isTraining = true;
      this.logger.log('🚀 Démarrage entraînement automatique avec test.csv');

      // Chemin vers test.csv
      const datasetPath = path.join(
        process.cwd(),
        'test.csv',
      );

      if (!fs.existsSync(datasetPath)) {
        this.logger.warn(
          `⚠️ Fichier test.csv non trouvé à ${datasetPath}`,
        );
        return;
      }

      // Récupérer tous les matériaux uniques du dataset
      const materialIds = await this.extractMaterialIdsFromCSV(datasetPath);
      this.logger.log(
        `📊 ${materialIds.length} matériaux trouvés dans test.csv`,
      );

      // Entraîner un modèle pour chaque matériau
      for (const materialId of materialIds) {
        try {
          this.logger.log(`🤖 Entraînement pour matériau ${materialId}...`);

          const result = await this.mlTrainingService.trainModel(
            materialId,
            datasetPath,
          );

          if (result.success) {
            this.trainedModels.set(materialId, result.modelPath);
            this.logger.log(
              `✅ Modèle entraîné pour ${materialId}: ${result.modelPath}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Erreur entraînement ${materialId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `✅ Entraînement automatique terminé: ${this.trainedModels.size} modèles`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erreur entraînement automatique: ${error.message}`,
      );
    } finally {
      this.isTraining = false;
    }
    */
  }

  /**
   * Extraire les IDs de matériaux uniques du CSV
   */
  private async extractMaterialIdsFromCSV(
    filePath: string,
  ): Promise<string[]> {
    const csv = require('csv-parser');
    const materialIds = new Set<string>();

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          if (row.materialId) {
            materialIds.add(row.materialId);
          }
        })
        .on('end', () => resolve(Array.from(materialIds)))
        .on('error', reject);
    });
  }

  /**
   * Obtenir une prédiction ML pour un matériau
   */
  async getPrediction(
    materialId: string,
    materialName: string,
    currentStock: number,
    minimumStock: number,
  ): Promise<PredictionResult | null> {
    try {
      const modelPath = this.trainedModels.get(materialId);

      if (!modelPath) {
        this.logger.warn(
          `⚠️ Pas de modèle entraîné pour ${materialId}`,
        );
        return null;
      }

      // Vérifier que le modèle existe toujours
      if (!fs.existsSync(path.join(modelPath, 'model.json'))) {
        this.logger.warn(
          `⚠️ Modèle ${modelPath} introuvable, suppression du cache`,
        );
        this.trainedModels.delete(materialId);
        return null;
      }

      return await this.mlTrainingService.predict(
        materialId,
        materialName,
        currentStock,
        minimumStock,
        modelPath,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erreur prédiction ML pour ${materialId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Vérifier si un modèle est disponible pour un matériau
   */
  hasModel(materialId: string): boolean {
    return this.trainedModels.has(materialId);
  }

  /**
   * Obtenir le nombre de modèles entraînés
   */
  getTrainedModelsCount(): number {
    return this.trainedModels.size;
  }

  /**
   * Réentraîner tous les modèles
   */
  async retrainAll(): Promise<void> {
    this.trainedModels.clear();
    await this.autoTrainOnStartup();
  }
}
