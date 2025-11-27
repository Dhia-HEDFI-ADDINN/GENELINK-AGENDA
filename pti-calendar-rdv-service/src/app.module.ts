import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

import { RdvModule } from './rdv/rdv.module';
import { ClientsModule } from './clients/clients.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { HealthModule } from './health/health.module';

import { Rdv, RdvHistory } from './domain/entities/rdv.entity';
import { Client, Vehicule } from './domain/entities/client.entity';

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
        database: configService.get('DB_DATABASE', 'pti_rdv'),
        entities: [Rdv, RdvHistory, Client, Vehicule],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
        ssl: configService.get('DB_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);

        if (configService.get('NODE_ENV') === 'production') {
          return {
            store: await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
              },
              password: configService.get('REDIS_PASSWORD'),
              ttl: 60 * 1000, // 60 seconds default TTL
            }),
          };
        }

        return {
          ttl: 60 * 1000,
        };
      },
    }),

    KafkaModule,
    RdvModule,
    ClientsModule,
    HealthModule,
  ],
})
export class AppModule {}
