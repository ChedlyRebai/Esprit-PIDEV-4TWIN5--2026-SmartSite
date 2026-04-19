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
import { MaterialsService } from './materials.service';
import { OrdersService } from './services/orders.service';
import { SiteMaterialsService } from './services/site-materials.service';
import { ImportExportService } from './services/import-export.service';
import { MaterialsGateway } from './materials.gateway';
import { StockPredictionService } from './services/stock-prediction.service';
import { MLTrainingService } from './services/ml-training.service';
import { Material, MaterialSchema } from './entities/material.entity';
import { MaterialOrder, MaterialOrderSchema } from './entities/material-order.entity';
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
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  ],
  controllers: [MaterialsController, QRCodeController, OrdersController, SiteMaterialsController],
  providers: [
    MaterialsService,
    OrdersService,
    SiteMaterialsService,
    ImportExportService,
    MaterialsGateway,
    StockPredictionService,
    MLTrainingService,
  ],
  exports: [MaterialsService, OrdersService, SiteMaterialsService, ImportExportService, StockPredictionService, MLTrainingService],
})
export class MaterialsModule {}