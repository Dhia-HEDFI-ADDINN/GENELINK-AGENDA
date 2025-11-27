import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { AuditModule } from './audit.module';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { AuditLog, AuditRetentionPolicy } from './entities/audit-log.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432'), 10),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'pti_audit'),
        entities: [AuditLog, AuditRetentionPolicy],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
        ssl: configService.get('DB_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Audit Module
    AuditModule.forRoot({
      enableKafka: process.env.KAFKA_ENABLED !== 'false',
      enableElasticsearch: process.env.ELASTICSEARCH_ENABLED !== 'false',
    }),
  ],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
