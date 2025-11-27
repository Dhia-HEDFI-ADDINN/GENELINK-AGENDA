import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { RdvController } from './rdv.controller';
import { RdvService } from './rdv.service';
import { Rdv, RdvHistory } from '../domain/entities/rdv.entity';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rdv, RdvHistory]),
    CacheModule.register(),
    KafkaModule,
  ],
  controllers: [RdvController],
  providers: [RdvService],
  exports: [RdvService],
})
export class RdvModule {}
