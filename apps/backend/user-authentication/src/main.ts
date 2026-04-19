import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getAllowedOrigins(): string[] {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174'];
  const rawOrigins = process.env.CORS_ORIGIN;

  if (!rawOrigins) {
    return defaultOrigins;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3000;
  app.enableCors({
    origin: getAllowedOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(port);
  console.log(
    `Auth API listening on http://localhost:${port} (frontend Vite: http://localhost:5173)`,
  );
}
bootstrap();
