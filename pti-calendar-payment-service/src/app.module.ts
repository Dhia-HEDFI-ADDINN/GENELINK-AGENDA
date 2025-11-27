import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsModule } from './payments/payments.module';
import { StripeModule } from './stripe/stripe.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { HealthModule } from './health/health.module';

import { Payment, Tarif, PromoCode } from './domain/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'pti_payment'),
        entities: [Payment, Tarif, PromoCode],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
    }),

    StripeModule,
    KafkaModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
