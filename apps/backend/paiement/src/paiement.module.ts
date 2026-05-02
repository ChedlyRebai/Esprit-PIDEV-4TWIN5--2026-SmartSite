import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';
import { FactureModule } from './facture/facture.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    FactureModule,
  ],
  controllers: [PaiementController],
  providers: [PaiementService, JwtStrategy, RolesGuard],
  exports: [PaiementService]
})
export class PaiementModule {}
