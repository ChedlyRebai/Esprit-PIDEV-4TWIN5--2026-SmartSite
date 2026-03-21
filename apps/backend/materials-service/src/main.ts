import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MaterialsModule } from './materials/materials.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config();

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
  
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
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
  console.log(`🔓 CORS: http://localhost:5173, http://localhost:3000`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log('===========================================\n');
}

bootstrap().catch((error) => {
  console.error('❌ Erreur fatale lors du démarrage:', error);
  process.exit(1);
});