import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { CreateSupplierMaterialDto, UpdateSupplierMaterialDto, SupplierMaterialQueryDto } from './dto/supplier-material.dto';

@Injectable()
export class SuppliersMaterialsService {
  constructor(
    @InjectModel(SupplierMaterial.name) private supplierMaterialModel: Model<SupplierMaterial>,
  ) {}

  private calculateOverallScore(scores: {
    qualityScore?: number;
    deliveryScore?: number;
    communicationScore?: number;
    priceScore?: number;
    reliabilityScore?: number;
  }): number {
    const weights = {
      qualityScore: 0.25,
      deliveryScore: 0.20,
      communicationScore: 0.15,
      priceScore: 0.25,
      reliabilityScore: 0.15,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    if (scores.qualityScore !== undefined) {
      weightedSum += scores.qualityScore * weights.qualityScore;
      totalWeight += weights.qualityScore;
    }
    if (scores.deliveryScore !== undefined) {
      weightedSum += scores.deliveryScore * weights.deliveryScore;
      totalWeight += weights.deliveryScore;
    }
    if (scores.communicationScore !== undefined) {
      weightedSum += scores.communicationScore * weights.communicationScore;
      totalWeight += weights.communicationScore;
    }
    if (scores.priceScore !== undefined) {
      weightedSum += scores.priceScore * weights.priceScore;
      totalWeight += weights.priceScore;
    }
    if (scores.reliabilityScore !== undefined) {
      weightedSum += scores.reliabilityScore * weights.reliabilityScore;
      totalWeight += weights.reliabilityScore;
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  async create(createDto: CreateSupplierMaterialDto): Promise<SupplierMaterial> {
    const existing = await this.supplierMaterialModel.findOne({
      supplierId: new Types.ObjectId(createDto.supplierId),
      catalogItemId: new Types.ObjectId(createDto.catalogItemId),
    });

    if (existing) {
      throw new Error('This supplier-material relationship already exists');
    }

    const data: any = {
      ...createDto,
      supplierId: new Types.ObjectId(createDto.supplierId),
      catalogItemId: new Types.ObjectId(createDto.catalogItemId),
    };

    if (createDto.qualityScore !== undefined || createDto.deliveryScore !== undefined ||
        createDto.communicationScore !== undefined || createDto.priceScore !== undefined ||
        createDto.reliabilityScore !== undefined) {
      data.overallScore = this.calculateOverallScore({
        qualityScore: createDto.qualityScore,
        deliveryScore: createDto.deliveryScore,
        communicationScore: createDto.communicationScore,
        priceScore: createDto.priceScore,
        reliabilityScore: createDto.reliabilityScore,
      });
    }

    const created = new this.supplierMaterialModel(data);
    const saved = await created.save();

    await this.updateRecommendedForCatalogItem(saved.catalogItemId.toString());

    return this.findOne(saved._id.toString());
  }

  async findAll(query: SupplierMaterialQueryDto): Promise<{ data: SupplierMaterial[]; total: number; page: number; limit: number }> {
    const { supplierId, catalogItemId, page = '1', limit = '10' } = query;
    
    const filter: any = {};
    
    if (supplierId) filter.supplierId = new Types.ObjectId(supplierId);
    if (catalogItemId) filter.catalogItemId = new Types.ObjectId(catalogItemId);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [data, total] = await Promise.all([
      this.supplierMaterialModel.find(filter)
        .populate('supplierId', 'name supplierCode')
        .populate('catalogItemId', 'code name category unit')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec(),
      this.supplierMaterialModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findBySupplier(supplierId: string): Promise<SupplierMaterial[]> {
    return this.supplierMaterialModel.find({ supplierId: new Types.ObjectId(supplierId) })
      .populate('catalogItemId', 'code name category unit')
      .exec();
  }

  async findByCatalogItem(catalogItemId: string): Promise<SupplierMaterial[]> {
    return this.supplierMaterialModel.find({ catalogItemId: new Types.ObjectId(catalogItemId) })
      .populate('supplierId', 'name supplierCode')
      .sort({ unitPrice: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SupplierMaterial> {
    const item = await this.supplierMaterialModel.findById(id)
      .populate('supplierId', 'name supplierCode')
      .populate('catalogItemId', 'code name category unit')
      .exec();
    if (!item) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }
    return item;
  }

  async update(id: string, updateDto: UpdateSupplierMaterialDto): Promise<SupplierMaterial> {
    const updateData: any = { ...updateDto };

    if (updateDto.qualityScore !== undefined || updateDto.deliveryScore !== undefined ||
        updateDto.communicationScore !== undefined || updateDto.priceScore !== undefined ||
        updateDto.reliabilityScore !== undefined) {
      const existing = await this.supplierMaterialModel.findById(id).exec();
      updateData.overallScore = this.calculateOverallScore({
        qualityScore: updateDto.qualityScore ?? existing?.qualityScore,
        deliveryScore: updateDto.deliveryScore ?? existing?.deliveryScore,
        communicationScore: updateDto.communicationScore ?? existing?.communicationScore,
        priceScore: updateDto.priceScore ?? existing?.priceScore,
        reliabilityScore: updateDto.reliabilityScore ?? existing?.reliabilityScore,
      });
    }

    const item = await this.supplierMaterialModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('supplierId', 'name supplierCode')
      .populate('catalogItemId', 'code name category unit')
      .exec();
    if (!item) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }

    await this.updateRecommendedForCatalogItem(item.catalogItemId._id.toString());

    return item;
  }

  async updateRecommendedForCatalogItem(catalogItemId: string): Promise<void> {
    const suppliers = await this.supplierMaterialModel.find({
      catalogItemId: new Types.ObjectId(catalogItemId),
      overallScore: { $gte: 5 },
    }).sort({ overallScore: -1, unitPrice: 1 }).limit(1).exec();

    await this.supplierMaterialModel.updateMany(
      { catalogItemId: new Types.ObjectId(catalogItemId) },
      { recommended: false }
    ).exec();

    if (suppliers.length > 0) {
      await this.supplierMaterialModel.findByIdAndUpdate(
        suppliers[0]._id,
        { recommended: true }
      ).exec();
    }
  }

  async getComparisonForCatalogItem(catalogItemId: string): Promise<SupplierMaterial[]> {
    return this.supplierMaterialModel.find({ catalogItemId: new Types.ObjectId(catalogItemId) })
      .populate('supplierId', 'name supplierCode')
      .sort({ overallScore: -1, unitPrice: 1 })
      .exec();
  }

  async remove(id: string): Promise<void> {
    const item = await this.supplierMaterialModel.findById(id).exec();
    const catalogItemId = item?.catalogItemId?.toString();
    
    const result = await this.supplierMaterialModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Supplier-material relationship with id ${id} not found`);
    }

    if (catalogItemId) {
      await this.updateRecommendedForCatalogItem(catalogItemId);
    }
  }
}