import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { NotificationsModule } from './notifications/notifications.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './health/health.module';
import { SchedulerService } from './scheduler/scheduler.service';

import { Notification, NotificationTemplate, PushSubscription } from './domain/entities/notification.entity';

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
        database: configService.get('DB_DATABASE', 'pti_notification'),
        entities: [Notification, NotificationTemplate, PushSubscription],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
    }),

    ScheduleModule.forRoot(),

    NotificationsModule,
    KafkaModule,
    HealthModule,
  ],
  providers: [SchedulerService],
})
export class AppModule {}
