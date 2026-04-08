import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupplierEvaluation } from './entities/supplier-evaluation.entity';
import { CreateSupplierEvaluationDto, UpdateSupplierEvaluationDto, SupplierEvaluationQueryDto } from './dto/supplier-evaluation.dto';

@Injectable()
export class SupplierEvaluationsService {
  constructor(
    @InjectModel(SupplierEvaluation.name) private evaluationModel: Model<SupplierEvaluation>,
  ) {}

  async create(createDto: CreateSupplierEvaluationDto): Promise<SupplierEvaluation> {
    const overallRating = (
      createDto.qualityRating +
      createDto.priceRating +
      createDto.deliveryRating +
      createDto.communicationRating
    ) / 4;

    const created = new this.evaluationModel({
      ...createDto,
      supplierId: new Types.ObjectId(createDto.supplierId),
      overallRating: Math.round(overallRating * 10) / 10,
    });
    return created.save();
  }

  async findAll(query: SupplierEvaluationQueryDto): Promise<{ data: SupplierEvaluation[]; total: number; page: number; limit: number }> {
    const { supplierId, page = 1, limit = 10 } = query;
    
    const filter: any = {};
    if (supplierId) filter.supplierId = new Types.ObjectId(supplierId);

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.evaluationModel.find(filter).populate('supplierId', 'name category').skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.evaluationModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findBySupplier(supplierId: string): Promise<SupplierEvaluation[]> {
    return this.evaluationModel.find({ supplierId: new Types.ObjectId(supplierId) })
      .populate('supplierId', 'name category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSupplierStats(supplierId: string): Promise<any> {
    const stats = await this.evaluationModel.aggregate([
      { $match: { supplierId: new Types.ObjectId(supplierId) } },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$qualityRating' },
          avgPrice: { $avg: '$priceRating' },
          avgDelivery: { $avg: '$deliveryRating' },
          avgCommunication: { $avg: '$communicationRating' },
          avgOverall: { $avg: '$overallRating' },
          avgDeliveryDays: { $avg: '$deliveryDays' },
          count: { $sum: 1 },
        },
      },
    ]);
    return stats[0] || null;
  }

  async getComparisonData(category?: string): Promise<any[]> {
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: '$supplier' },
    ];

    if (category) {
      pipeline.push({ $match: { 'supplier.category': category } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplier.name' },
          supplierCategory: { $first: '$supplier.category' },
          avgQuality: { $avg: '$qualityRating' },
          avgPrice: { $avg: '$priceRating' },
          avgDelivery: { $avg: '$deliveryRating' },
          avgCommunication: { $avg: '$communicationRating' },
          avgOverall: { $avg: '$overallRating' },
          avgDeliveryDays: { $avg: '$deliveryDays' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgOverall: -1 } }
    );

    return this.evaluationModel.aggregate(pipeline);
  }

  async findOne(id: string): Promise<SupplierEvaluation> {
    const evaluation = await this.evaluationModel.findById(id).populate('supplierId', 'name category').exec();
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with id ${id} not found`);
    }
    return evaluation;
  }

  async update(id: string, updateDto: UpdateSupplierEvaluationDto): Promise<SupplierEvaluation> {
    const existing = await this.evaluationModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Evaluation with id ${id} not found`);
    }

    const updatedData: any = { ...updateDto };
    
    if (updateDto.qualityRating !== undefined || 
        updateDto.priceRating !== undefined || 
        updateDto.deliveryRating !== undefined || 
        updateDto.communicationRating !== undefined) {
      const quality = updateDto.qualityRating ?? existing.qualityRating;
      const price = updateDto.priceRating ?? existing.priceRating;
      const delivery = updateDto.deliveryRating ?? existing.deliveryRating;
      const communication = updateDto.communicationRating ?? existing.communicationRating;
      updatedData.overallRating = Math.round(((quality + price + delivery + communication) / 4) * 10) / 10;
    }

    const updated = await this.evaluationModel
      .findByIdAndUpdate(id, updatedData, { new: true })
      .populate('supplierId', 'name category')
      .exec();
    
    return updated!;
  }

  async remove(id: string): Promise<void> {
    const result = await this.evaluationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Evaluation with id ${id} not found`);
    }
  }
}
