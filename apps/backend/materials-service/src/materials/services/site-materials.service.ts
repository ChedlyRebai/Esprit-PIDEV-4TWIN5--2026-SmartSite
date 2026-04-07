import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { UpdateMaterialDto } from '../dto/update-material.dto';

@Injectable()
export class SiteMaterialsService {
  private readonly logger = new Logger(SiteMaterialsService.name);

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  async assignMaterialToSite(materialId: string, siteId: string): Promise<Material> {
    if (!Types.ObjectId.isValid(materialId) || !Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('ID invalide');
    }
    
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${materialId} non trouvé`);
    }

    // Update siteId to the new site
    material.siteId = new Types.ObjectId(siteId);
    await material.save();
    
    this.logger.log(`✅ Matériau ${material.name} assigné au site ${siteId}`);
    return material;
  }

  async removeMaterialFromSite(materialId: string, siteId: string): Promise<Material> {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${materialId} non trouvé`);
    }

    if (material.assignedSites) {
      material.assignedSites = material.assignedSites.filter(
        (id: Types.ObjectId) => id.toString() !== siteId
      );
      await material.save();
    }

    return material;
  }

  async getMaterialsBySite(siteId: string): Promise<Material[]> {
    if (!Types.ObjectId.isValid(siteId)) {
      return [];
    }
    return this.materialModel
      .find({ $or: [
        { siteId: new Types.ObjectId(siteId) },
        { assignedSites: new Types.ObjectId(siteId) }
      ]})
      .exec();
  }

  async getMaterialsNeedingReorderBySite(siteId: string): Promise<Material[]> {
    const siteMaterials = await this.getMaterialsBySite(siteId);
    
    return siteMaterials.filter(material => {
      return material.quantity <= material.reorderPoint;
    });
  }

  async createMaterialWithSite(
    createMaterialDto: CreateMaterialDto,
    siteId: string,
    userId: string | null
  ): Promise<Material> {
    try {
      if (!Types.ObjectId.isValid(siteId)) {
        throw new BadRequestException('ID de site invalide');
      }
      
      const materialData: any = {
        ...createMaterialDto,
        siteId: new Types.ObjectId(siteId),  // Set the primary site
        assignedSites: [new Types.ObjectId(siteId)],
        status: 'active',
      };

      if (userId && Types.ObjectId.isValid(userId)) {
        materialData.createdBy = new Types.ObjectId(userId);
      }

      const material = new this.materialModel(materialData);
      const saved = await material.save();
      this.logger.log(`✅ Material created with site ${siteId}: ${saved._id}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error creating material with site: ${error.message}`);
      throw error;
    }
  }

  async getMaterialAvailabilityForSite(materialId: string, siteId: string): Promise<{
    material: Material;
    isAvailable: boolean;
    currentStock: number;
    reorderPoint: number;
    needsReorder: boolean;
  }> {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${materialId} non trouvé`);
    }

    const isAvailable = material.assignedSites?.some(
      (id: Types.ObjectId) => id.toString() === siteId
    ) || false;

    return {
      material,
      isAvailable,
      currentStock: material.quantity,
      reorderPoint: material.reorderPoint,
      needsReorder: material.quantity <= material.reorderPoint,
    };
  }

  async getAllMaterialsWithSiteInfo(): Promise<any[]> {
    const materials = await this.materialModel.find().exec();
    
    const result = await Promise.all(materials.map(async (material) => {
      const siteIdStr = material.siteId?.toString();
      
      let siteData: any = null;
      if (siteIdStr) {
        try {
          const axios = require('axios');
          const siteResponse = await axios.get(`http://localhost:3001/api/gestion-sites/${siteIdStr}`);
          siteData = siteResponse.data;
        } catch (e) {
          console.log(`Could not fetch site ${siteIdStr}:`, e.message);
        }
      }
      
      return {
        _id: material._id,
        name: material.name,
        code: material.code,
        category: material.category,
        quantity: material.quantity,
        unit: material.unit,
        reorderPoint: material.reorderPoint,
        minimumStock: material.minimumStock,
        maximumStock: material.maximumStock,
        status: material.status,
        siteId: siteIdStr,
        siteName: siteData?.nom || siteData?.name || (siteIdStr ? 'Site assigné' : 'Non assigné'),
        siteAddress: siteData?.adresse || '',
        siteCoordinates: siteData?.coordinates || null,
        assignedSites: material.assignedSites?.map((id: Types.ObjectId) => ({
          id: id.toString(),
        })) || [],
        needsReorder: material.quantity <= material.reorderPoint,
      };
    }));
    
    return result;
  }

  async getMaterialsByCategoryAndSite(category: string, siteId: string): Promise<Material[]> {
    if (!Types.ObjectId.isValid(siteId)) {
      return [];
    }
    return this.materialModel
      .find({
        category,
        $or: [
          { siteId: new Types.ObjectId(siteId) },
          { assignedSites: new Types.ObjectId(siteId) }
        ]
      })
      .exec();
  }

  async updateMaterialStock(materialId: string, quantity: number, operation: 'add' | 'remove'): Promise<Material> {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new NotFoundException(`Matériau #${materialId} non trouvé`);
    }

    if (operation === 'add') {
      material.quantity += quantity;
    } else {
      if (quantity > material.quantity) {
        throw new BadRequestException('Stock insuffisant');
      }
      material.quantity -= quantity;
    }

    material.lastCountDate = new Date();
    return material.save();
  }

  async getLowStockMaterialsBySite(siteId: string): Promise<Material[]> {
    const materials = await this.getMaterialsBySite(siteId);
    return materials.filter(m => m.quantity <= m.reorderPoint);
  }

  async getOutOfStockMaterialsBySite(siteId: string): Promise<Material[]> {
    const materials = await this.getMaterialsBySite(siteId);
    return materials.filter(m => m.quantity === 0);
  }
}