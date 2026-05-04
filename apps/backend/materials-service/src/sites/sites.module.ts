import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
