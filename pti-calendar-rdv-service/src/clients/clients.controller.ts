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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  UpdateClientDto,
  SearchClientDto,
  CreateVehiculeDto,
  UpdateVehiculeDto,
  ClientResponseDto,
  VehiculeResponseDto,
  PaginatedClientResponseDto,
} from '../application/dto/client.dto';

@ApiTags('clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès', type: ClientResponseDto })
  @ApiResponse({ status: 409, description: 'Client déjà existant' })
  async create(
    @Body() dto: CreateClientDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des clients' })
  @ApiResponse({ status: 200, type: PaginatedClientResponseDto })
  async search(
    @Query() query: SearchClientDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.search(query, tenantId);
  }

  @Get('by-phone/:telephone')
  @ApiOperation({ summary: 'Trouver un client par téléphone' })
  @ApiParam({ name: 'telephone', type: String })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async findByPhone(
    @Param('telephone') telephone: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findByPhone(telephone, tenantId);
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Trouver un client par email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async findByEmail(
    @Param('email') email: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findByEmail(email, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un client par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findById(id, tenantId);
  }

  @Get(':id/vehicules')
  @ApiOperation({ summary: 'Obtenir les véhicules d\'un client' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: [VehiculeResponseDto] })
  async getVehicules(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findVehiculesByClient(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Client supprimé' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.clientsService.delete(id, tenantId);
  }

  @Post(':sourceId/merge/:targetId')
  @ApiOperation({ summary: 'Fusionner deux clients' })
  @ApiParam({ name: 'sourceId', type: String })
  @ApiParam({ name: 'targetId', type: String })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async mergeClients(
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.mergeClients(sourceId, targetId, tenantId);
  }

  // Véhicules
  @Post('vehicules')
  @ApiOperation({ summary: 'Créer un nouveau véhicule' })
  @ApiResponse({ status: 201, description: 'Véhicule créé', type: VehiculeResponseDto })
  async createVehicule(
    @Body() dto: CreateVehiculeDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.createVehicule(dto, tenantId);
  }

  @Get('vehicules/by-immatriculation/:immatriculation')
  @ApiOperation({ summary: 'Trouver un véhicule par immatriculation' })
  @ApiParam({ name: 'immatriculation', type: String })
  @ApiResponse({ status: 200, type: VehiculeResponseDto })
  async findVehiculeByImmatriculation(
    @Param('immatriculation') immatriculation: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findVehiculeByImmatriculation(immatriculation, tenantId);
  }

  @Get('vehicules/:id')
  @ApiOperation({ summary: 'Obtenir un véhicule par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: VehiculeResponseDto })
  async findVehiculeById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.findVehiculeById(id, tenantId);
  }

  @Put('vehicules/:id')
  @ApiOperation({ summary: 'Mettre à jour un véhicule' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: VehiculeResponseDto })
  async updateVehicule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehiculeDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.clientsService.updateVehicule(id, dto, tenantId);
  }

  @Delete('vehicules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un véhicule' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Véhicule supprimé' })
  async deleteVehicule(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.clientsService.deleteVehicule(id, tenantId);
  }
}
