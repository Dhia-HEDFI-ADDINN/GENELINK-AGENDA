import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { Tenant, Centre, Controleur } from './domain/entities/tenant.entity';

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
        database: configService.get('DB_DATABASE', 'pti_admin'),
        entities: [Tenant, Centre, Controleur],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
    }),

    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
