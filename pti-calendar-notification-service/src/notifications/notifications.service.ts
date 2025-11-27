import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, In } from 'typeorm';
import * as Handlebars from 'handlebars';
import {
  Notification,
  NotificationTemplate,
  PushSubscription,
  NotificationType,
  NotificationStatus,
  NotificationCategory,
} from '../domain/entities/notification.entity';
import { SmsProvider } from '../providers/sms.provider';
import { EmailProvider } from '../providers/email.provider';
import { PushProvider } from '../providers/push.provider';
import {
  SendSmsDto,
  SendEmailDto,
  SendPushDto,
  SendTemplatedNotificationDto,
  CreateTemplateDto,
  RegisterPushSubscriptionDto,
  SearchNotificationsDto,
  NotificationStatsDto,
} from '../application/dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    private readonly smsProvider: SmsProvider,
    private readonly emailProvider: EmailProvider,
    private readonly pushProvider: PushProvider,
  ) {}

  // ===== SMS =====

  async sendSms(dto: SendSmsDto, tenantId: string, centreId?: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenant_id: tenantId,
      centre_id: centreId,
      rdv_id: dto.rdv_id,
      client_id: dto.client_id,
      type: NotificationType.SMS,
      category: dto.category || NotificationCategory.SYSTEM,
      status: dto.scheduled_at ? NotificationStatus.PENDING : NotificationStatus.SENDING,
      recipient_phone: dto.phone,
      content: dto.content,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
      metadata: dto.metadata,
    });

    await this.notificationRepository.save(notification);

    // Envoi immédiat si pas planifié
    if (!dto.scheduled_at) {
      await this.processSms(notification);
    }

    return notification;
  }

  private async processSms(notification: Notification): Promise<void> {
    const result = await this.smsProvider.send(notification.recipient_phone, notification.content);

    if (result.success) {
      notification.status = NotificationStatus.SENT;
      notification.sent_at = new Date();
      notification.provider = 'twilio';
      notification.provider_message_id = result.messageId;
      notification.cost = result.cost;
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.error_message = result.error;
      notification.retry_count++;
    }

    await this.notificationRepository.save(notification);
  }

  // ===== EMAIL =====

  async sendEmail(dto: SendEmailDto, tenantId: string, centreId?: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenant_id: tenantId,
      centre_id: centreId,
      rdv_id: dto.rdv_id,
      client_id: dto.client_id,
      type: NotificationType.EMAIL,
      category: dto.category || NotificationCategory.SYSTEM,
      status: dto.scheduled_at ? NotificationStatus.PENDING : NotificationStatus.SENDING,
      recipient_email: dto.email,
      recipient_name: dto.recipient_name,
      subject: dto.subject,
      content: dto.content,
      html_content: dto.html_content,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
      metadata: dto.metadata,
    });

    await this.notificationRepository.save(notification);

    if (!dto.scheduled_at) {
      await this.processEmail(notification);
    }

    return notification;
  }

  private async processEmail(notification: Notification): Promise<void> {
    const result = await this.emailProvider.send({
      to: notification.recipient_email,
      subject: notification.subject,
      text: notification.content,
      html: notification.html_content,
    });

    if (result.success) {
      notification.status = NotificationStatus.SENT;
      notification.sent_at = new Date();
      notification.provider = 'smtp';
      notification.provider_message_id = result.messageId;
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.error_message = result.error;
      notification.retry_count++;
    }

    await this.notificationRepository.save(notification);
  }

  // ===== PUSH =====

  async sendPush(dto: SendPushDto, tenantId: string, centreId?: string): Promise<Notification[]> {
    // Récupérer les subscriptions du client
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { tenant_id: tenantId, client_id: dto.client_id, actif: true },
    });

    if (subscriptions.length === 0) {
      this.logger.warn(`No push subscriptions found for client ${dto.client_id}`);
      return [];
    }

    const notifications: Notification[] = [];

    for (const subscription of subscriptions) {
      const notification = this.notificationRepository.create({
        tenant_id: tenantId,
        centre_id: centreId,
        rdv_id: dto.rdv_id,
        client_id: dto.client_id,
        type: NotificationType.PUSH,
        category: dto.category || NotificationCategory.SYSTEM,
        status: NotificationStatus.SENDING,
        push_subscription_endpoint: subscription.endpoint,
        subject: dto.title,
        content: dto.body,
        metadata: { ...dto.metadata, icon: dto.icon, url: dto.url },
      });

      await this.notificationRepository.save(notification);
      await this.processPush(notification, subscription);
      notifications.push(notification);
    }

    return notifications;
  }

  private async processPush(notification: Notification, subscription: PushSubscription): Promise<void> {
    const result = await this.pushProvider.send(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      {
        title: notification.subject,
        body: notification.content,
        icon: notification.metadata?.icon,
        url: notification.metadata?.url,
      },
    );

    if (result.success) {
      notification.status = NotificationStatus.SENT;
      notification.sent_at = new Date();
      notification.provider = 'webpush';
      subscription.last_used_at = new Date();
      await this.pushSubscriptionRepository.save(subscription);
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.error_message = result.error;

      // Désactiver l'abonnement expiré
      if (result.error === 'subscription_expired') {
        subscription.actif = false;
        await this.pushSubscriptionRepository.save(subscription);
      }
    }

    await this.notificationRepository.save(notification);
  }

  // ===== TEMPLATED NOTIFICATIONS =====

  async sendTemplated(dto: SendTemplatedNotificationDto, tenantId: string): Promise<Notification> {
    const template = await this.templateRepository.findOne({
      where: { tenant_id: tenantId, code: dto.template_code, type: dto.type, actif: true },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.template_code} not found`);
    }

    // Compiler le template avec Handlebars
    const contentCompiled = Handlebars.compile(template.content_template);
    const content = contentCompiled(dto.template_data);

    let subject: string | undefined;
    let htmlContent: string | undefined;

    if (template.subject_template) {
      const subjectCompiled = Handlebars.compile(template.subject_template);
      subject = subjectCompiled(dto.template_data);
    }

    if (template.html_template) {
      const htmlCompiled = Handlebars.compile(template.html_template);
      htmlContent = htmlCompiled(dto.template_data);
    }

    const notification = this.notificationRepository.create({
      tenant_id: tenantId,
      centre_id: dto.centre_id,
      rdv_id: dto.rdv_id,
      client_id: dto.client_id,
      type: dto.type,
      category: template.category,
      status: dto.scheduled_at ? NotificationStatus.PENDING : NotificationStatus.SENDING,
      recipient_phone: dto.phone,
      recipient_email: dto.email,
      subject,
      content,
      html_content: htmlContent,
      template_id: template.id,
      template_data: dto.template_data,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
    });

    await this.notificationRepository.save(notification);

    if (!dto.scheduled_at) {
      switch (dto.type) {
        case NotificationType.SMS:
          await this.processSms(notification);
          break;
        case NotificationType.EMAIL:
          await this.processEmail(notification);
          break;
      }
    }

    return notification;
  }

  // ===== SCHEDULED PROCESSING =====

  async processScheduledNotifications(): Promise<number> {
    const now = new Date();
    const notifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduled_at: LessThanOrEqual(now),
      },
      take: 100,
    });

    let processed = 0;

    for (const notification of notifications) {
      notification.status = NotificationStatus.SENDING;
      await this.notificationRepository.save(notification);

      switch (notification.type) {
        case NotificationType.SMS:
          await this.processSms(notification);
          break;
        case NotificationType.EMAIL:
          await this.processEmail(notification);
          break;
        case NotificationType.PUSH:
          // Pour push, on a besoin de la subscription
          const subscription = await this.pushSubscriptionRepository.findOne({
            where: { endpoint: notification.push_subscription_endpoint, actif: true },
          });
          if (subscription) {
            await this.processPush(notification, subscription);
          }
          break;
      }

      processed++;
    }

    return processed;
  }

  async retryFailedNotifications(): Promise<number> {
    const notifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.FAILED,
      },
    });

    // Filtrer ceux qui peuvent être réessayés
    const toRetry = notifications.filter((n) => n.retry_count < n.max_retries);
    let retried = 0;

    for (const notification of toRetry) {
      notification.status = NotificationStatus.SENDING;
      await this.notificationRepository.save(notification);

      switch (notification.type) {
        case NotificationType.SMS:
          await this.processSms(notification);
          break;
        case NotificationType.EMAIL:
          await this.processEmail(notification);
          break;
      }

      retried++;
    }

    return retried;
  }

  // ===== TEMPLATES =====

  async createTemplate(dto: CreateTemplateDto, tenantId: string): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
    return this.templateRepository.save(template);
  }

  async listTemplates(tenantId: string, type?: NotificationType): Promise<NotificationTemplate[]> {
    const where: any = { tenant_id: tenantId, actif: true };
    if (type) {
      where.type = type;
    }
    return this.templateRepository.find({ where, order: { category: 'ASC', name: 'ASC' } });
  }

  // ===== PUSH SUBSCRIPTIONS =====

  async registerPushSubscription(
    dto: RegisterPushSubscriptionDto,
    tenantId: string,
    clientId?: string,
    userId?: string,
  ): Promise<PushSubscription> {
    // Vérifier si déjà existant
    let subscription = await this.pushSubscriptionRepository.findOne({
      where: { tenant_id: tenantId, endpoint: dto.endpoint },
    });

    if (subscription) {
      subscription.p256dh = dto.p256dh;
      subscription.auth = dto.auth;
      subscription.actif = true;
    } else {
      subscription = this.pushSubscriptionRepository.create({
        tenant_id: tenantId,
        client_id: clientId,
        user_id: userId,
        ...dto,
      });
    }

    return this.pushSubscriptionRepository.save(subscription);
  }

  async unregisterPushSubscription(endpoint: string, tenantId: string): Promise<void> {
    await this.pushSubscriptionRepository.update(
      { tenant_id: tenantId, endpoint },
      { actif: false },
    );
  }

  getVapidPublicKey(): string {
    return this.pushProvider.getVapidPublicKey();
  }

  // ===== SEARCH & STATS =====

  async search(query: SearchNotificationsDto, tenantId: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.tenant_id = :tenantId', { tenantId });

    if (query.rdv_id) {
      queryBuilder.andWhere('n.rdv_id = :rdvId', { rdvId: query.rdv_id });
    }

    if (query.client_id) {
      queryBuilder.andWhere('n.client_id = :clientId', { clientId: query.client_id });
    }

    if (query.type) {
      queryBuilder.andWhere('n.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('n.status = :status', { status: query.status });
    }

    if (query.category) {
      queryBuilder.andWhere('n.category = :category', { category: query.category });
    }

    if (query.date_debut && query.date_fin) {
      queryBuilder.andWhere('n.created_at BETWEEN :dateDebut AND :dateFin', {
        dateDebut: query.date_debut,
        dateFin: query.date_fin,
      });
    }

    queryBuilder.orderBy('n.created_at', 'DESC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats(
    centreId: string,
    dateDebut: string,
    dateFin: string,
    tenantId: string,
  ): Promise<NotificationStatsDto> {
    const notifications = await this.notificationRepository.find({
      where: {
        tenant_id: tenantId,
        centre_id: centreId,
        created_at: Between(new Date(dateDebut), new Date(dateFin)),
      },
    });

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalCost = 0;
    let delivered = 0;

    for (const n of notifications) {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byStatus[n.status] = (byStatus[n.status] || 0) + 1;
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      if (n.cost) {
        totalCost += Number(n.cost);
      }
      if ([NotificationStatus.SENT, NotificationStatus.DELIVERED].includes(n.status)) {
        delivered++;
      }
    }

    return {
      total: notifications.length,
      by_type: byType as any,
      by_status: byStatus as any,
      by_category: byCategory as any,
      delivery_rate: notifications.length > 0 ? (delivered / notifications.length) * 100 : 0,
      total_cost: totalCost,
    };
  }

  async findById(id: string, tenantId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}
