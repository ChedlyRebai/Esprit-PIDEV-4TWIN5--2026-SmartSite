import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ExternalDataService } from './external-data.service';
import { ExternalDataController } from './external-data.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ExternalDataController],
  providers: [ExternalDataService],
  exports: [ExternalDataService],
})
export class ExternalDataModule {}
