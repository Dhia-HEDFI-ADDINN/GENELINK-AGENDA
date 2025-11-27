import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    this.defaultFrom = this.configService.get<string>('SMTP_FROM', 'noreply@pti-calendar.fr');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('SMTP not configured - Emails will be simulated');
    }
  }

  async send(params: EmailParams): Promise<EmailResult> {
    if (!this.transporter) {
      // Mode simulation
      this.logger.log(`[SIMULATED EMAIL] To: ${params.to}, Subject: ${params.subject}`);
      return {
        success: true,
        messageId: `sim_${Date.now()}@pti-calendar.fr`,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: params.from || this.defaultFrom,
        to: params.to,
        replyTo: params.replyTo,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });

      this.logger.log(`Email sent: ${info.messageId} to ${params.to}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${params.to}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
