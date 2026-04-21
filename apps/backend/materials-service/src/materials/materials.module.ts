import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { MaterialsController } from './materials.controller';
import { QRCodeController } from './qrcode.controller';
import { OrdersController } from './orders.controller';
import { SiteMaterialsController } from './site-materials.controller';
import { SiteConsumptionController } from './controllers/site-consumption.controller';
import { ConsumptionController } from './controllers/consumption.controller';
import { MaterialFlowController } from './controllers/material-flow.controller';
import { MaterialsService } from './materials.service';
import { OrdersService } from './services/orders.service';
import { SiteMaterialsService } from './services/site-materials.service';
import { ImportExportService } from './services/import-export.service';
import { SiteConsumptionService } from './services/site-consumption.service';
import { ConsumptionAnomalyService } from './services/consumption-anomaly.service';
import { MaterialFlowService } from './services/material-flow.service';
import { MaterialsGateway } from './materials.gateway';
import { StockPredictionService } from './services/stock-prediction.service';
import { MLTrainingService } from './services/ml-training.service';
import { IntelligentRecommendationService } from './services/intelligent-recommendation.service';
import { SmartScoreService } from './services/smart-score.service';
import { Material, MaterialSchema } from './entities/material.entity';
import { MaterialOrder, MaterialOrderSchema } from './entities/material-order.entity';
import { MaterialRequirement, MaterialRequirementSchema } from './entities/material-requirement.entity';
import { DailyConsumptionLog, DailyConsumptionLogSchema } from './entities/daily-consumption.entity';
import { MaterialFlowLog, MaterialFlowLogSchema } from './entities/material-flow-log.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { ChatModule } from '../chat/chat.module';
import { WebSocketService } from './services/websocket.service';
import { AnomalyEmailService } from '../common/email/anomaly-email.service';

import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI') || 'mongodb://localhost:27017/smartsite-materials',
      }),
    }),
    
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: MaterialOrder.name, schema: MaterialOrderSchema },
      { name: MaterialRequirement.name, schema: MaterialRequirementSchema },
      { name: DailyConsumptionLog.name, schema: DailyConsumptionLogSchema },
      { name: MaterialFlowLog.name, schema: MaterialFlowLogSchema },
    ]),
    
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
    CacheModule.register({ ttl: 300, max: 1000, isGlobal: true }),
    ScheduleModule.forRoot(),

    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          let uploadPath = './uploads';
          if (file.fieldname === 'file') {
            uploadPath = './uploads/imports';
          } else {
            uploadPath = './uploads/qrcodes';
          }
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),

    ChatModule,
    PaymentModule,
  ],
  controllers: [
    MaterialsController, 
    QRCodeController, 
    OrdersController, 
    SiteMaterialsController,
    SiteConsumptionController,
    ConsumptionController,
    MaterialFlowController,
  ],
  providers: [
    MaterialsService,
    OrdersService,
    SiteMaterialsService,
    ImportExportService,
    SiteConsumptionService,
    ConsumptionAnomalyService,
    MaterialFlowService,
    MaterialsGateway,
    StockPredictionService,
    MLTrainingService,
    IntelligentRecommendationService,
    SmartScoreService,
    WebSocketService,
    AnomalyEmailService,
  ],
  exports: [
    MaterialsService, 
    OrdersService, 
    SiteMaterialsService, 
    ImportExportService, 
    SiteConsumptionService,
    ConsumptionAnomalyService,
    MaterialFlowService,
    StockPredictionService, 
    MLTrainingService, 
    IntelligentRecommendationService,
    SmartScoreService,
    WebSocketService,
    AnomalyEmailService,
  ],
})
export class MaterialsModule {}