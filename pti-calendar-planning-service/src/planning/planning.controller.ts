import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlanningService, CreatePlanningDto, UpdatePlanningDto, BlockCreneauDto } from './planning.service';
import { BlockMotif } from '../domain/entities/creneau-bloque.entity';

@ApiTags('planning')
@Controller('planning')
@ApiBearerAuth()
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get(':centreId/:date')
  @ApiOperation({ summary: 'Obtenir le planning d\'un centre pour une date' })
  async getByDate(
    @Param('centreId', ParseUUIDPipe) centreId: string,
    @Param('date') date: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.findByDate(centreId, date, tenantId);
  }

  @Get(':centreId')
  @ApiOperation({ summary: 'Obtenir les plannings d\'un centre sur une période' })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  async getByDateRange(
    @Param('centreId', ParseUUIDPipe) centreId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.findByDateRange(centreId, startDate, endDate, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer ou mettre à jour un planning' })
  async create(
    @Body() dto: CreatePlanningDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.create(dto, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un planning' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanningDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.update(id, dto, tenantId);
  }

  @Post('block')
  @ApiOperation({ summary: 'Bloquer un créneau' })
  async blockCreneau(
    @Body() dto: BlockCreneauDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.blockCreneau(dto, tenantId);
  }

  @Delete('block/:id')
  @ApiOperation({ summary: 'Débloquer un créneau' })
  async unblockCreneau(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.planningService.unblockCreneau(id, tenantId);
    return { message: 'Créneau débloqué', success: true };
  }

  @Get(':centreId/:date/blocked')
  @ApiOperation({ summary: 'Obtenir les créneaux bloqués' })
  @ApiQuery({ name: 'controleur_id', required: false })
  async getCreneauxBloques(
    @Param('centreId', ParseUUIDPipe) centreId: string,
    @Param('date') date: string,
    @Query('controleur_id') controleurId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.getCreneauxBloques(centreId, date, tenantId, controleurId);
  }

  @Post('duplicate-week')
  @ApiOperation({ summary: 'Dupliquer un planning d\'une semaine' })
  async duplicateWeek(
    @Body() body: {
      centre_id: string;
      source_week_start: string;
      target_week_start: string;
    },
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.planningService.duplicateWeek(
      body.centre_id,
      body.source_week_start,
      body.target_week_start,
      tenantId,
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'planning-service', timestamp: new Date().toISOString() };
  }
}
