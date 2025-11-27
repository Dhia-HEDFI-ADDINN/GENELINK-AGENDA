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
import { AdminService } from './admin.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  CreateCentreDto,
  UpdateCentreDto,
  CreateControleurDto,
  UpdateControleurDto,
  SearchTenantsDto,
  SearchCentresDto,
  TenantResponseDto,
  CentreResponseDto,
  ControleurResponseDto,
} from '../application/dto/admin.dto';

@ApiTags('admin')
@Controller()
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== TENANTS (Super Admin only) =====

  @Post('tenants')
  @ApiOperation({ summary: 'Créer un tenant' })
  @ApiResponse({ status: 201, type: TenantResponseDto })
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Lister/Rechercher les tenants' })
  async searchTenants(@Query() query: SearchTenantsDto) {
    return this.adminService.searchTenants(query);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Obtenir un tenant par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  async getTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findTenantById(id);
  }

  @Get('tenants/by-code/:code')
  @ApiOperation({ summary: 'Obtenir un tenant par code' })
  @ApiParam({ name: 'code', type: String })
  async getTenantByCode(@Param('code') code: string) {
    return this.adminService.findTenantByCode(code);
  }

  @Get('tenants/:id/children')
  @ApiOperation({ summary: 'Lister les tenants enfants' })
  @ApiParam({ name: 'id', type: String })
  async getChildTenants(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.listChildTenants(id);
  }

  @Get('tenants/:id/stats')
  @ApiOperation({ summary: 'Statistiques du tenant' })
  @ApiParam({ name: 'id', type: String })
  async getTenantStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getTenantStats(id);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Mettre à jour un tenant' })
  @ApiParam({ name: 'id', type: String })
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.adminService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un tenant' })
  @ApiParam({ name: 'id', type: String })
  async deleteTenant(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteTenant(id);
  }

  // ===== CENTRES =====

  @Post('centres')
  @ApiOperation({ summary: 'Créer un centre' })
  @ApiResponse({ status: 201, type: CentreResponseDto })
  async createCentre(
    @Body() dto: CreateCentreDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.createCentre(dto, tenantId);
  }

  @Get('centres')
  @ApiOperation({ summary: 'Lister/Rechercher les centres' })
  async searchCentres(
    @Query() query: SearchCentresDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.searchCentres(query, tenantId);
  }

  @Get('centres/list')
  @ApiOperation({ summary: 'Lister tous les centres du tenant' })
  async listCentres(@Headers('x-tenant-id') tenantId: string) {
    return this.adminService.listCentres(tenantId);
  }

  @Get('centres/nearest')
  @ApiOperation({ summary: 'Trouver les centres les plus proches' })
  async findNearestCentres(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('limit') limit: number,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.findNearestCentres(lat, lng, tenantId, limit);
  }

  @Get('centres/:id')
  @ApiOperation({ summary: 'Obtenir un centre par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: CentreResponseDto })
  async getCentre(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.findCentreById(id, tenantId);
  }

  @Put('centres/:id')
  @ApiOperation({ summary: 'Mettre à jour un centre' })
  @ApiParam({ name: 'id', type: String })
  async updateCentre(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCentreDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.updateCentre(id, dto, tenantId);
  }

  @Delete('centres/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un centre' })
  @ApiParam({ name: 'id', type: String })
  async deleteCentre(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.adminService.deleteCentre(id, tenantId);
  }

  // ===== CONTROLEURS =====

  @Post('controleurs')
  @ApiOperation({ summary: 'Créer un contrôleur' })
  @ApiResponse({ status: 201, type: ControleurResponseDto })
  async createControleur(
    @Body() dto: CreateControleurDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.createControleur(dto, tenantId);
  }

  @Get('controleurs/centre/:centreId')
  @ApiOperation({ summary: 'Lister les contrôleurs d\'un centre' })
  @ApiParam({ name: 'centreId', type: String })
  async listControleursByCentre(
    @Param('centreId', ParseUUIDPipe) centreId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.listControleursByCentre(centreId, tenantId);
  }

  @Get('controleurs/:id')
  @ApiOperation({ summary: 'Obtenir un contrôleur par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ControleurResponseDto })
  async getControleur(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.findControleurById(id, tenantId);
  }

  @Put('controleurs/:id')
  @ApiOperation({ summary: 'Mettre à jour un contrôleur' })
  @ApiParam({ name: 'id', type: String })
  async updateControleur(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateControleurDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.adminService.updateControleur(id, dto, tenantId);
  }

  @Delete('controleurs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un contrôleur' })
  @ApiParam({ name: 'id', type: String })
  async deleteControleur(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.adminService.deleteControleur(id, tenantId);
  }
}
