import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Traiter les notifications planifiées toutes les minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    try {
      const count = await this.notificationsService.processScheduledNotifications();
      if (count > 0) {
        this.logger.log(`Processed ${count} scheduled notifications`);
      }
    } catch (error) {
      this.logger.error('Error processing scheduled notifications', error);
    }
  }

  // Réessayer les notifications échouées toutes les 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedNotifications() {
    try {
      const count = await this.notificationsService.retryFailedNotifications();
      if (count > 0) {
        this.logger.log(`Retried ${count} failed notifications`);
      }
    } catch (error) {
      this.logger.error('Error retrying failed notifications', error);
    }
  }
}
