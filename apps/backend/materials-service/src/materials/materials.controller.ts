import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto, UpdateStockDto } from './dto/update-material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { ScanQRDto } from './dto/scan-qr.dto';
import {
  MaterialForecast,
  StockAlert,
  QRScanResult,
} from './interfaces/material.interface';
import { QRScannerUtil } from '../common/utils/qr-scanner.util';
import * as fs from 'fs';
import { Material } from './entities/material.entity';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  StockPredictionService,
  StockPredictionResult,
} from './services/stock-prediction.service';
import { PredictionResult } from './dto/historical-data.dto';
import { MLTrainingService } from './services/ml-training.service';
import { AutoMLPredictionService } from './services/auto-ml-prediction.service';
import { PredictionResult as MLPredictionResult } from './services/ml-training.service';
import { IntelligentRecommendationService } from './services/intelligent-recommendation.service';
import { SitesService, SiteDocument } from '../sites/sites.service';
import { AnomalyEmailService } from '../common/email/anomaly-email.service';
import { AnomalyType } from './entities/material-flow-log.entity';
import { DailyReportService } from './services/daily-report.service';
import { MLPredictionClientService } from './services/ml-prediction-client.service';

@Controller('materials')
export class MaterialsController {
  private readonly logger = new Logger(MaterialsController.name);

  constructor(
    private readonly materialsService: MaterialsService,
    private readonly predictionService: StockPredictionService,
    private readonly mlTrainingService: MLTrainingService,
    private readonly autoMLService: AutoMLPredictionService,
    private readonly intelligentRecommendationService: IntelligentRecommendationService,
    private readonly sitesService: SitesService,
    private readonly anomalyEmailService: AnomalyEmailService,
    private readonly dailyReportService: DailyReportService,
    private readonly mlPredictionClient: MLPredictionClientService,
  ) {}

  /** Même contrat que StockPredictionService pour le front (Materials.tsx, PredictionsList). */
  private mapMlPredictionToClientFormat(
    material: Material,
    ml: MLPredictionResult,
  ): StockPredictionResult {
    // S'assurer que toutes les valeurs sont définies et valides
    const consumptionRate = ml.consumptionRate ?? 0;
    const hoursToOutOfStock = ml.hoursToOutOfStock ?? 999;
    const hoursToLowStock = ml.hoursToLowStock ?? 999;
    const currentStock = material.quantity ?? 0;
    const predictedStock = ml.predictedStock ?? currentStock;
    
    const recommendedOrderQuantity =
      ml.recommendedOrderQuantity ??
      Math.max(
        0,
        Math.ceil(
          consumptionRate * 48 +
            (material.stockMinimum ?? material.minimumStock ?? 0) -
            currentStock,
        ),
      );

    return {
      materialId: ml.materialId,
      materialName: material.name,
      currentStock,
      predictedStock,
      consumptionRate,
      minimumStock: material.minimumStock || 0,
      maximumStock: material.maximumStock || currentStock * 2,
      reorderPoint: material.stockMinimum || material.minimumStock || 0,
      hoursToLowStock,
      hoursToOutOfStock,
      status: ml.status,
      recommendedOrderQuantity,
      predictionModelUsed: true,
      confidence: ml.confidence ?? 0.5,
      simulationData: [],
      message: ml.message || 'Prédiction ML',
    };
  }

  @Post()
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto, null);
  }

  @Get()
  async findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.materialsService.getDashboardStats();
  }

  @Get('alerts')
  async getAlerts(): Promise<StockAlert[]> {
    return this.materialsService.getStockAlerts();
  }

  @Get('predictions')
  async getPredictions() {
    return this.materialsService.getPredictionsForAllMaterials();
  }

  @Get('forecast/:id')
  async getForecast(@Param('id') id: string): Promise<MaterialForecast> {
    return this.materialsService.generateForecast(id);
  }

  @Get('movements/:id')
  async getMovements(@Param('id') id: string) {
    return this.materialsService.getStockMovements(id);
  }

  @Get('low-stock')
  async getLowStock() {
    return this.materialsService.getLowStockMaterials();
  }

  @Get('with-sites')
  async getMaterialsWithSites() {
    return this.materialsService.getMaterialsWithSiteInfo();
  }

  @Get('expiring')
  async getExpiringMaterials(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.materialsService.getExpiringMaterials(daysAhead);
  }

  // ========== WEATHER ENDPOINT ==========
  @Get('weather')
  async getWeatherByCoordinates(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    try {
      if (!lat || !lng) {
        throw new BadRequestException('Coordonnées GPS manquantes (lat, lng)');
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new BadRequestException('Coordonnées GPS invalides');
      }

      // Appeler directement l'API OpenWeatherMap
      const axios = require('axios');
      const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

      if (!OPENWEATHER_API_KEY) {
        this.logger.warn('⚠️ Clé API météo non configurée');
        return {
          success: false,
          weather: null,
          message: 'Clé API météo non configurée',
        };
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`;

      this.logger.log(
        `🌍 Fetching weather for coordinates: ${latitude}, ${longitude}`,
      );
      const response = await axios.get(url, { timeout: 5000 });

      if (!response?.data) {
        return { success: false, weather: null };
      }

      const weatherData = {
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        humidity: response.data.main.humidity,
        windSpeed: Math.round(response.data.wind.speed * 3.6), // m/s → km/h
        cityName: response.data.name,
        condition: this.mapWeatherCondition(response.data.weather[0].id),
      };

      this.logger.log(
        `✅ Weather fetched for coordinates (${latitude}, ${longitude}): ${weatherData.temperature}°C`,
      );
      return { success: true, weather: weatherData };
    } catch (error) {
      this.logger.error(`❌ Weather fetch failed: ${error.message}`);
      return { success: false, weather: null, error: error.message };
    }
  }

  private mapWeatherCondition(weatherId: number): string {
    if (weatherId >= 200 && weatherId < 300) return 'stormy';
    if (weatherId >= 300 && weatherId < 600) return 'rainy';
    if (weatherId >= 600 && weatherId < 700) return 'snowy';
    if (weatherId >= 700 && weatherId < 800) return 'windy';
    if (weatherId === 800) return 'sunny';
    if (weatherId > 800) return 'cloudy';
    return 'cloudy';
  }

  // ========== AI STOCK PREDICTION ==========
  @Get(['prediction/all', 'predictions/all'])
  async getAllPredictions() {
    const materials = await this.materialsService.findAll({ limit: 100 });
    const materialList = Array.isArray(materials)
      ? materials
      : (materials as any).data || [];

    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`🔮 [MATERIALS-SERVICE] PREDICTIONS REQUEST`);
    this.logger.log(`${'='.repeat(80)}`);
    this.logger.log(`📊 Total Materials: ${materialList.length}`);

    // Check if FastAPI ML service is available
    const mlServiceAvailable = await this.mlPredictionClient.isServiceAvailable();
    
    if (mlServiceAvailable) {
      this.logger.log('✅ FastAPI ML Service: AVAILABLE');
      this.logger.log('🤖 Using FastAPI for ML predictions...\n');
      
      const predictions = await Promise.all(
        materialList.map(async (material: any, index: number) => {
          try {
            this.logger.log(`\n[${index + 1}/${materialList.length}] Processing: ${material.name}`);
            
            // Call FastAPI for ML prediction
            const mlPrediction = await this.mlPredictionClient.predictStockDepletion({
              material_id: material._id.toString(),
              material_name: material.name,
              current_stock: material.quantity || 0,
              minimum_stock: material.minimumStock || material.stockMinimum || 0,
              consumption_rate: material.consumptionRate || 1,
              days_to_predict: 7,
            });

            this.logger.log(`   ✅ FastAPI Response: ${mlPrediction.days_until_stockout} days (${mlPrediction.status})`);

            // Convert FastAPI response to frontend format
            return {
              materialId: mlPrediction.material_id,
              materialName: mlPrediction.material_name,
              currentStock: mlPrediction.current_stock,
              predictedStock: mlPrediction.predicted_stock_in_days,
              consumptionRate: material.consumptionRate || 1,
              minimumStock: material.minimumStock || 0,
              maximumStock: material.maximumStock || material.quantity * 2,
              reorderPoint: material.stockMinimum || material.minimumStock || 0,
              hoursToLowStock: mlPrediction.days_until_stockout ? mlPrediction.days_until_stockout * 24 : 999,
              hoursToOutOfStock: mlPrediction.days_until_stockout ? mlPrediction.days_until_stockout * 24 : 999,
              status: mlPrediction.status === 'critical' ? 'critical' : mlPrediction.status === 'warning' ? 'warning' : 'safe',
              recommendedOrderQuantity: mlPrediction.recommended_order_quantity,
              predictionModelUsed: true,
              confidence: mlPrediction.confidence,
              simulationData: [],
              message: mlPrediction.message,
            };
          } catch (error) {
            this.logger.error(
              `   ❌ FastAPI Error for ${material.name}: ${error.message}`,
            );
            return null;
          }
        }),
      );

      const validPredictions = predictions.filter((p) => p !== null);
      this.logger.log(`\n${'='.repeat(80)}`);
      this.logger.log(`✅ [MATERIALS-SERVICE] PREDICTIONS COMPLETE`);
      this.logger.log(`   ├─ Total Requested: ${materialList.length}`);
      this.logger.log(`   ├─ Successful: ${validPredictions.length}`);
      this.logger.log(`   ├─ Failed: ${materialList.length - validPredictions.length}`);
      this.logger.log(`   └─ Source: FastAPI ML Service (Port 8000)`);
      this.logger.log(`${'='.repeat(80)}\n`);
      
      return validPredictions;
    } else {
      // Fallback to standard prediction service
      this.logger.warn('⚠️  FastAPI ML Service: NOT AVAILABLE');
      this.logger.warn('🔄 Falling back to standard prediction service...\n');
      
      const predictions = await Promise.all(
        materialList.map(async (material: any) => {
          try {
            const prediction = await this.predictionService.predictStockDepletion(
              material._id.toString(),
              material.name,
              material.quantity,
              material.minimumStock || 0,
              material.maximumStock || material.quantity * 2,
              material.stockMinimum || material.minimumStock || 0,
              material.consumptionRate || 0,
            );
            
            return prediction;
          } catch (error) {
            this.logger.error(
              `❌ Erreur prédiction ${material.name}: ${error.message}`,
            );
            return null;
          }
        }),
      );

      const validPredictions = predictions.filter((p) => p !== null);
      this.logger.log(`\n✅ ${validPredictions.length} prédictions standard générées avec succès\n`);
      
      return validPredictions;
    }
  }

  @Get(':id/prediction')
  async getStockPrediction(@Param('id') id: string) {
    const material = await this.materialsService.findOne(id);

    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    // Utiliser le service de prédiction standard
    return this.predictionService.predictStockDepletion(
      material._id.toString(),
      material.name,
      material.quantity,
      material.minimumStock,
      material.maximumStock,
      material.stockMinimum,
      material.consumptionRate || 1,
    );
  }

  @Get('auto-order/recommendations')
  async getAutoOrderRecommendations(@Query('siteId') siteId?: string) {
    return this.intelligentRecommendationService.getAllAutoOrderMaterials(
      siteId,
    );
  }

  @Get(':id/auto-order')
  async checkAutoOrder(@Param('id') id: string) {
    return this.intelligentRecommendationService.checkAutoOrderNeeded(id);
  }

  @Get('sites')
  async getSites() {
    try {
      this.logger.log(
        '🏗️ Récupération des sites depuis MongoDB smartsite/sites',
      );
      const sites = await this.sitesService.findAll();

      return {
        success: true,
        data: sites,
        count: sites.length,
        message: `${sites.length} sites trouvés`,
        source: 'MongoDB smartsite/sites',
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des sites:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des sites',
        data: [],
        count: 0,
        error: error.message,
      };
    }
  }

  @Get('sites/test')
  async testSitesConnection(): Promise<any> {
    try {
      this.logger.log('🧪 Test de connexion aux sites MongoDB...');
      const count = await this.sitesService.getSiteCount();
      const sites = await this.sitesService.findAll();

      return {
        success: true,
        message: 'Connexion MongoDB sites OK',
        data: {
          database: 'smartsite',
          collection: 'sites',
          totalSites: count,
          sitesFound: sites.length,
          sites: sites.slice(0, 3).map((s) => ({
            _id: s._id,
            nom: s.nom,
            ville: s.localisation,
            coordonnees: s.coordinates,
          })),
        },
      };
    } catch (error) {
      this.logger.error('❌ Erreur test sites:', error);
      return {
        success: false,
        message: 'Erreur de connexion MongoDB sites',
        error: error.message,
      };
    }
  }

  @Get('sites/:id')
  async getSiteById(@Param('id') id: string) {
    try {
      this.logger.log(`🔍 Récupération du site ${id}`);
      const site = await this.sitesService.findOne(id);

      if (!site) {
        this.logger.warn(`⚠️ Site ${id} non trouvé`);
        return {
          success: false,
          message: 'Site non trouvé',
          data: null,
        };
      }

      this.logger.log(`✅ Site trouvé: ${site.nom}`);
      return site;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération site ${id}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du site',
        error: error.message,
        data: null,
      };
    }
  }
  @Get('suppliers/test')
  async testSuppliersConnection(): Promise<any> {
    try {
      this.logger.log('🧪 Test de connexion aux fournisseurs MongoDB...');
      const count =
        await this.intelligentRecommendationService.suppliersService.getSupplierCount();
      const suppliers =
        await this.intelligentRecommendationService.suppliersService.findAll();

      return {
        success: true,
        message: 'Connexion MongoDB fournisseurs OK',
        data: {
          database: 'smartsite-fournisseurs',
          collection: 'fournisseurs',
          totalSuppliers: count,
          suppliersFound: suppliers.length,
          suppliers: suppliers.slice(0, 3).map((s) => ({
            _id: s._id,
            nom: s.nom,
            ville: s.ville,
            specialites: s.specialites,
            delaiLivraison: s.delaiLivraison,
            evaluation: s.evaluation,
          })),
        },
      };
    } catch (error) {
      this.logger.error('❌ Erreur test fournisseurs:', error);
      return {
        success: false,
        message: 'Erreur de connexion MongoDB fournisseurs',
        error: error.message,
      };
    }
  }

  @Post('email/test')
  async testEmailAlert(
    @Body() testData?: { email?: string; materialName?: string },
  ): Promise<any> {
    try {
      this.logger.log("📧 Test d'envoi d'email d'alerte...");

      const testEmail =
        testData?.email || process.env.ADMIN_EMAIL || 'kacey8@ethereal.email';
      const materialName = testData?.materialName || 'Ciment Portland (Test)';

      await this.anomalyEmailService.sendStockAnomalyAlert({
        toEmail: testEmail,
        userName: 'Utilisateur Test',
        siteName: 'Chantier Test - Site Nord',
        materialName: materialName,
        materialCode: 'TEST001',
        flowType: 'OUT',
        quantity: 150,
        anomalyType: AnomalyType.EXCESSIVE_OUT,
        anomalyMessage:
          'Sortie excessive détectée : 150 unités sorties alors que la consommation normale est de 50 unités/jour. Risque de vol ou gaspillage.',
        currentStock: 50,
        previousStock: 200,
        expectedQuantity: 50,
        deviationPercent: 200,
        timestamp: new Date(),
        reason: "Test de l'envoi d'email d'alerte pour anomalie de stock",
      });

      this.logger.log(`✅ Email de test envoyé à ${testEmail}`);

      return {
        success: true,
        message: `Email de test envoyé avec succès à ${testEmail}`,
        info: 'Vérifiez votre boîte de réception Ethereal Email sur https://ethereal.email/messages',
        etherealUrl: 'https://ethereal.email/messages',
        credentials: {
          username: process.env.EMAIL_USER,
          note: "Connectez-vous sur https://ethereal.email avec ces identifiants pour voir l'email",
        },
      };
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'envoi de l'email de test:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email de test",
        error: error.message,
      };
    }
  }

  @Get('suppliers')
  async getAllSuppliers(): Promise<any> {
    try {
      this.logger.log(
        '🏪 Récupération de tous les fournisseurs depuis MongoDB',
      );

      const suppliers =
        await this.intelligentRecommendationService.suppliersService.findAll();

      this.logger.log(
        `✅ ${suppliers.length} fournisseurs trouvés depuis MongoDB`,
      );

      return {
        success: true,
        data: suppliers,
        count: suppliers.length,
        message: `${suppliers.length} fournisseurs trouvés`,
        source: 'MongoDB smartsite-fournisseurs',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération des fournisseurs:`,
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la récupération des fournisseurs',
        data: [],
        count: 0,
        error: error.message,
      };
    }
  }

  @Get(':id/suppliers')
  async getSupplierSuggestions(
    @Param('id') materialId: string,
    @Query('siteLatitude') siteLatitude?: string,
    @Query('siteLongitude') siteLongitude?: string,
    @Query('siteId') siteId?: string,
  ) {
    try {
      this.logger.log(
        `🏪 Récupération des fournisseurs recommandés pour matériau ${materialId}`,
      );

      let siteCoordinates: { latitude: number; longitude: number } | undefined;

      // Récupérer les coordonnées du site si siteId est fourni
      if (siteId && !siteLatitude && !siteLongitude) {
        try {
          const site = await this.sitesService.findOne(siteId);
          if (site?.coordinates?.lat && site?.coordinates?.lng) {
            siteCoordinates = {
              latitude: site.coordinates.lat,
              longitude: site.coordinates.lng,
            };
            this.logger.log(
              `📍 Coordonnées du site ${siteId}: ${siteCoordinates.latitude}, ${siteCoordinates.longitude}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Impossible de récupérer les coordonnées du site ${siteId}:`,
            error.message,
          );
        }
      }

      // Récupérer les coordonnées du site si disponibles en paramètres
      if (siteLatitude && siteLongitude) {
        const lat = parseFloat(siteLatitude);
        const lon = parseFloat(siteLongitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          siteCoordinates = { latitude: lat, longitude: lon };
          this.logger.log(
            `📍 Coordonnées du site (paramètres): ${lat}, ${lon}`,
          );
        }
      }

      // Récupérer les suggestions de fournisseurs depuis MongoDB
      const suppliers =
        await this.intelligentRecommendationService.suggestSuppliers(
          materialId,
          siteCoordinates,
        );

      this.logger.log(
        `✅ ${suppliers.length} fournisseurs recommandés trouvés depuis MongoDB`,
      );

      return {
        success: true,
        data: suppliers,
        count: suppliers.length,
        message: `${suppliers.length} fournisseurs recommandés trouvés`,
        source: 'MongoDB smartsite-fournisseurs',
        materialId: materialId,
        siteCoordinates: siteCoordinates,
        sortedBy: siteCoordinates ? 'distance' : 'evaluation',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération des fournisseurs recommandés:`,
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la récupération des fournisseurs recommandés',
        data: [],
        count: 0,
        error: error.message,
        materialId: materialId,
      };
    }
  }

  @Post('reports/daily/send')
  async sendDailyReport(@Body() body?: { email?: string }): Promise<any> {
    try {
      console.log('🔵 [DAILY REPORT] Début de la requête');
      console.log('🔵 [DAILY REPORT] Body reçu:', JSON.stringify(body));
      
      this.logger.log('📊 Déclenchement manuel du rapport quotidien...');

      if (!body?.email) {
        console.log('🔴 [DAILY REPORT] Email manquant dans le body');
        return {
          success: false,
          message: 'Email de destination requis',
          timestamp: new Date().toISOString(),
        };
      }

      // Validation basique de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        console.log('🔴 [DAILY REPORT] Format email invalide:', body.email);
        return {
          success: false,
          message: 'Format d\'email invalide',
          timestamp: new Date().toISOString(),
        };
      }

      console.log('🟢 [DAILY REPORT] Email valide:', body.email);
      console.log('🔵 [DAILY REPORT] Appel du service sendManualReport...');

      const result = await this.dailyReportService.sendManualReport(
        body.email,
      );

      console.log('🔵 [DAILY REPORT] Résultat du service:', JSON.stringify(result));

      if (result.success) {
        console.log('🟢 [DAILY REPORT] Succès:', result.message);
        this.logger.log(`✅ ${result.message}`);
        return {
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        };
      } else {
        console.log('🔴 [DAILY REPORT] Échec:', result.message);
        this.logger.error(`❌ ${result.message}`);
        return {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.log('🔴 [DAILY REPORT] Exception capturée:', error);
      console.log('🔴 [DAILY REPORT] Error message:', error.message);
      console.log('🔴 [DAILY REPORT] Error stack:', error.stack);
      
      this.logger.error(
        "❌ Erreur lors de l'envoi du rapport quotidien:",
        error,
      );
      return {
        success: false,
        message: `Erreur lors de l'envoi du rapport: ${error.message}`,
        error: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== ML TRAINING & PREDICTION ENDPOINTS ==========
  
  @Get('ml/status')
  async getMLStatus(): Promise<any> {
    return {
      success: true,
      trainedModels: this.autoMLService.getTrainedModelsCount(),
      message: `${this.autoMLService.getTrainedModelsCount()} modèles ML entraînés`,
    };
  }

  @Get('anomalies/detect')
  async detectAnomalies(): Promise<any> {
    try {
      this.logger.log('\n🔍 [MATERIALS-SERVICE] ANOMALY DETECTION REQUEST');
      this.logger.log('='.repeat(80));

      // Get all materials
      const materials = await this.materialsService.findAll({ limit: 1000 });
      const materialList = Array.isArray(materials)
        ? materials
        : (materials as any).data || [];

      this.logger.log(`📊 Total Materials: ${materialList.length}`);

      // Check if FastAPI ML service is available
      const mlServiceAvailable = await this.mlPredictionClient.isServiceAvailable();

      if (!mlServiceAvailable) {
        this.logger.warn('⚠️ FastAPI ML Service not available');
        return {
          success: false,
          message: 'ML Service not available',
          theft_risk: [],
          waste_risk: [],
          over_consumption: [],
        };
      }

      this.logger.log('✅ FastAPI ML Service: AVAILABLE');
      this.logger.log('🤖 Calculating consumption statistics from dataset...\n');

      // Read anomaly-detection.csv to get consumption statistics
      const fs = require('fs');
      const path = require('path');
      const csvParser = require('csv-parser');
      
      const csvPath = path.join(process.cwd(), 'anomaly-detection.csv');
      
      if (!fs.existsSync(csvPath)) {
        this.logger.warn('⚠️ anomaly-detection.csv not found');
        return {
          success: false,
          message: 'Dataset not found',
          theft_risk: [],
          waste_risk: [],
          over_consumption: [],
        };
      }

      // Parse CSV and calculate statistics per material NAME (not ID)
      const materialStats = new Map<string, { 
        expectedSum: number; 
        actualSum: number; 
        count: number;
        materialId: string;
      }>();

      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csvParser())
          .on('data', (row: any) => {
            const materialName = (row.materialName || row.material_name || '').trim();
            const expected = parseFloat(row.expectedConsumption || row.expected_consumption || 0);
            const actual = parseFloat(row.actualConsumption || row.actual_consumption || 0);
            
            if (materialName && !isNaN(expected) && !isNaN(actual)) {
              if (!materialStats.has(materialName)) {
                materialStats.set(materialName, { 
                  expectedSum: 0, 
                  actualSum: 0, 
                  count: 0,
                  materialId: row.materialId || row.material_id || ''
                });
              }
              const stats = materialStats.get(materialName)!;
              stats.expectedSum += expected;
              stats.actualSum += actual;
              stats.count += 1;
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      this.logger.log(`📊 Loaded consumption data for ${materialStats.size} materials from CSV`);

      // Prepare materials data for anomaly detection
      const materialsData: Array<{
        material_id: string;
        material_name: string;
        current_consumption: number;
        average_consumption: number;
        std_consumption: number;
        site_id: string | null;
        site_name: string | null;
      }> = [];
      
      for (const material of materialList) {
        // Match by material name (case insensitive)
        const materialName = material.name.trim();
        let stats = materialStats.get(materialName);
        
        // Try case-insensitive match if exact match fails
        if (!stats) {
          for (const [name, data] of materialStats.entries()) {
            if (name.toLowerCase() === materialName.toLowerCase()) {
              stats = data;
              break;
            }
          }
        }
        
        if (stats && stats.count > 0) {
          const avgExpected = stats.expectedSum / stats.count;
          const avgActual = stats.actualSum / stats.count;
          const stdDev = avgExpected * 0.2; // Estimate std as 20% of average
          
          materialsData.push({
            material_id: material._id.toString(),
            material_name: material.name,
            current_consumption: avgActual,
            average_consumption: avgExpected,
            std_consumption: stdDev,
            site_id: material.siteId || null,
            site_name: material.siteName || null,
          });
        }
      }

      if (materialsData.length === 0) {
        this.logger.warn('⚠️ No materials with consumption data found in CSV');
        return {
          success: true,
          total_materials: 0,
          anomalies_detected: 0,
          theft_risk: [],
          waste_risk: [],
          over_consumption: [],
        };
      }

      this.logger.log(`📊 Prepared ${materialsData.length} materials for anomaly detection`);

      // Call FastAPI for batch anomaly detection
      const axios = require('axios');
      const ML_SERVICE_URL = process.env.ML_PREDICTION_SERVICE_URL || 'http://localhost:8000';

      const response = await axios.post(
        `${ML_SERVICE_URL}/detect/batch-anomalies`,
        { materials: materialsData },
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const result = response.data;

      this.logger.log('\n📊 [MATERIALS-SERVICE] ANOMALY DETECTION RESULTS:');
      this.logger.log(`   ├─ Total Analyzed: ${result.total_materials}`);
      this.logger.log(`   ├─ Anomalies Detected: ${result.anomalies_detected}`);
      this.logger.log(`   ├─ Theft Risk: ${result.theft_risk.length}`);
      this.logger.log(`   ├─ Waste Risk: ${result.waste_risk.length}`);
      this.logger.log(`   ├─ Over Consumption: ${result.over_consumption.length}`);
      this.logger.log(`   └─ Normal: ${result.normal.length}`);
      this.logger.log('='.repeat(80) + '\n');

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error(`❌ Error detecting anomalies: ${error.message}`);
      this.logger.error(error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`,
        theft_risk: [],
        waste_risk: [],
        over_consumption: [],
      };
    }
  }

  @Post('ml/retrain')
  async retrainAllModels(): Promise<any> {
    try {
      this.logger.log('🔄 Réentraînement de tous les modèles ML...');
      await this.autoMLService.retrainAll();
      return {
        success: true,
        trainedModels: this.autoMLService.getTrainedModelsCount(),
        message: 'Tous les modèles ont été réentraînés avec succès',
      };
    } catch (error) {
      this.logger.error(`❌ Erreur réentraînement: ${error.message}`);
      return {
        success: false,
        message: `Erreur lors du réentraînement: ${error.message}`,
      };
    }
  }

  @Post('ml/upload-dataset')
  @UseInterceptors(FileInterceptor('dataset'))
  async uploadDataset(
    @UploadedFile() file: Express.Multer.File,
    @Body('materialId') materialId: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Fichier CSV requis');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Format non supporté. Utilisez un fichier CSV.');
    }

    try {
      // Sauvegarder le fichier
      const uploadsDir = 'uploads/datasets';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `dataset-${materialId}-${Date.now()}.csv`;
      const filepath = `${uploadsDir}/${filename}`;
      fs.writeFileSync(filepath, file.buffer);

      this.logger.log(`📁 Dataset uploadé: ${filepath}`);

      return {
        success: true,
        datasetPath: filepath,
        filename,
        size: file.size,
        message: 'Dataset uploadé avec succès',
      };
    } catch (error) {
      this.logger.error(`❌ Erreur upload dataset: ${error.message}`);
      throw new BadRequestException(
        error.message || 'Erreur lors de l\'upload du dataset',
      );
    }
  }

  @Post('ml/train')
  async trainModel(
    @Body() body: { materialId: string; datasetPath: string },
  ): Promise<any> {
    try {
      this.logger.log(`🤖 Entraînement ML pour matériau ${body.materialId}`);

      const result = await this.mlTrainingService.trainModel(
        body.materialId,
        body.datasetPath,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur entraînement: ${error.message}`);
      throw new BadRequestException(
        error.message || 'Erreur lors de l\'entraînement',
      );
    }
  }

  @Post('ml/predict')
  async predictWithModel(
    @Body() body: { materialId: string; modelPath: string },
  ): Promise<any> {
    try {
      this.logger.log(`🔮 Prédiction ML pour matériau ${body.materialId}`);

      // Récupérer le matériau
      const material = await this.materialsService.findOne(body.materialId);
      if (!material) {
        throw new BadRequestException('Matériau non trouvé');
      }

      const result = await this.mlTrainingService.predict(
        body.materialId,
        material.name,
        material.quantity,
        material.minimumStock || material.stockMinimum || 0,
        body.modelPath,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur prédiction: ${error.message}`);
      throw new BadRequestException(
        error.message || 'Erreur lors de la prédiction',
      );
    }
  }

  @Get('ml/model-info/:id')
  async getModelInfo(@Param('id') materialId: string): Promise<any> {
    try {
      this.logger.log(`🔍 Getting model info for material ${materialId}`);
      
      const material = await this.materialsService.findOne(materialId);
      if (!material) {
        throw new BadRequestException('Material not found');
      }

      // ✅ FIX: Use hasModel() instead of isModelTrained()
      const modelTrained = this.autoMLService.hasModel(materialId);
      
      // For now, assume historical data exists if material exists
      const hasHistoricalData = true;
      
      return {
        success: true,
        materialId,
        materialName: material.name,
        modelTrained,
        hasHistoricalData,
        message: modelTrained 
          ? 'Model is trained and ready' 
          : 'Model not trained yet. Upload historical data to train.',
      };
    } catch (error) {
      this.logger.error(`❌ Error getting model info: ${error.message}`);
      return {
        success: false,
        materialId,
        modelTrained: false,
        hasHistoricalData: false,
        error: error.message,
      };
    }
  }

  // ========== DYNAMIC ROUTES (MUST BE LAST) ==========
  // Ces routes doivent être placées APRÈS toutes les routes spécifiques
  // pour éviter les conflits (ex: /materials/sites/:id capturé par /materials/:id)

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto, null);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.materialsService.updateStock(id, updateStockDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.materialsService.remove(id);
  }

  @Post(':id/reorder')
  async reorder(@Param('id') id: string) {
    return this.materialsService.reorderMaterial(id, null);
  }

  @Get('search/barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.materialsService.findByBarcode(barcode);
  }

  @Get('search/qrcode/:qrCode')
  async findByQRCode(@Param('qrCode') qrCode: string) {
    return this.materialsService.findByQRCode(qrCode);
  }

  @Post('bulk')
  async bulkCreate(@Body() materials: CreateMaterialDto[]) {
    return this.materialsService.bulkCreate(materials, null);
  }

  @Post('scan-qr')
  @UseInterceptors(FileInterceptor('image'))
  async scanQRCode(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<QRScanResult> {
    if (!file) {
      throw new BadRequestException('Image requise pour le scan QR');
    }

    try {
      const qrData = await QRScannerUtil.scanFromImage(file.path);
      console.log('📸 QR Data scanné:', qrData);

      const parsedData = QRScannerUtil.parseQRData(qrData);
      console.log('📦 Données parsées:', parsedData);

      let material: Material | null = null;

      if (parsedData.id) {
        try {
          material = await this.materialsService.findOne(parsedData.id);
          console.log('✅ Matériau trouvé par ID:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par ID:', parsedData.id);
        }
      }

      if (!material && parsedData.code) {
        try {
          material = await this.materialsService.findByCode(parsedData.code);
          console.log('✅ Matériau trouvé par code:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par code:', parsedData.code);
        }
      }

      if (!material) {
        try {
          material = await this.materialsService.findByQRCode(qrData);
          console.log('✅ Matériau trouvé par QR code complet');
        } catch (error) {
          console.log('❌ Matériau non trouvé par QR code complet');
        }
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        qrData,
        material,
      };
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.error('❌ Erreur scan QR:', error);
      throw new BadRequestException(`Erreur scan QR: ${error.message}`);
    }
  }

  @Post('scan-qr-text')
  async scanQRCodeText(@Body() scanDto: ScanQRDto): Promise<QRScanResult> {
    if (!scanDto.qrCode) {
      throw new BadRequestException('QR code text requis');
    }

    const parsedData = QRScannerUtil.parseQRData(scanDto.qrCode);
    console.log('📦 Données parsées (texte):', parsedData);

    let material: Material | null = null;

    if (parsedData.id) {
      try {
        material = await this.materialsService.findOne(parsedData.id);
      } catch (error) {
        console.log('Matériau non trouvé par ID:', error.message);
      }
    }

    if (!material && parsedData.code) {
      try {
        material = await this.materialsService.findByCode(parsedData.code);
      } catch (error) {
        console.log('Matériau non trouvé par code:', error.message);
      }
    }

    if (!material) {
      try {
        material = await this.materialsService.findByQRCode(scanDto.qrCode);
      } catch (error) {
        console.log('Matériau non trouvé par QR code:', error.message);
      }
    }

    return {
      success: true,
      qrData: scanDto.qrCode,
      material,
    };
  }

  @Post(':id/generate-qr')
  async generateQRCode(@Param('id') id: string) {
    return this.materialsService.generateQRCode(id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image requise');
    }

    const imageUrl = `/uploads/materials/${file.filename}`;
    return this.materialsService.addImage(id, imageUrl);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fichier Excel requis');
    }

    try {
      const result = await this.materialsService.importFromExcel(file.path);

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return result;
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(`Erreur import Excel: ${error.message}`);
    }
  }

  @Post('export/excel')
  async exportToExcel(@Res() res: Response, @Body() materialIds?: string[]) {
    const result = await this.materialsService.exportToExcel(materialIds);

    if (!result || !result.filePath) {
      throw new BadRequestException('Erreur export Excel');
    }

    return res.download(result.filePath, result.filename);
  }

  /*@Post('export/pdf')
  async exportToPDF(@Body() materialIds?: string[]) {
    return this.materialsService.exportToPDF(materialIds);
  }*/
  @Post('export/pdf')
  async exportToPDF(@Res() res: Response, @Body() materialIds?: string[]) {
    try {
      const result = await this.materialsService.exportToPDF(materialIds);

      if (!result || !result.filePath) {
        throw new BadRequestException('Erreur génération PDF');
      }

      const { filePath, filename } = result;

      return res.download(filePath, filename);
    } catch (error) {
      console.error('❌ Export PDF error:', error);
      throw new BadRequestException(error.message);
    }
  }

  // ========== CONSUMPTION HISTORY ENDPOINTS (MUST BE BEFORE :id ROUTES) ==========
  @Get('consumption-history/export')
  async exportConsumptionHistory(
    @Query('materialId') materialId?: string,
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Res() res?: Response,
  ) {
    try {
      if (!res) {
        throw new BadRequestException('Response object is required');
      }

      const query: any = {};

      if (materialId) query.materialId = materialId;
      if (siteId) query.siteId = siteId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const entries = await this.materialsService.getConsumptionHistory(query);

      // Créer un fichier Excel
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historique Consommation');

      // En-têtes
      worksheet.columns = [
        { header: 'Date', key: 'timestamp', width: 20 },
        { header: 'Matériau', key: 'materialName', width: 30 },
        { header: 'Code', key: 'materialCode', width: 15 },
        { header: 'Site', key: 'siteName', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Quantité', key: 'quantity', width: 12 },
        { header: 'Utilisateur', key: 'userName', width: 20 },
        { header: 'Raison', key: 'reason', width: 30 },
        { header: 'Notes', key: 'notes', width: 40 },
      ];

      // Données
      entries.forEach((entry: any) => {
        worksheet.addRow({
          timestamp: new Date(
            entry.timestamp || entry.createdAt,
          ).toLocaleString('fr-FR'),
          materialName: entry.materialName,
          materialCode: entry.materialCode,
          siteName: entry.siteName,
          type: entry.type,
          quantity: entry.quantity,
          userName: entry.userName || '-',
          reason: entry.reason || '-',
          notes: entry.notes || '-',
        });
      });

      // Style
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Générer le buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique_consommation_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (error) {
      this.logger.error(`❌ Export failed: ${error.message}`);
      if (res) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  @Get('consumption-history')
  async getConsumptionHistory(
    @Query('materialId') materialId?: string,
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    try {
      const query: any = {};

      if (materialId) query.materialId = materialId;
      if (siteId) query.siteId = siteId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Récupérer les entrées d'historique depuis le service
      const entries = await this.materialsService.getConsumptionHistory(query);

      return {
        success: true,
        entries,
        total: entries.length,
      };
    } catch (error) {
      this.logger.error(
        `❌ Consumption history fetch failed: ${error.message}`,
      );
      return {
        success: false,
        entries: [],
        error: error.message,
      };
    }
  }

  // ========== DYNAMIC ROUTES (MUST BE LAST) ==========
  // Ces routes doivent être placées APRÈS toutes les routes spécifiques
  // pour éviter les conflits (ex: /materials/sites/:id capturé par /materials/:id)
}
