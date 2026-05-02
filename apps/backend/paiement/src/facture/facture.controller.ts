import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FactureService } from './facture.service';
import { FactureFilterDto } from '../dto/create-facture.dto';
import { PaiementService } from '../paiement.service';

@Controller('api/factures')
export class FactureController {
  constructor(
    private readonly factureService: FactureService,
    private readonly paiementService: PaiementService,
  ) {}

  @Post(':paymentId')
  async createFromPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { siteNom: string },
  ) {
    return this.factureService.createFromPayment(paymentId, body.siteNom);
  }

  @Get()
  async findAll(@Query() filter: FactureFilterDto) {
    return this.factureService.findAll(filter);
  }

  @Get('pdf/:id')
  async getPdf(
    @Param('id') id: string,
    @Query('budget') budgetStr: string,
    @Res() res: Response
  ) {
    const facture = await this.factureService.findOne(id);
    
    let siteInfo: { budget: number; totalPaid: number; remaining: number } | undefined = undefined;
    if (budgetStr && !isNaN(parseFloat(budgetStr))) {
      const siteBudget = parseFloat(budgetStr);
      const status = await this.paiementService.getPaymentStatus(facture.siteId.toString(), siteBudget);
      if (status) {
        siteInfo = {
          budget: siteBudget,
          totalPaid: status.totalPaid,
          remaining: status.remaining,
        };
      }
    }
    
    const html = await this.factureService.generatePdfContent(facture, siteInfo);

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="facture-${facture.numeroFacture}.html"`,
    });

    res.send(html);
  }

  @Get('export/csv')
  async exportCsv(@Query() filter: FactureFilterDto, @Res() res: Response) {
    const csv = await this.factureService.exportFacturesCsv(filter);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="factures-${new Date().toISOString().split('T')[0]}.csv"`,
    });

    res.send(csv);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.factureService.findOne(id);
  }
}
