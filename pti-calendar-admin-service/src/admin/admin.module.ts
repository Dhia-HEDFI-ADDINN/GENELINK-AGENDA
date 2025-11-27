import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Tenant, Centre, Controleur } from '../domain/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Centre, Controleur])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
