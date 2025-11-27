import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../domain/entities/role.entity';
import { Permission } from '../domain/entities/permission.entity';
import { RbacService } from './rbac.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
