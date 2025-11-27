import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, Tarif, PromoCode } from '../domain/entities/payment.entity';
import { StripeModule } from '../stripe/stripe.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Tarif, PromoCode]),
    StripeModule,
    KafkaModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
