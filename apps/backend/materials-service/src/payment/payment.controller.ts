import {
  Controller,
  Post,
  Body,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentService } from './payment.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(
    @Body()
    body: {
      siteId: string;
      amount: number;
      paymentMethod: 'cash' | 'card';
      description?: string;
    },
  ) {
    this.logger.log(
      `💳 Creating payment: site=${body.siteId}, amount=${body.amount}, method=${body.paymentMethod}`,
    );
    return this.paymentService.createPayment(
      body.siteId,
      body.amount,
      body.paymentMethod,
      body.description,
    );
  }

  @Post('upload-invoice')
  @UseInterceptors(
    FileInterceptor('invoice', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `invoice-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Format non supporté. Utilisez PDF, JPG ou PNG.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async uploadInvoice(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { orderId: string; materialName: string },
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    this.logger.log(
      `📄 Invoice uploaded: ${file.filename} for order ${body.orderId}`,
    );

    return {
      success: true,
      filename: file.filename,
      path: file.path,
      orderId: body.orderId,
      message: 'Facture téléchargée avec succès',
    };
  }

  @Post('confirm-card')
  async confirmCardPayment(
    @Body()
    body: {
      paymentId: string;
      stripePaymentIntentId: string;
    },
  ) {
    this.logger.log(
      `✅ Confirming card payment: ${body.paymentId}, stripe: ${body.stripePaymentIntentId}`,
    );
    return this.paymentService.confirmCardPayment(
      body.paymentId,
      body.stripePaymentIntentId,
    );
  }
}
