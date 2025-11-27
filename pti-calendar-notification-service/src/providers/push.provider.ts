import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:contact@pti-calendar.fr');

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.isConfigured = true;
      this.logger.log('Web Push configured');
    } else {
      this.logger.warn('VAPID keys not configured - Push will be simulated');
    }
  }

  async send(subscription: PushSubscriptionData, payload: PushPayload): Promise<PushResult> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED PUSH] To: ${subscription.endpoint.substring(0, 50)}..., Title: ${payload.title}`);
      return { success: true };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 heures
          urgency: 'normal',
        },
      );

      this.logger.debug(`Push sent to ${subscription.endpoint.substring(0, 50)}...`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send push: ${error.message}`);

      // Si l'abonnement n'est plus valide (410 Gone)
      if (error.statusCode === 410) {
        return {
          success: false,
          error: 'subscription_expired',
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  getVapidPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY', '');
  }
}
