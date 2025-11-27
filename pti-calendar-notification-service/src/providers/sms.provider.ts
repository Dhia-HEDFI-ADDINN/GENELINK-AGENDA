import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

export interface SmsResult {
  success: boolean;
  messageId?: string;
  cost?: number;
  error?: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client: Twilio.Twilio | null = null;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER', '');

    if (accountSid && authToken) {
      this.client = Twilio.default(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured - SMS will be simulated');
    }
  }

  async send(to: string, content: string): Promise<SmsResult> {
    // Normaliser le numéro de téléphone
    const normalizedPhone = this.normalizePhone(to);

    if (!this.client) {
      // Mode simulation
      this.logger.log(`[SIMULATED SMS] To: ${normalizedPhone}, Content: ${content}`);
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        cost: 0.05,
      };
    }

    try {
      const message = await this.client.messages.create({
        body: content,
        from: this.fromNumber,
        to: normalizedPhone,
      });

      this.logger.log(`SMS sent: ${message.sid} to ${normalizedPhone}`);

      return {
        success: true,
        messageId: message.sid,
        cost: 0.05, // Coût approximatif
      };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${normalizedPhone}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStatus(messageId: string): Promise<{ status: string; errorCode?: string }> {
    if (!this.client) {
      return { status: 'delivered' };
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
      };
    } catch (error: any) {
      return {
        status: 'unknown',
        errorCode: error.message,
      };
    }
  }

  private normalizePhone(phone: string): string {
    // Supprimer les espaces et tirets
    let normalized = phone.replace(/[\s\-\.]/g, '');

    // Convertir le format français 0x en +33x
    if (normalized.startsWith('0')) {
      normalized = '+33' + normalized.substring(1);
    }

    // Ajouter le + si absent
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }
}
