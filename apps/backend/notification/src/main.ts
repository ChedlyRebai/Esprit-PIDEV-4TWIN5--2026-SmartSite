import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

function getAllowedOrigins(): string[] {
  const defaultOrigin = 'http://localhost:5173';
  const rawOrigins = process.env.CORS_ORIGIN;

  if (!rawOrigins) {
    return [defaultOrigin];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID ?? 'notification-consumer',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
          .split(',')
          .map((broker) => broker.trim())
          .filter(Boolean),
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID ?? 'notification-group',
      },
    },
  });

  app.enableCors(
    {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
