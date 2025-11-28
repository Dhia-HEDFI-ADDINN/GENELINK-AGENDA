import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CentresService, SearchCentresParams, CentresSearchResult } from './centres.service';
import { Centre, CentreStatus } from './centre.entity';
import { DisponibilitesService } from '../disponibilites/disponibilites.service';

// DTO for search params
interface SearchCentresQueryDto {
  search?: string;
  code_postal?: string;
  ville?: string;
  latitude?: string;
  longitude?: string;
  rayon_km?: string;
  reseau_id?: string;
  status?: CentreStatus;
  agrements?: string;
  page?: string;
  limit?: string;
}

// DTO for disponibilités
interface GetDisponibilitesQueryDto {
  date: string;
  type_controle: string;
  type_vehicule?: string;
  carburant?: string;
}

// DTO for dates disponibles
interface GetDatesDisponiblesQueryDto {
  type_controle: string;
  date_debut: string;
  date_fin: string;
  type_vehicule?: string;
  carburant?: string;
}

@Controller('centres')
export class CentresController {
  constructor(
    private readonly centresService: CentresService,
    private readonly disponibilitesService: DisponibilitesService,
  ) {}

  /**
   * Rechercher des centres
   * GET /centres?search=paris&latitude=48.8566&longitude=2.3522
   */
  @Get()
  async search(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: SearchCentresQueryDto,
  ): Promise<CentresSearchResult> {
    const params: SearchCentresParams = {
      search: query.search,
      code_postal: query.code_postal,
      ville: query.ville,
      latitude: query.latitude ? parseFloat(query.latitude) : undefined,
      longitude: query.longitude ? parseFloat(query.longitude) : undefined,
      rayon_km: query.rayon_km ? parseInt(query.rayon_km, 10) : undefined,
      reseau_id: query.reseau_id,
      status: query.status,
      agrements: query.agrements ? query.agrements.split(',') : undefined,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };

    return this.centresService.findAll(tenantId || 'default', params);
  }

  /**
   * Obtenir un centre par ID
   * GET /centres/:id
   */
  @Get(':id')
  async getById(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ): Promise<Centre> {
    return this.centresService.findById(id, tenantId || 'default');
  }

  /**
   * Obtenir les disponibilités d'un centre pour une date
   * GET /centres/:id/disponibilites?date=2024-12-15&type_controle=CTP
   */
  @Get(':id/disponibilites')
  async getDisponibilites(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') centreId: string,
    @Query() query: GetDisponibilitesQueryDto,
  ): Promise<any> {
    // Verify centre exists
    await this.centresService.findById(centreId, tenantId || 'default');

    return this.disponibilitesService.getDisponibilites({
      centre_id: centreId,
      tenant_id: tenantId || 'default',
      date: query.date,
      type_controle: query.type_controle,
      type_vehicule: query.type_vehicule,
      carburant: query.carburant,
    });
  }

  /**
   * Obtenir les dates avec disponibilités
   * GET /centres/:id/dates-disponibles?type_controle=CTP&date_debut=2024-12-01&date_fin=2024-12-31
   */
  @Get(':id/dates-disponibles')
  async getDatesDisponibles(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') centreId: string,
    @Query() query: GetDatesDisponiblesQueryDto,
  ): Promise<{ dates: string[] }> {
    // Verify centre exists
    await this.centresService.findById(centreId, tenantId || 'default');

    const dates = await this.disponibilitesService.getDatesDisponibles({
      centre_id: centreId,
      tenant_id: tenantId || 'default',
      date_debut: query.date_debut,
      date_fin: query.date_fin,
      type_controle: query.type_controle,
      type_vehicule: query.type_vehicule,
      carburant: query.carburant,
    });

    return { dates };
  }

  /**
   * Obtenir les centres à proximité
   * GET /centres/nearby?latitude=48.8566&longitude=2.3522&rayon_km=20
   */
  @Get('nearby')
  async getNearby(
    @Headers('x-tenant-id') tenantId: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('rayon_km') rayonKm?: string,
    @Query('limit') limit?: string,
  ): Promise<Centre[]> {
    return this.centresService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      tenantId || 'default',
      rayonKm ? parseInt(rayonKm, 10) : 30,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Créer un nouveau centre (Admin)
   * POST /centres
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() centreData: Partial<Centre>,
  ): Promise<Centre> {
    return this.centresService.create(centreData, tenantId || 'default');
  }

  /**
   * Mettre à jour un centre
   * PUT /centres/:id
   */
  @Put(':id')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() centreData: Partial<Centre>,
  ): Promise<Centre> {
    return this.centresService.update(id, centreData, tenantId || 'default');
  }

  /**
   * Mettre à jour le statut d'un centre
   * PATCH /centres/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('status') status: CentreStatus,
  ): Promise<Centre> {
    return this.centresService.updateStatus(id, status, tenantId || 'default');
  }

  /**
   * Supprimer un centre
   * DELETE /centres/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.centresService.delete(id, tenantId || 'default');
  }

  /**
   * Obtenir les contrôleurs d'un centre
   * GET /centres/:id/controleurs
   */
  @Get(':id/controleurs')
  async getControleurs(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ): Promise<any[]> {
    return this.centresService.getControleurs(id, tenantId || 'default');
  }

  /**
   * Obtenir les tarifs d'un centre
   * GET /centres/:id/tarifs
   */
  @Get(':id/tarifs')
  async getTarifs(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ): Promise<any[]> {
    return this.centresService.getTarifs(id, tenantId || 'default');
  }
}
