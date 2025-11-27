import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLog, AuditRetentionPolicy } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditKafkaConsumer, AuditKafkaProducer } from './services/audit-kafka.consumer';
import { AuditController } from './controllers/audit.controller';
import { AuditRetentionService } from './services/audit-retention.service';
import { AuditMetricsService } from './services/audit-metrics.service';

@Global()
@Module({})
export class AuditModule {
  static forRoot(options?: { enableKafka?: boolean; enableElasticsearch?: boolean }): DynamicModule {
    const enableKafka = options?.enableKafka ?? true;
    const enableElasticsearch = options?.enableElasticsearch ?? true;

    const providers: any[] = [
      AuditService,
      AuditRetentionService,
      AuditMetricsService,
      {
        provide: 'AUDIT_CONFIG',
        useFactory: (configService: ConfigService) => ({
          enableKafka,
          enableElasticsearch,
          elasticsearch: {
            node: configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200'),
            index: configService.get('ELASTICSEARCH_AUDIT_INDEX', 'audit-logs'),
          },
          kafka: {
            brokers: (configService.get('KAFKA_BROKERS', 'localhost:9092')).split(','),
            clientId: configService.get('KAFKA_CLIENT_ID', 'audit-service'),
          },
          retention: {
            defaultDays: parseInt(configService.get('AUDIT_RETENTION_DAYS', '365'), 10),
            criticalDays: parseInt(configService.get('AUDIT_CRITICAL_RETENTION_DAYS', '2555'), 10), // 7 years
            archiveEnabled: configService.get('AUDIT_ARCHIVE_ENABLED', 'true') === 'true',
          },
        }),
        inject: [ConfigService],
      },
    ];

    if (enableKafka) {
      providers.push(AuditKafkaConsumer, AuditKafkaProducer);
    }

    return {
      module: AuditModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([AuditLog, AuditRetentionPolicy]),
      ],
      controllers: [AuditController],
      providers,
      exports: [AuditService, AuditKafkaProducer, 'AUDIT_CONFIG'],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: AuditModule,
      imports: [TypeOrmModule.forFeature([AuditLog])],
      providers: [AuditService],
      exports: [AuditService],
    };
  }
}

// Standalone Audit Module for microservices that just need the producer
@Module({})
export class AuditClientModule {
  static forRoot(): DynamicModule {
    return {
      module: AuditClientModule,
      imports: [ConfigModule],
      providers: [
        AuditKafkaProducer,
        {
          provide: 'AUDIT_KAFKA_CONFIG',
          useFactory: (configService: ConfigService) => ({
            brokers: (configService.get('KAFKA_BROKERS', 'localhost:9092')).split(','),
            clientId: configService.get('KAFKA_CLIENT_ID', 'audit-client'),
          }),
          inject: [ConfigService],
        },
      ],
      exports: [AuditKafkaProducer],
    };
  }
}
