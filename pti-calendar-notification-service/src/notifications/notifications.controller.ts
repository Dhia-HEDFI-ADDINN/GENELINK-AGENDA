import {
  Controller,
  Get,
  Post,
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
import { NotificationsService } from './notifications.service';
import {
  SendSmsDto,
  SendEmailDto,
  SendPushDto,
  SendTemplatedNotificationDto,
  CreateTemplateDto,
  RegisterPushSubscriptionDto,
  SearchNotificationsDto,
  NotificationResponseDto,
  NotificationStatsDto,
} from '../application/dto/notification.dto';
import { NotificationType } from '../domain/entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sms')
  @ApiOperation({ summary: 'Envoyer un SMS' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  async sendSms(
    @Body() dto: SendSmsDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-centre-id') centreId?: string,
  ) {
    return this.notificationsService.sendSms(dto, tenantId, centreId);
  }

  @Post('email')
  @ApiOperation({ summary: 'Envoyer un email' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-centre-id') centreId?: string,
  ) {
    return this.notificationsService.sendEmail(dto, tenantId, centreId);
  }

  @Post('push')
  @ApiOperation({ summary: 'Envoyer une notification push' })
  @ApiResponse({ status: 201, type: [NotificationResponseDto] })
  async sendPush(
    @Body() dto: SendPushDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-centre-id') centreId?: string,
  ) {
    return this.notificationsService.sendPush(dto, tenantId, centreId);
  }

  @Post('templated')
  @ApiOperation({ summary: 'Envoyer une notification depuis un template' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  async sendTemplated(
    @Body() dto: SendTemplatedNotificationDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.sendTemplated(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des notifications' })
  async search(
    @Query() query: SearchNotificationsDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.search(query, tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des notifications' })
  @ApiQuery({ name: 'centre_id', required: true })
  @ApiQuery({ name: 'date_debut', required: true })
  @ApiQuery({ name: 'date_fin', required: true })
  @ApiResponse({ status: 200, type: NotificationStatsDto })
  async getStats(
    @Query('centre_id') centreId: string,
    @Query('date_debut') dateDebut: string,
    @Query('date_fin') dateFin: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.getStats(centreId, dateDebut, dateFin, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une notification par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.findById(id, tenantId);
  }

  // ===== TEMPLATES =====

  @Get('templates')
  @ApiOperation({ summary: 'Lister les templates' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  async listTemplates(
    @Query('type') type: NotificationType,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.listTemplates(tenantId, type);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Créer un template' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.notificationsService.createTemplate(dto, tenantId);
  }

  // ===== PUSH SUBSCRIPTIONS =====

  @Get('push/vapid-key')
  @ApiOperation({ summary: 'Obtenir la clé publique VAPID' })
  getVapidKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Enregistrer un abonnement push' })
  async registerPushSubscription(
    @Body() dto: RegisterPushSubscriptionDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-client-id') clientId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.notificationsService.registerPushSubscription(dto, tenantId, clientId, userId);
  }

  @Delete('push/unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désabonner des notifications push' })
  async unregisterPushSubscription(
    @Body('endpoint') endpoint: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.notificationsService.unregisterPushSubscription(endpoint, tenantId);
  }

  // ===== ADMIN =====

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Traiter les notifications planifiées (admin)' })
  async processScheduled() {
    const count = await this.notificationsService.processScheduledNotifications();
    return { processed: count };
  }

  @Post('retry-failed')
  @ApiOperation({ summary: 'Réessayer les notifications échouées (admin)' })
  async retryFailed() {
    const count = await this.notificationsService.retryFailedNotifications();
    return { retried: count };
  }
}
