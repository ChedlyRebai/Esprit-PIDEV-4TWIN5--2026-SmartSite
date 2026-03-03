import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialsGateway } from './materials.gateway';
import { Material, MaterialSchema } from './entities/material.entity';
import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI') || 'mongodb://localhost:27017/smartsite-materials',
      }),
    }),
    
    // Modèle Material
    MongooseModule.forFeature([{ name: Material.name, schema: MaterialSchema }]),
    
    // HTTP
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
    
    // Cache
    CacheModule.register({ ttl: 300, max: 1000, isGlobal: true }),
    
    // Tâches planifiées
    ScheduleModule.forRoot(),
    
    // Upload de fichiers
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = process.env.UPLOAD_PATH || './uploads/qrcodes';
          // Créer le dossier s'il n'existe pas
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `qr-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, cb) => {
        // Accepter uniquement les images
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Seules les images sont autorisées'), false);
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [MaterialsController],
  providers: [
    MaterialsService,
    MaterialsGateway,
  ],
  exports: [MaterialsService],
})
export class MaterialsModule {}