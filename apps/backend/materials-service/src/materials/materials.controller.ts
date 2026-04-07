import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto, UpdateStockDto } from './dto/update-material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { ScanQRDto } from './dto/scan-qr.dto';
import { MaterialForecast, StockAlert, QRScanResult } from './interfaces/material.interface';
import { QRScannerUtil } from '../common/utils/qr-scanner.util';
import * as fs from 'fs';
import { Material } from './entities/material.entity';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto, null);
  }

  @Get()
  async findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.materialsService.getDashboardStats();
  }

  @Get('alerts')
  async getAlerts(): Promise<StockAlert[]> {
    return this.materialsService.getStockAlerts();
  }

  @Get('forecast/:id')
  async getForecast(@Param('id') id: string): Promise<MaterialForecast> {
    return this.materialsService.generateForecast(id);
  }

  @Get('movements/:id')
  async getMovements(@Param('id') id: string) {
    return this.materialsService.getStockMovements(id);
  }

  @Get('low-stock')
  async getLowStock() {
    return this.materialsService.getLowStockMaterials();
  }

  @Get('expiring')
  async getExpiringMaterials() {
    return this.materialsService.getExpiringMaterials();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto, null);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.materialsService.updateStock(id, updateStockDto, null);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.materialsService.remove(id);
  }

  @Post(':id/reorder')
  async reorder(@Param('id') id: string) {
    return this.materialsService.reorderMaterial(id, null);
  }

  @Get('search/barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.materialsService.findByBarcode(barcode);
  }

  @Get('search/qrcode/:qrCode')
  async findByQRCode(@Param('qrCode') qrCode: string) {
    return this.materialsService.findByQRCode(qrCode);
  }

  @Post('bulk')
  async bulkCreate(@Body() materials: CreateMaterialDto[]) {
    return this.materialsService.bulkCreate(materials, null);
  }

  @Post('scan-qr')
  @UseInterceptors(FileInterceptor('image'))
  async scanQRCode(@UploadedFile() file: Express.Multer.File): Promise<QRScanResult> {
    if (!file) {
      throw new BadRequestException('Image requise pour le scan QR');
    }

    try {
      const qrData = await QRScannerUtil.scanFromImage(file.path);
      console.log('📸 QR Data scanné:', qrData);
      
      const parsedData = QRScannerUtil.parseQRData(qrData);
      console.log('📦 Données parsées:', parsedData);
      
      let material: Material | null = null;
      
      if (parsedData.id) {
        try {
          material = await this.materialsService.findOne(parsedData.id);
          console.log('✅ Matériau trouvé par ID:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par ID:', parsedData.id);
        }
      }
      
      if (!material && parsedData.code) {
        try {
          material = await this.materialsService.findByCode(parsedData.code);
          console.log('✅ Matériau trouvé par code:', material?.code);
        } catch (error) {
          console.log('❌ Matériau non trouvé par code:', parsedData.code);
        }
      }
      
      if (!material) {
        try {
          material = await this.materialsService.findByQRCode(qrData);
          console.log('✅ Matériau trouvé par QR code complet');
        } catch (error) {
          console.log('❌ Matériau non trouvé par QR code complet');
        }
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        qrData,
        material,
      };
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.error('❌ Erreur scan QR:', error);
      throw new BadRequestException(`Erreur scan QR: ${error.message}`);
    }
  }

  @Post('scan-qr-text')
  async scanQRCodeText(@Body() scanDto: ScanQRDto): Promise<QRScanResult> {
    if (!scanDto.qrCode) {
      throw new BadRequestException('QR code text requis');
    }

    const parsedData = QRScannerUtil.parseQRData(scanDto.qrCode);
    console.log('📦 Données parsées (texte):', parsedData);
    
    let material: Material | null = null;
    
    if (parsedData.id) {
      try {
        material = await this.materialsService.findOne(parsedData.id);
      } catch (error) {
        console.log('Matériau non trouvé par ID:', error.message);
      }
    }
    
    if (!material && parsedData.code) {
      try {
        material = await this.materialsService.findByCode(parsedData.code);
      } catch (error) {
        console.log('Matériau non trouvé par code:', error.message);
      }
    }
    
    if (!material) {
      try {
        material = await this.materialsService.findByQRCode(scanDto.qrCode);
      } catch (error) {
        console.log('Matériau non trouvé par QR code:', error.message);
      }
    }

    return {
      success: true,
      qrData: scanDto.qrCode,
      material,
    };
  }

  @Post(':id/generate-qr')
  async generateQRCode(@Param('id') id: string) {
    return this.materialsService.generateQRCode(id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image requise');
    }

    const imageUrl = `/uploads/materials/${file.filename}`;
    return this.materialsService.addImage(id, imageUrl);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fichier Excel requis');
    }

    try {
      const result = await this.materialsService.importFromExcel(file.path);
      
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return result;
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(`Erreur import Excel: ${error.message}`);
    }
  }

   @Post('export/excel')
   async exportToExcel(
  @Res() res: Response,
  @Body() materialIds?: string[]
) {
  const result = await this.materialsService.exportToExcel(materialIds);

  if (!result || !result.filePath) {
    throw new BadRequestException('Erreur export Excel');
  }

  return res.download(result.filePath, result.filename);
}

  /*@Post('export/pdf')
  async exportToPDF(@Body() materialIds?: string[]) {
    return this.materialsService.exportToPDF(materialIds);
  }*/
 @Post('export/pdf')
async exportToPDF(
  @Res() res: Response,
  @Body() materialIds?: string[]
) {
  try {
    const result = await this.materialsService.exportToPDF(materialIds);

    if (!result || !result.filePath) {
      throw new BadRequestException('Erreur génération PDF');
    }

    const { filePath, filename } = result;

    return res.download(filePath, filename);
  } catch (error) {
    console.error('❌ Export PDF error:', error);
    throw new BadRequestException(error.message);
  }
}
}