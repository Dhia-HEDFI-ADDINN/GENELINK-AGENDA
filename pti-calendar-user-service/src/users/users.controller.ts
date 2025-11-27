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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Lister les utilisateurs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.usersService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any,
  ) {
    // Users can view their own profile
    if (currentUser.id === id) {
      return this.usersService.findById(id);
    }
    return this.usersService.findById(id, tenantId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Créer un utilisateur' })
  async create(@Body() dto: CreateUserDto, @TenantId() tenantId: string) {
    return this.usersService.create({ ...dto, tenant_id: tenantId });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @TenantId() tenantId: string,
  ) {
    return this.usersService.update(id, dto, tenantId);
  }

  @Put(':id/roles')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Assigner des rôles à un utilisateur' })
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { roles: string[] },
    @TenantId() tenantId: string,
  ) {
    return this.usersService.assignRoles(id, body.roles, tenantId);
  }

  @Put(':id/deactivate')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Désactiver un utilisateur' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    await this.usersService.deactivate(id, tenantId);
    return { message: 'Utilisateur désactivé', success: true };
  }

  @Put(':id/activate')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Activer un utilisateur' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    await this.usersService.activate(id, tenantId);
    return { message: 'Utilisateur activé', success: true };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_TENANT')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    await this.usersService.delete(id, tenantId);
    return { message: 'Utilisateur supprimé', success: true };
  }
}
