import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationTemplate, PushSubscription } from '../domain/entities/notification.entity';
import { SmsProvider } from '../providers/sms.provider';
import { EmailProvider } from '../providers/email.provider';
import { PushProvider } from '../providers/push.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationTemplate, PushSubscription])],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsProvider, EmailProvider, PushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
