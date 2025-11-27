import { Controller, Get, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DisponibilitesService, DisponibilitesQuery } from './disponibilites.service';

@ApiTags('disponibilites')
@Controller('disponibilites')
@ApiBearerAuth()
export class DisponibilitesController {
  constructor(private readonly disponibilitesService: DisponibilitesService) {}

  @Get()
  @ApiOperation({ summary: 'Calculer les disponibilités pour un centre' })
  @ApiQuery({ name: 'centre_id', required: true, type: String })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Format: YYYY-MM-DD' })
  @ApiQuery({ name: 'type_controle', required: true, type: String, description: 'CTP, CVP, CV, CTC, etc.' })
  @ApiQuery({ name: 'type_vehicule', required: true, type: String, description: 'VP, VL, VU, L, PL' })
  @ApiQuery({ name: 'carburant', required: true, type: String, description: 'essence, diesel, gpl, electrique, etc.' })
  async getDisponibilites(
    @Query('centre_id') centreId: string,
    @Query('date') date: string,
    @Query('type_controle') typeControle: string,
    @Query('type_vehicule') typeVehicule: string,
    @Query('carburant') carburant: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    const query: DisponibilitesQuery = {
      centre_id: centreId,
      date,
      type_controle: typeControle,
      type_vehicule: typeVehicule,
      carburant,
    };

    // TODO: Récupérer les RDV existants depuis le RDV Service via HTTP ou Kafka
    const rdvExistants: any[] = [];

    return this.disponibilitesService.calculerDisponibilites(query, tenantId, rdvExistants);
  }
}
