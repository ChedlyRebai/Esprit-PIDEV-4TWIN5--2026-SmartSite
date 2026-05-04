import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

export interface TrainingResult {
  success: boolean;
  modelPath: string;
  accuracy: number;
  mse: number;
  epochs: number;
  dataPoints: number;
  message: string;
}

export interface PredictionResult {
  success: boolean;
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  consumptionRate: number;
  hoursToOutOfStock: number;
  hoursToLowStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  confidence: number;
  message: string;
}

@Injectable()
export class MLTrainingService {
  private readonly logger = new Logger(MLTrainingService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'datasets');
  private readonly modelsDir = path.join(process.cwd(), 'uploads', 'models');

  constructor() {
    // Créer les dossiers s'ils n'existent pas
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
    
    this.logger.warn('⚠️ ML Training temporairement désactivé (problème compatibilité TensorFlow sur Windows)');
    this.logger.log('📊 Utilisation des prédictions historiques uniquement');
  }

  /**
   * Lire et parser un fichier CSV
   */
  private async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Entraîner un modèle ML avec le dataset fourni
   * TEMPORAIREMENT DÉSACTIVÉ - Problème de compatibilité TensorFlow sur Windows
   */
  async trainModel(
    materialId: string,
    datasetPath: string,
  ): Promise<TrainingResult> {
    this.logger.warn(`⚠️ ML Training désactivé pour ${materialId} (problème compatibilité Windows)`);
    throw new BadRequestException(
      'ML Training temporairement désactivé. Utilisez les prédictions historiques.',
    );
  }

  /**
   * Générer une prédiction avec le modèle entraîné
   * TEMPORAIREMENT DÉSACTIVÉ - Problème de compatibilité TensorFlow sur Windows
   */
  async predict(
    materialId: string,
    materialName: string,
    currentStock: number,
    minimumStock: number,
    modelPath: string,
  ): Promise<PredictionResult> {
    this.logger.warn(`⚠️ ML Prediction désactivée pour ${materialName} (problème compatibilité Windows)`);
    throw new BadRequestException(
      'ML Prediction temporairement désactivée. Utilisez les prédictions historiques.',
    );
  }

  /**
   * Nettoyer les anciens fichiers (datasets et modèles > 7 jours)
   */
  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

      // Nettoyer datasets
      if (fs.existsSync(this.uploadsDir)) {
        const datasetFiles = fs.readdirSync(this.uploadsDir);
        for (const file of datasetFiles) {
          const filePath = path.join(this.uploadsDir, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            this.logger.log(`🧹 Dataset supprimé: ${file}`);
          }
        }
      }

      // Nettoyer modèles
      if (fs.existsSync(this.modelsDir)) {
        const modelDirs = fs.readdirSync(this.modelsDir);
        for (const dir of modelDirs) {
          const dirPath = path.join(this.modelsDir, dir);
          if (fs.statSync(dirPath).isDirectory()) {
            const stats = fs.statSync(dirPath);
            if (now - stats.mtimeMs > maxAge) {
              fs.rmSync(dirPath, { recursive: true, force: true });
              this.logger.log(`🧹 Modèle supprimé: ${dir}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erreur nettoyage: ${error.message}`);
    }
  }
}
