import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MaterialsModule } from './materials/materials.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config();

const logger = new Logger('Bootstrap');

function getCorsOrigins(): string[] {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const raw = process.env.CORS_ORIGIN;
  if (!raw?.trim()) {
    return defaults;
  }
  const extra = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...extra])];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MaterialsModule);
  
  const uploadsDir = join(process.cwd(), 'uploads', 'qrcodes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Dossier créé: ${uploadsDir}`);
  }
  
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  
  console.log(`📁 Dossier statique monté: ${join(process.cwd(), 'uploads')} -> /uploads/`);
  
  const corsOrigins = getCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: false,
  }));
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3002;
  
  await app.listen(port);
  
  console.log('\n🚀 Materials Service démarré avec succès !');
  console.log('===========================================');
  console.log(`✅ Service: http://localhost:${port}/api`);
  console.log(`📦 Matériaux: http://localhost:${port}/api/materials`);
  console.log(`📸 QR codes accessibles: http://localhost:${port}/uploads/qrcodes/`);
  console.log(`🔓 CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log('===========================================\n');
}

bootstrap().catch((error) => {
  console.error('❌ Erreur fatale lors du démarrage:', error);
  process.exit(1);
});