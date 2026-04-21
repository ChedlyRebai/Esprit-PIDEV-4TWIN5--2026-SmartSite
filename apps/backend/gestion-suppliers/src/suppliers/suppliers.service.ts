import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Supplier, SupplierDocument, SupplierStatus } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const NOTIFICATION_API = 'http://localhost:3004/notification';
const USER_API = 'http://localhost:3000/users';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    private httpService: HttpService,
  ) {}

  // Auto-generate supplier code: FRS-2026-001
  private async generateSupplierCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FRS-${year}-`;

    const lastSupplier = await this.supplierModel
      .findOne({ supplierCode: { $regex: `^${prefix}` } })
      .sort({ supplierCode: -1 })
      .exec();

    let nextNumber = 1;
    if (lastSupplier) {
      const lastCode = lastSupplier.supplierCode;
      const lastNum = parseInt(lastCode.split('-')[2], 10);
      nextNumber = lastNum + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  async create(
    dto: CreateSupplierDto,
    contractFile: Express.Multer.File,
    insuranceFile: Express.Multer.File,
  ): Promise<Supplier> {
    if (!contractFile) {
      throw new BadRequestException(
        'Contract document is required. Please upload a PDF, JPG, or PNG file (max 5MB)',
      );
    }
    if (!insuranceFile) {
      throw new BadRequestException(
        'Insurance document is required. Please upload a PDF, JPG, or PNG file (max 5MB)',
      );
    }

    const supplierCode = await this.generateSupplierCode();

    const supplier = new this.supplierModel({
      ...dto,
      supplierCode,
      contractUrl: `/uploads/contracts/${contractFile.filename}`,
      insuranceUrl: `/uploads/insurance/${insuranceFile.filename}`,
      status: SupplierStatus.PENDING_QHSE,
    });

    const saved = await supplier.save();

    // Send notification to all QHSE managers (disabled for now - service notification not running)
    // await this.notifyQhseManagers(saved);

    return saved;
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierModel.find().sort({ createdAt: -1 }).exec();
  }

  async findPendingQhse(): Promise<Supplier[]> {
    return this.supplierModel
      .find({ status: SupplierStatus.PENDING_QHSE })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async approveByQhse(
    id: string,
    qhseUserId: string,
    notes?: string,
  ): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.status = SupplierStatus.APPROVED;
    supplier.qhseValidatedBy = qhseUserId;
    supplier.qhseValidatedAt = new Date();
    supplier.qhseNotes = notes || '';
    const updated = await (supplier as SupplierDocument).save();

    // Notify procurement manager who created the supplier (disabled for now)
    // await this.notifyProcurementManager(updated, 'approved');

    return updated;
  }

  async rejectByQhse(
    id: string,
    qhseUserId: string,
    notes?: string,
  ): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.status = SupplierStatus.REJECTED;
    supplier.qhseValidatedBy = qhseUserId;
    supplier.qhseValidatedAt = new Date();
    supplier.qhseNotes = notes || '';
    const updated = await (supplier as SupplierDocument).save();

    // Notify procurement manager who created the supplier (disabled for now)
    // await this.notifyProcurementManager(updated, 'rejected');

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.supplierModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    contractFile?: Express.Multer.File,
    insuranceFile?: Express.Multer.File,
  ): Promise<Supplier> {
    const supplier = await this.findById(id);

    // Update basic fields only if provided
    if (dto.name) supplier.name = dto.name;
    if (dto.category) supplier.category = dto.category;
    if (dto.email) supplier.email = dto.email;
    if (dto.phone) supplier.phone = dto.phone;
    if (dto.address) supplier.address = dto.address;
    if (dto.siret) supplier.siret = dto.siret;

    // Update files if provided
    if (contractFile) {
      supplier.contractUrl = `/uploads/contracts/${contractFile.filename}`;
    }
    if (insuranceFile) {
      supplier.insuranceUrl = `/uploads/insurance/${insuranceFile.filename}`;
    }

    // Si le fournisseur était rejeté, on le réactive pour re-approbation
    if (supplier.status === 'rejected') {
      supplier.status = 'pending_qhse';
      supplier.qhseValidatedBy = undefined;
      supplier.qhseValidatedAt = undefined;
    }

    const saved = await (supplier as SupplierDocument).save();

    return saved;
  }

  async archive(id: string): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.estArchive = true;
    return (supplier as SupplierDocument).save();
  }

  async unarchive(id: string): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.estArchive = false;
    return (supplier as SupplierDocument).save();
  }

  async clear(): Promise<void> {
    await this.supplierModel.deleteMany({}).exec();
  }

  // ── Notification helpers ────────────────────────────────────────────────────

  private async notifyQhseManagers(supplier: Supplier): Promise<void> {
    try {
      // Get all QHSE managers from user service
      const response = await firstValueFrom(
        this.httpService.get(`${USER_API}/role/qhse_manager`),
      );
      const qhseManagers = response.data || [];

      // Send notification to each QHSE manager
      for (const manager of qhseManagers) {
        await firstValueFrom(
          this.httpService.post(NOTIFICATION_API, {
            title: 'New Supplier Pending Validation',
            message: `Supplier "${supplier.name}" (${supplier.supplierCode}) has been created by ${supplier.createdByName} and requires your validation.`,
            recipentId: manager._id,
            type: 'INFO',
            priority: 'MEDIUM',
            isRead: false,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to notify QHSE managers:', error.message);
    }
  }

  private async notifyProcurementManager(
    supplier: Supplier,
    action: 'approved' | 'rejected',
  ): Promise<void> {
    try {
      const title =
        action === 'approved'
          ? 'Supplier Approved'
          : 'Supplier Rejected';
      const message =
        action === 'approved'
          ? `Your supplier "${supplier.name}" (${supplier.supplierCode}) has been approved by QHSE Manager.`
          : `Your supplier "${supplier.name}" (${supplier.supplierCode}) has been rejected.`;

      await firstValueFrom(
        this.httpService.post(NOTIFICATION_API, {
          title,
          message,
          qhseNotes: supplier.qhseNotes || 'No reason provided',
          recipentId: supplier.createdBy,
          type: action === 'approved' ? 'SUCCESS' : 'WARNING',
          priority: 'HIGH',
          isRead: false,
        }),
      );
    } catch (error) {
      console.error('Failed to notify procurement manager:', error.message);
    }
  }
}
