import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client, Vehicule } from '../domain/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Vehicule])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
