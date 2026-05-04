import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StockPredictionRequest {
  material_id: string;
  material_name: string;
  current_stock: number;
  minimum_stock: number;
  consumption_rate: number;
  days_to_predict?: number;
}

export interface StockPredictionResponse {
  material_id: string;
  material_name: string;
  current_stock: number;
  predicted_stock_in_days: number;
  days_until_stockout: number | null;
  status: 'critical' | 'warning' | 'normal';
  recommended_order_quantity: number;
  confidence: number;
  message: string;
}

export interface ConsumptionAnomalyRequest {
  material_id: string;
  material_name: string;
  current_consumption: number;
  average_consumption: number;
  std_consumption: number;
  site_id?: string;
}

export interface ConsumptionAnomalyResponse {
  material_id: string;
  material_name: string;
  consumption_status: 'normal' | 'overconsumption' | 'underconsumption';
  anomaly_score: number;
  deviation_percentage: number;
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommended_action: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class MLPredictionClientService {
  private readonly logger = new Logger(MLPredictionClientService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl =
      this.configService.get<string>('ML_PREDICTION_SERVICE_URL') ||
      'http://localhost:8000';
    this.logger.log(`🤖 ML Prediction Service URL: ${this.mlServiceUrl}`);
  }

  /**
   * Check if ML service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlServiceUrl}/health`, {
          timeout: 3000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn('⚠️ ML Prediction Service is not available');
      return false;
    }
  }

  /**
   * Predict when a material will be out of stock
   */
  async predictStockDepletion(
    request: StockPredictionRequest,
  ): Promise<StockPredictionResponse> {
    try {
      this.logger.log(`\n   🔗 [HTTP] Calling FastAPI: POST ${this.mlServiceUrl}/predict/stock`);
      this.logger.log(`   📤 Request Data:`);
      this.logger.log(`      ├─ Material: ${request.material_name}`);
      this.logger.log(`      ├─ Current Stock: ${request.current_stock}`);
      this.logger.log(`      ├─ Consumption Rate: ${request.consumption_rate}/day`);
      this.logger.log(`      └─ Days to Predict: ${request.days_to_predict}`);

      const response = await firstValueFrom(
        this.httpService.post<StockPredictionResponse>(
          `${this.mlServiceUrl}/predict/stock`,
          request,
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      this.logger.log(`   📥 FastAPI Response:`);
      this.logger.log(`      ├─ Days Until Stockout: ${response.data.days_until_stockout}`);
      this.logger.log(`      ├─ Status: ${response.data.status}`);
      this.logger.log(`      └─ Confidence: ${response.data.confidence}`);

      return response.data;
    } catch (error) {
      this.logger.error(
        `   ❌ [HTTP] FastAPI call failed: ${error.message}`,
      );
      throw new Error(`ML Prediction failed: ${error.message}`);
    }
  }

  /**
   * Detect consumption anomalies
   */
  async detectConsumptionAnomaly(
    request: ConsumptionAnomalyRequest,
  ): Promise<ConsumptionAnomalyResponse> {
    try {
      this.logger.log(
        `🔍 Detecting consumption anomaly for: ${request.material_name}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<ConsumptionAnomalyResponse>(
          `${this.mlServiceUrl}/predict/consumption-anomaly`,
          request,
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      this.logger.log(
        `✅ Anomaly detection: ${response.data.consumption_status} (${response.data.severity})`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `❌ Error detecting consumption anomaly: ${error.message}`,
      );
      throw new Error(`ML Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Retrain stock prediction model
   */
  async retrainStockModel(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('🔄 Retraining stock prediction model...');

      const response = await firstValueFrom(
        this.httpService.post(`${this.mlServiceUrl}/retrain/stock`, {}, {
          timeout: 60000, // 60 seconds for training
        }),
      );

      this.logger.log('✅ Stock model retrained successfully');
      return { success: true, message: response.data.message };
    } catch (error) {
      this.logger.error(`❌ Error retraining stock model: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Retrain anomaly detection model
   */
  async retrainAnomalyModel(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('🔄 Retraining anomaly detection model...');

      const response = await firstValueFrom(
        this.httpService.post(`${this.mlServiceUrl}/retrain/anomaly`, {}, {
          timeout: 60000,
        }),
      );

      this.logger.log('✅ Anomaly model retrained successfully');
      return { success: true, message: response.data.message };
    } catch (error) {
      this.logger.error(`❌ Error retraining anomaly model: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Retrain all models
   */
  async retrainAllModels(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('🔄 Retraining all ML models...');

      const response = await firstValueFrom(
        this.httpService.post(`${this.mlServiceUrl}/retrain/all`, {}, {
          timeout: 120000, // 2 minutes
        }),
      );

      this.logger.log('✅ All models retrained successfully');
      return { success: true, message: response.data.message };
    } catch (error) {
      this.logger.error(`❌ Error retraining all models: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
