import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisponibilitesService } from './disponibilites.service';
import { DisponibilitesController } from './disponibilites.controller';
import { Planning } from '../domain/entities/planning.entity';
import { CreneauBloque } from '../domain/entities/creneau-bloque.entity';
import { PlanningModule } from '../planning/planning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Planning, CreneauBloque]),
    PlanningModule,
  ],
  controllers: [DisponibilitesController],
  providers: [DisponibilitesService],
  exports: [DisponibilitesService],
})
export class DisponibilitesModule {}
