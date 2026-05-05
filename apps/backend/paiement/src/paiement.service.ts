import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaiementService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {}

  private sanitizeInput(input: string): string {
    return input.replace(/[<>'";&]/g, '').trim();
  }

  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  private validateAndParseDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid paymentDate format');
    }
    if (date > new Date()) {
      throw new BadRequestException('paymentDate cannot be in the future');
    }
    return date;
  }

  private normalizeStatus(status: string): string {
    return status === 'paid' ? 'completed' : status;
  }

  private buildUpdateData(updatePaymentDto: UpdatePaymentDto, userId?: string): any {
    const updateData: any = {};

    if (updatePaymentDto.reference !== undefined) {
      updateData.reference = this.sanitizeInput(updatePaymentDto.reference);
    }
    if (updatePaymentDto.amount !== undefined) {
      updateData.amount = Math.round(updatePaymentDto.amount * 100) / 100;
    }
    if (updatePaymentDto.paymentMethod !== undefined) {
      updateData.paymentMethod = this.sanitizeInput(updatePaymentDto.paymentMethod);
    }
    if (updatePaymentDto.description !== undefined) {
      updateData.description = this.sanitizeInput(updatePaymentDto.description);
    }
    if (updatePaymentDto.paymentDate !== undefined) {
      updateData.paymentDate = this.validateAndParseDate(updatePaymentDto.paymentDate);
    }
    if (updatePaymentDto.status !== undefined) {
      updateData.status = this.normalizeStatus(updatePaymentDto.status);
    }
    if (updatePaymentDto.siteId) {
      if (!Types.ObjectId.isValid(updatePaymentDto.siteId)) {
        throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
      }
      updateData.siteId = new Types.ObjectId(updatePaymentDto.siteId);
    }

    updateData.updatedBy = userId && Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    return updateData;
  }

  async create(createPaymentDto: CreatePaymentDto, userId?: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(createPaymentDto.siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const reference = createPaymentDto.reference
      ? this.sanitizeInput(createPaymentDto.reference)
      : this.generateReference();

    const paymentDate = createPaymentDto.paymentDate
      ? this.validateAndParseDate(createPaymentDto.paymentDate)
      : new Date();

    const status = this.normalizeStatus(createPaymentDto.status || 'pending');

    const description = createPaymentDto.description
      ? this.sanitizeInput(createPaymentDto.description)
      : undefined;

    const createdPayment = new this.paymentModel({
      siteId: new Types.ObjectId(createPaymentDto.siteId),
      reference,
      amount: Math.round(createPaymentDto.amount * 100) / 100,
      paymentMethod: this.sanitizeInput(createPaymentDto.paymentMethod),
      description,
      paymentDate,
      status,
      siteBudget: 0,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
    });

    return createdPayment.save();
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentModel.findById(id).exec();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findBySite(siteId: string): Promise<Payment[]> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    return this.paymentModel
      .find({ siteId: new Types.ObjectId(siteId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId?: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const updateData = this.buildUpdateData(updatePaymentDto, userId);

    const payment = await this.paymentModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const result = await this.paymentModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }

  async getPaymentStatus(siteId: string, siteBudget: number = 0): Promise<{
    hasPaid: boolean;
    totalPaid: number;
    remaining: number;
  }> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const payments = await this.paymentModel.find({
      siteId: new Types.ObjectId(siteId),
      status: { $in: ['completed', 'paid'] },
    });

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, siteBudget - totalPaid);

    return {
      hasPaid: payments.length > 0,
      totalPaid,
      remaining,
    };
  }

  async getTotalPaymentsBySite(siteId: string): Promise<number> {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid siteId format. Must be a valid MongoDB ObjectId');
    }

    const result = await this.paymentModel.aggregate([
      { $match: { siteId: new Types.ObjectId(siteId), status: { $in: ['completed', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}
