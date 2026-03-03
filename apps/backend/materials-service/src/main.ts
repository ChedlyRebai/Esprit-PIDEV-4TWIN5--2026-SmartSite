import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MaterialsModule } from './materials/materials.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(MaterialsModule);
  
  // Configuration CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // Frontend Vite
      'http://localhost:3000'   // Auth service
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // Préfixe global
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3002;
  
  await app.listen(port);
  console.log(`✅ Materials Service running on: http://localhost:${port}/api`);
  console.log(`📦 API endpoints: http://localhost:${port}/api/materials`);
  console.log(`🔓 CORS enabled for: http://localhost:5173`);
}

bootstrap();