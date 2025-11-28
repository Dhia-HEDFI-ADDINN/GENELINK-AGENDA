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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RdvService } from './rdv.service';
import {
  CreateRdvDto,
  UpdateRdvDto,
  ReplanifierRdvDto,
  AnnulerRdvDto,
  ConfirmerRdvDto,
  EnregistrerResultatDto,
  SearchRdvDto,
  RdvResponseDto,
  PaginatedRdvResponseDto,
  RdvStatsDto,
} from '../application/dto/rdv.dto';

@ApiTags('rdv')
@Controller('rdv')
@ApiBearerAuth()
export class RdvController {
  constructor(private readonly rdvService: RdvService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rendez-vous' })
  @ApiResponse({ status: 201, description: 'RDV créé avec succès', type: RdvResponseDto })
  @ApiResponse({ status: 409, description: 'Créneau non disponible' })
  async create(
    @Body() dto: CreateRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des rendez-vous' })
  @ApiResponse({ status: 200, type: PaginatedRdvResponseDto })
  async search(
    @Query() query: SearchRdvDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rdvService.search(query, tenantId);
  }

  @Get('mes-rdv')
  @ApiOperation({ summary: 'Rechercher mes RDV par email/téléphone/référence' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'telephone', required: false })
  @ApiQuery({ name: 'reference', required: false })
  @ApiResponse({ status: 200, description: 'Liste des RDV du client' })
  async getMesRdv(
    @Query('email') email?: string,
    @Query('telephone') telephone?: string,
    @Query('reference') reference?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const query: SearchRdvDto = {};
    if (email) query.client_email = email;
    if (telephone) query.client_telephone = telephone;
    if (reference) query.reference = reference;
    query.limit = 50;

    return this.rdvService.search(query, tenantId || 'default');
  }

  @Post('create-with-payment')
  @ApiOperation({ summary: 'Créer un RDV avec intention de paiement' })
  @ApiResponse({ status: 201, description: 'RDV créé avec payment intent' })
  @HttpCode(HttpStatus.CREATED)
  async createWithPayment(
    @Body() dto: CreateRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    // Create the RDV
    const rdv = await this.rdvService.create(dto, tenantId || 'default', userId);

    // In a real implementation, we would create a Stripe PaymentIntent here
    // For now, return a mock response
    return {
      rdv_id: rdv.id,
      client_secret: `pi_${rdv.id.substring(0, 8)}_secret_mock`,
      payment_intent_id: `pi_${rdv.id.substring(0, 8)}`,
      prix_base: rdv.prix_ht || 6250,
      prix_total: rdv.prix_ttc || 7500,
      reduction: 0,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques des RDV pour un centre' })
  @ApiQuery({ name: 'centre_id', required: true })
  @ApiQuery({ name: 'date_debut', required: true })
  @ApiQuery({ name: 'date_fin', required: true })
  @ApiResponse({ status: 200, type: RdvStatsDto })
  async getStats(
    @Query('centre_id') centreId: string,
    @Query('date_debut') dateDebut: string,
    @Query('date_fin') dateFin: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rdvService.getStatsByCentre(centreId, dateDebut, dateFin, tenantId);
  }

  @Get('controleur/:controleurId')
  @ApiOperation({ summary: 'Obtenir les RDV d\'un contrôleur pour une date' })
  @ApiParam({ name: 'controleurId', type: String })
  @ApiQuery({ name: 'date', required: true })
  async getByControleur(
    @Param('controleurId', ParseUUIDPipe) controleurId: string,
    @Query('date') date: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rdvService.getRdvsByControleur(controleurId, date, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un rendez-vous par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  @ApiResponse({ status: 404, description: 'RDV non trouvé' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rdvService.findById(id, tenantId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtenir l\'historique d\'un RDV' })
  @ApiParam({ name: 'id', type: String })
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rdvService.getHistory(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rendez-vous' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.update(id, dto, tenantId, userId);
  }

  @Patch(':id/confirmer')
  @ApiOperation({ summary: 'Confirmer un rendez-vous' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async confirmer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmerRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.confirmer(id, dto, tenantId, userId);
  }

  @Patch(':id/replanifier')
  @ApiOperation({ summary: 'Replanifier un rendez-vous' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async replanifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplanifierRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.replanifier(id, dto, tenantId, userId);
  }

  @Patch(':id/annuler')
  @ApiOperation({ summary: 'Annuler un rendez-vous' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async annuler(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnnulerRdvDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.annuler(id, dto, tenantId, userId);
  }

  @Patch(':id/demarrer')
  @ApiOperation({ summary: 'Démarrer le contrôle' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async demarrerControle(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.demarrerControle(id, tenantId, userId);
  }

  @Patch(':id/resultat')
  @ApiOperation({ summary: 'Enregistrer le résultat du contrôle' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async enregistrerResultat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnregistrerResultatDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.enregistrerResultat(id, dto, tenantId, userId);
  }

  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Marquer le RDV comme no-show' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: RdvResponseDto })
  async marquerNoShow(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.rdvService.marquerNoShow(id, tenantId, userId);
  }
}
