import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== STATS ==========
  @Get('stats')
  async getGlobalStats(@Request() req: any) {
    return this.adminService.getGlobalStats();
  }

  // ========== USERS ==========
  @Get('users')
  async getUsers(
    @Query('search') search: string,
    @Query('role') role: string,
    @Query('actif') actif: string,
    @Query('reseau_id') reseau_id: string,
  ) {
    return this.adminService.getUsers({ search, role, actif, reseau_id });
  }

  @Post('users')
  async createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Put('users/:id/toggle-actif')
  async toggleUserActif(@Param('id') id: string) {
    return this.adminService.toggleUserActif(id);
  }

  // ========== ROLES ==========
  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  async createRole(@Body() data: any) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRole(id, data);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  // ========== PERMISSIONS ==========
  @Get('permissions')
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  // ========== RESEAUX ==========
  @Get('reseaux')
  async getReseaux() {
    return this.adminService.getReseaux();
  }

  @Post('reseaux')
  async createReseau(@Body() data: any) {
    return this.adminService.createReseau(data);
  }

  @Put('reseaux/:id')
  async updateReseau(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateReseau(id, data);
  }

  // ========== CENTRES ==========
  @Get('centres')
  async getCentres(
    @Query('reseau_id') reseau_id: string,
  ) {
    return this.adminService.getCentres({ reseau_id });
  }

  @Post('centres')
  async createCentre(@Body() data: any) {
    return this.adminService.createCentre(data);
  }

  @Put('centres/:id')
  async updateCentre(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCentre(id, data);
  }

  // ========== REPORTS ==========
  @Get('reports/stats')
  async getReportStats(
    @Query('date_debut') date_debut: string,
    @Query('date_fin') date_fin: string,
    @Query('reseau_id') reseau_id: string,
    @Query('centre_id') centre_id: string,
  ) {
    return this.adminService.getReportStats({
      date_debut,
      date_fin,
      reseau_id,
      centre_id,
    });
  }
}
