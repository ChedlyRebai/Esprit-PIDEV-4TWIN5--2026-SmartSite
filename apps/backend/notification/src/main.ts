import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  const maxKafkaStartAttempts = Number(process.env.KAFKA_START_MAX_ATTEMPTS ?? 10);
  const retryDelayMs = Number(process.env.KAFKA_START_RETRY_DELAY_MS ?? 3000);

  for (let attempt = 1; attempt <= maxKafkaStartAttempts; attempt += 1) {
    try {
      await app.startAllMicroservices();
      break;
    } catch (error) {
      if (attempt === maxKafkaStartAttempts) {
        throw error;
      }

      logger.warn(
        `Kafka microservice startup failed (attempt ${attempt}/${maxKafkaStartAttempts}). Retrying in ${retryDelayMs}ms...`,
      );
      await sleep(retryDelayMs);
    }
  }

  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
