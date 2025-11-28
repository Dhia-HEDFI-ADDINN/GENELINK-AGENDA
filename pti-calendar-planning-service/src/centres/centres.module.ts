import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentresController } from './centres.controller';
import { CentresService } from './centres.service';
import { Centre } from './centre.entity';
import { DisponibilitesModule } from '../disponibilites/disponibilites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Centre]),
    forwardRef(() => DisponibilitesModule),
  ],
  controllers: [CentresController],
  providers: [CentresService],
  exports: [CentresService],
})
export class CentresModule {}
