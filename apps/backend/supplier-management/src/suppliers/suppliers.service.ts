import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierInput): Promise<Supplier> {
    // Vérifier unicité du code
    const existingCode = await this.supplierModel
      .findOne({ code: createSupplierDto.code })
      .exec();
    if (existingCode) {
      throw new ConflictException('A supplier with this code already exists');
    }

    // Vérifier unicité de l'email
    const existingEmail = await this.supplierModel
      .findOne({ email: createSupplierDto.email.toLowerCase() })
      .exec();
    if (existingEmail) {
      throw new ConflictException('A supplier with this email already exists');
    }

    const createdSupplier = new this.supplierModel({
      ...createSupplierDto,
      email: createSupplierDto.email.toLowerCase(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return createdSupplier.save();
  }

  async findAll(includeInactive: boolean = false): Promise<Supplier[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.supplierModel
      .find(query)
      .sort({ created_at: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel
      .findById(id)
      .exec();

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierInput,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    // Vérifier unicité du code si changement
    if (updateSupplierDto.code && updateSupplierDto.code !== supplier.code) {
      const existingCode = await this.supplierModel
        .findOne({ code: updateSupplierDto.code, _id: { $ne: id } })
        .exec();
      if (existingCode) {
        throw new ConflictException('A supplier with this code already exists');
      }
    }

    // Vérifier unicité de l'email si changement
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingEmail = await this.supplierModel
        .findOne({
          email: updateSupplierDto.email.toLowerCase(),
          _id: { $ne: id },
        })
        .exec();
      if (existingEmail) {
        throw new ConflictException('A supplier with this email already exists');
      }
    }

    const updateData: any = { ...updateSupplierDto };
    if (updateSupplierDto.email) {
      updateData.email = updateSupplierDto.email.toLowerCase();
    }
    updateData.updated_at = new Date();

    // Interdire modification des champs read-only
    delete updateData.quality_score;
    delete updateData.avg_delivery_days;

    const updatedSupplier = await this.supplierModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found after update`);
    }

    return updatedSupplier;
  }

  async softDelete(id: string): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (!supplier.is_active) {
      throw new BadRequestException('Supplier is already inactive');
    }

    supplier.is_active = false;
    supplier.updated_at = new Date();

    return supplier.save();
  }

  async reactivate(id: string): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (supplier.is_active) {
      throw new BadRequestException('Supplier is already active');
    }

    supplier.is_active = true;
    supplier.updated_at = new Date();

    return supplier.save();
  }
}
