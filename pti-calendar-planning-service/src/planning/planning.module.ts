import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { Planning } from '../domain/entities/planning.entity';
import { CreneauBloque } from '../domain/entities/creneau-bloque.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Planning, CreneauBloque])],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
