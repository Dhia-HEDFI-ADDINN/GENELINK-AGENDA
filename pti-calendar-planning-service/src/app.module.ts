import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { PlanningModule } from './planning/planning.module';
import { DisponibilitesModule } from './disponibilites/disponibilites.module';
import { CreneauxModule } from './creneaux/creneaux.module';
import { CentresModule } from './centres/centres.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'pti_planning'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    PlanningModule,
    DisponibilitesModule,
    CreneauxModule,
    CentresModule,
  ],
})
export class AppModule {}
