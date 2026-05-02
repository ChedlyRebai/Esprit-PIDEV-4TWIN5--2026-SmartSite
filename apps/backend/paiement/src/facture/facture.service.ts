import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Facture } from '../entities/facture.entity';
import { Payment } from '../entities/payment.entity';
import { FactureFilterDto } from '../dto/create-facture.dto';
import { stringify } from 'csv-stringify';

@Injectable()
export class FactureService {
  constructor(
    @InjectModel(Facture.name) private factureModel: Model<Facture>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {}

  private generateNumeroFacture(): string {
    const year = new Date().getFullYear();
    return `INV-${year}-${Date.now().toString(36).toUpperCase()}`;
  }

  async createFromPayment(paymentId: string, siteNom: string): Promise<Facture> {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw new BadRequestException('Invalid payment ID');
    }

    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const existingFacture = await this.factureModel.findOne({ paymentId: new Types.ObjectId(paymentId) });
    if (existingFacture) {
      throw new BadRequestException('Facture already exists for this payment');
    }

    const numeroFacture = this.generateNumeroFacture();

    const facture = new this.factureModel({
      numeroFacture,
      paymentId: new Types.ObjectId(paymentId),
      siteId: payment.siteId,
      siteNom: siteNom.trim(),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      description: payment.description,
      isActive: true,
    });

    return facture.save();
  }

  async findAll(filter: FactureFilterDto): Promise<{
    factures: Facture[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 10, 100);
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    if (filter.siteNom) {
      query.siteNom = { $regex: `^${filter.siteNom.trim()}`, $options: 'i' };
    }

    if (filter.startDate || filter.endDate) {
      query.paymentDate = {};
      if (filter.startDate) {
        query.paymentDate.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.paymentDate.$lte = new Date(filter.endDate);
      }
    }

    const [factures, total] = await Promise.all([
      this.factureModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.factureModel.countDocuments(query),
    ]);

    return {
      factures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Facture> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid facture ID');
    }

    const facture = await this.factureModel.findById(id).exec();
    if (!facture) {
      throw new NotFoundException(`Facture with ID ${id} not found`);
    }

    return facture;
  }

  async generatePdfContent(facture: Facture, siteInfo?: { budget: number; totalPaid: number; remaining: number }): Promise<string> {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'TND',
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    };

    const getMethodLabel = (method: string) => {
      const labels: Record<string, string> = {
        cash: 'Cash',
        card: 'Credit/Debit Card',
        transfer: 'Bank Transfer',
        check: 'Check',
      };
      return labels[method] || method;
    };

    const hasRemaining = siteInfo !== undefined && siteInfo.remaining > 0;
    const remainingBgColor = hasRemaining ? '#fef3c7' : '#dcfce7';
    const remainingBorderColor = hasRemaining ? '#f59e0b' : '#22c55e';
    const remainingAmountColor = hasRemaining ? '#f59e0b' : '#22c55e';
    const remainingStatusHtml = hasRemaining
      ? `<div style="text-align: center; margin-top: 12px; font-size: 12px; color: #92400e; font-weight: 500;">⚠️ Payment incomplete - Balance remaining</div>`
      : `<div style="text-align: center; margin-top: 12px; font-size: 12px; color: #166534; font-weight: 500;">✓ Fully Paid</div>`;

    const remainingHtml = siteInfo ? `
      <div class="remaining-section" style="background: ${remainingBgColor}; padding: 20px; border-radius: 8px; margin-top: 20px; border: 2px solid ${remainingBorderColor};">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Budget</div>
            <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 4px;">${formatCurrency(siteInfo.budget)}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</div>
            <div style="font-size: 18px; font-weight: 700; color: #22c55e; margin-top: 4px;">${formatCurrency(siteInfo.totalPaid)}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Remaining</div>
            <div style="font-size: 18px; font-weight: 700; color: ${remainingAmountColor}; margin-top: 4px;">${formatCurrency(siteInfo.remaining)}</div>
          </div>
        </div>
        ${remainingStatusHtml}
      </div>
    ` : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${facture.numeroFacture}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; background: #fff; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px 50px; display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .header-right { text-align: right; }
    .invoice-number { font-size: 16px; font-weight: 600; opacity: 0.95; }
    .invoice-date { font-size: 13px; opacity: 0.85; margin-top: 5px; }
    .company-info { background: #f8fafc; padding: 25px 50px; border-bottom: 1px solid #e5e7eb; }
    .company-name { font-size: 18px; font-weight: 700; color: #1e3a8a; }
    .company-tagline { font-size: 13px; color: #64748b; margin-top: 4px; }
    .content { padding: 40px 50px; }
    .section-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; }
    .info-card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .info-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .info-value { font-size: 16px; font-weight: 600; color: #1e293b; }
    .info-value.highlight { color: #2563eb; font-size: 18px; }
    .amount-section { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 35px 50px; border-radius: 10px; text-align: center; margin: 30px 0; }
    .amount-label { font-size: 14px; font-weight: 500; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase; }
    .amount-value { font-size: 42px; font-weight: 700; margin-top: 10px; letter-spacing: 2px; }
    .amount-in-words { font-size: 13px; opacity: 0.8; margin-top: 8px; }
    .description-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; }
    .description-title { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
    .description-text { font-size: 14px; color: #334155; line-height: 1.6; }
    .footer { background: #f1f5f9; padding: 25px 50px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 12px; color: #94a3b8; }
    .footer-brand { font-size: 14px; font-weight: 600; color: #1e3a8a; margin-top: 5px; }
    .page-number { position: fixed; bottom: 15px; right: 25px; font-size: 11px; color: #94a3b8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .status-badge { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    @media print { body { padding: 0; } .invoice-container { border: none; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="header-left">
        <h1>Payment Receipt</h1>
      </div>
      <div class="header-right">
        <div class="invoice-number">${facture.numeroFacture}</div>
        <div class="invoice-date">${formatDate(facture.paymentDate)}</div>
      </div>
    </div>

    <div class="company-info">
      <div class="company-name">SmartSite</div>
      <div class="company-tagline">Construction Project Management System</div>
    </div>

    <div class="content">
      <div class="section-title">Payment Details</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Project / Site</div>
          <div class="info-value">${facture.siteNom}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formatDate(facture.paymentDate)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Payment Method</div>
          <div class="info-value">${getMethodLabel(facture.paymentMethod)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Status</div>
          <div class="info-value"><span class="status-badge">Paid</span></div>
        </div>
      </div>

      <div class="amount-section">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">${formatCurrency(facture.amount)}</div>
      </div>

      ${remainingHtml}

      ${facture.description ? `
      <div class="description-box">
        <div class="description-title">Description</div>
        <div class="description-text">${facture.description}</div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <div class="footer-text">This document is automatically generated and serves as an official payment receipt.</div>
      <div class="footer-brand">SmartSite - Construction Management</div>
    </div>
  </div>
  <div class="page-number">Page 1 of 1</div>
</body>
</html>
    `.trim();

    return html;
  }

  async exportFacturesCsv(filter: FactureFilterDto): Promise<string> {
    const { factures } = await this.findAll({ ...filter, page: 1, limit: 10000 });

    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      stringify(
        factures.map(f => ({
          numeroFacture: f.numeroFacture,
          siteNom: f.siteNom,
          amount: f.amount,
          paymentMethod: f.paymentMethod,
          paymentDate: f.paymentDate,
          description: f.description || '',
        })),
        { header: true, columns: ['numeroFacture', 'siteNom', 'amount', 'paymentMethod', 'paymentDate', 'description'] },
        (err, output) => {
          if (err) reject(err);
          else resolve(output);
        }
      );
    });
  }
}
