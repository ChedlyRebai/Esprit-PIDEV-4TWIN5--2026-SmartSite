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
import { StockPredictionService } from './services/stock-prediction.service';
import { MLTrainingService } from './services/ml-training.service';
@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly predictionService: StockPredictionService,
    private readonly mlTrainingService: MLTrainingService,
  ) {}

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

  @Get('with-sites')
  async getMaterialsWithSites() {
    return this.materialsService.getMaterialsWithSiteInfo();
  }

  @Get('expiring')
  async getExpiringMaterials() {
    return this.materialsService.getExpiringMaterials();
  }

  // ========== AI STOCK PREDICTION ==========
  @Get('prediction/all')
  async getAllPredictions() {
    const materials = await this.materialsService.findAll({ limit: 100 });
    const materialList = Array.isArray(materials) ? materials : (materials as any).data || [];
    
    const predictions = await Promise.all(
      materialList.map(async (material: any) => {
        try {
          // Use ML training service if historical data exists
          if (this.mlTrainingService.hasHistoricalData(material._id.toString())) {
            const mlPrediction = await this.mlTrainingService.predictStock(
              material._id.toString(),
              24,
              material.quantity,
              material.reorderPoint
            );
            mlPrediction.materialName = material.name;
            mlPrediction.currentStock = material.quantity;
            return mlPrediction;
          }
          
          // Fallback to stock prediction service
          return await this.predictionService.predictStockDepletion(
            material._id.toString(),
            material.name,
            material.quantity,
            material.minimumStock,
            material.maximumStock,
            material.reorderPoint,
            material.consumptionRate || 1
          );
        } catch (error) {
          return null;
        }
      })
    );
    
    return predictions.filter(p => p !== null);
  }

  @Get(':id/prediction')
  async getStockPrediction(@Param('id') id: string) {
    const material = await this.materialsService.findOne(id);
    
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    // Use ML training service if historical data exists
    if (this.mlTrainingService.hasHistoricalData(id)) {
      const mlPrediction = await this.mlTrainingService.predictStock(
        id,
        24,
        material.quantity,
        material.reorderPoint
      );
      mlPrediction.materialName = material.name;
      mlPrediction.currentStock = material.quantity;
      return mlPrediction;
    }

    // Fallback to stock prediction service
    return this.predictionService.predictStockDepletion(
      material._id.toString(),
      material.name,
      material.quantity,
      material.minimumStock,
      material.maximumStock,
      material.reorderPoint,
      material.consumptionRate || 1
    );
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

  // ========== ML TRAINING - UPLOAD CSV ==========
  @Post(':id/upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHistoricalData(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Aucun fichier CSV uploaded');
      }

      const material = await this.materialsService.findOne(id);
      if (!material) {
        throw new BadRequestException('Matériau non trouvé');
      }

      let csvContent: string;
      if (file.buffer && file.buffer.length > 0) {
        csvContent = file.buffer.toString('utf-8');
      } else if (file.path) {
        csvContent = require('fs').readFileSync(file.path, 'utf-8');
      } else {
        throw new BadRequestException('Impossible de lire le fichier');
      }
      
      console.log('📄 CSV Content (first 200 chars):', csvContent.substring(0, 200));
      
      const parsedData = this.mlTrainingService.parseCSV(csvContent, id);

      return {
        success: true,
        message: `CSV parsed successfully. ${parsedData.totalRecords} records loaded.`,
        data: {
          totalRecords: parsedData.totalRecords,
          dateRange: parsedData.dateRange,
          averageConsumption: parsedData.averageConsumption,
        },
      };
    } catch (error) {
      console.error('❌ Error uploading CSV:', error.message);
      throw new BadRequestException(`Error parsing CSV: ${error.message}`);
    }
  }

  // ========== ML TRAINING - TRAIN MODEL ==========
  @Post(':id/train')
  async trainModel(@Param('id') id: string) {
    const material = await this.materialsService.findOne(id);
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    const hasData = this.mlTrainingService.hasHistoricalData(id);
    if (!hasData) {
      throw new BadRequestException('Aucune donnée historique. Upload CSV first.');
    }

    const result = await this.mlTrainingService.trainModel(
      id,
      material.name,
      material.quantity,
      material.reorderPoint
    );

    return {
      success: true,
      message: `Model trained successfully! Accuracy: ${(result.accuracy * 100).toFixed(1)}%`,
      trainingResult: result,
    };
  }

  // ========== ML PREDICTION ==========
  @Get(':id/predict')
  async predictStock(
    @Param('id') id: string,
    @Query('hours') hours: string = '24',
  ) {
    const material = await this.materialsService.findOne(id);
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    const hoursAhead = parseInt(hours, 10) || 24;

    const prediction = await this.mlTrainingService.predictStock(
      id,
      hoursAhead,
      material.quantity,
      material.reorderPoint
    );

    prediction.materialName = material.name;

    return prediction;
  }

  // ========== ML MODEL INFO ==========
  @Get(':id/model-info')
  async getModelInfo(@Param('id') id: string) {
    const hasModel = this.mlTrainingService.hasModel(id);
    const hasData = this.mlTrainingService.hasHistoricalData(id);

    return {
      materialId: id,
      modelTrained: hasModel,
      hasHistoricalData: hasData,
      ...this.mlTrainingService.getModelInfo(id),
    };
  }
}