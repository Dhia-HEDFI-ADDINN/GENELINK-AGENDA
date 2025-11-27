import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { AuditService, AuditContext, AuditEntry } from './audit.service';
import { AuditAction, AuditCategory, AuditSeverity } from '../entities/audit-log.entity';

interface KafkaAuditMessage {
  context: AuditContext;
  entry: AuditEntry;
  timestamp: string;
}

@Injectable()
export class AuditKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditKafkaConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly auditService: AuditService) {
    this.kafka = new Kafka({
      clientId: 'audit-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = this.kafka.consumer({ groupId: 'audit-service-group' });
  }

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    try {
      await this.consumer.connect();
      this.logger.log('Connected to Kafka');

      // Subscribe to all audit topics
      const topics = [
        'audit.auth',
        'audit.rdv',
        'audit.planning',
        'audit.payment',
        'audit.notification',
        'audit.admin',
        'audit.user',
        'audit.centre',
        'audit.system',
        'audit.error',
      ];

      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log(`Subscribed to ${topics.length} audit topics`);
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload) {
    try {
      if (!message.value) return;

      const data: KafkaAuditMessage = JSON.parse(message.value.toString());

      // Map topic to action if not provided
      if (!data.entry.action) {
        data.entry.action = this.mapTopicToAction(topic, data);
      }

      // Map category from topic
      if (!data.entry.category) {
        data.entry.category = this.mapTopicToCategory(topic);
      }

      await this.auditService.log(data.context, data.entry);

      this.logger.debug(`Processed audit event from ${topic}`, {
        action: data.entry.action,
        tenant_id: data.context.tenant_id,
      });
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}`, error);
    }
  }

  private mapTopicToCategory(topic: string): AuditCategory {
    const mapping: Record<string, AuditCategory> = {
      'audit.auth': AuditCategory.AUTHENTICATION,
      'audit.rdv': AuditCategory.DATA_MODIFICATION,
      'audit.planning': AuditCategory.DATA_MODIFICATION,
      'audit.payment': AuditCategory.PAYMENT,
      'audit.notification': AuditCategory.NOTIFICATION,
      'audit.admin': AuditCategory.CONFIGURATION,
      'audit.user': AuditCategory.DATA_MODIFICATION,
      'audit.centre': AuditCategory.DATA_MODIFICATION,
      'audit.system': AuditCategory.SYSTEM,
      'audit.error': AuditCategory.SYSTEM,
    };
    return mapping[topic] || AuditCategory.SYSTEM;
  }

  private mapTopicToAction(topic: string, data: KafkaAuditMessage): AuditAction {
    // Default action based on topic and metadata
    const metadata = data.entry.metadata || {};
    const operation = metadata.operation as string;

    switch (topic) {
      case 'audit.auth':
        if (operation === 'login') return AuditAction.LOGIN;
        if (operation === 'logout') return AuditAction.LOGOUT;
        if (operation === 'login_failed') return AuditAction.LOGIN_FAILED;
        return AuditAction.TOKEN_REFRESHED;

      case 'audit.rdv':
        if (operation === 'created') return AuditAction.RDV_CREATED;
        if (operation === 'updated') return AuditAction.RDV_UPDATED;
        if (operation === 'cancelled') return AuditAction.RDV_CANCELLED;
        if (operation === 'checkin') return AuditAction.RDV_CHECKIN;
        if (operation === 'started') return AuditAction.RDV_STARTED;
        if (operation === 'completed') return AuditAction.RDV_COMPLETED;
        if (operation === 'no_show') return AuditAction.RDV_NO_SHOW;
        return AuditAction.RDV_UPDATED;

      case 'audit.payment':
        if (operation === 'initiated') return AuditAction.PAYMENT_INITIATED;
        if (operation === 'succeeded') return AuditAction.PAYMENT_SUCCEEDED;
        if (operation === 'failed') return AuditAction.PAYMENT_FAILED;
        if (operation === 'refunded') return AuditAction.PAYMENT_REFUNDED;
        return AuditAction.PAYMENT_INITIATED;

      case 'audit.notification':
        if (operation === 'sent') return AuditAction.NOTIFICATION_SENT;
        if (operation === 'failed') return AuditAction.NOTIFICATION_FAILED;
        return AuditAction.NOTIFICATION_SENT;

      case 'audit.user':
        if (operation === 'created') return AuditAction.USER_CREATED;
        if (operation === 'updated') return AuditAction.USER_UPDATED;
        if (operation === 'deleted') return AuditAction.USER_DELETED;
        return AuditAction.USER_UPDATED;

      case 'audit.centre':
        if (operation === 'created') return AuditAction.CENTRE_CREATED;
        if (operation === 'updated') return AuditAction.CENTRE_UPDATED;
        return AuditAction.CENTRE_UPDATED;

      case 'audit.error':
        return AuditAction.ERROR_OCCURRED;

      default:
        return AuditAction.DATA_VIEWED;
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    this.logger.log('Disconnected from Kafka');
  }
}

// Kafka Producer for other services to send audit events
@Injectable()
export class AuditKafkaProducer implements OnModuleInit {
  private readonly logger = new Logger(AuditKafkaProducer.name);
  private kafka: Kafka;
  private producer: any;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'audit-producer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Audit Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect audit producer', error);
    }
  }

  async sendAuditEvent(
    topic: string,
    context: AuditContext,
    entry: AuditEntry,
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Kafka producer not connected, skipping audit event');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: context.tenant_id,
            value: JSON.stringify({
              context,
              entry,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to send audit event', error);
    }
  }

  // Convenience methods for common audit events
  async auditLogin(context: AuditContext, success: boolean, metadata?: Record<string, unknown>) {
    await this.sendAuditEvent('audit.auth', context, {
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      category: AuditCategory.AUTHENTICATION,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      description: success
        ? `User ${context.user_email} logged in`
        : `Failed login for ${context.user_email}`,
      metadata: { ...metadata, operation: success ? 'login' : 'login_failed' },
    });
  }

  async auditRdv(
    context: AuditContext,
    operation: 'created' | 'updated' | 'cancelled' | 'checkin' | 'started' | 'completed' | 'no_show',
    rdv_id: string,
    old_values?: Record<string, unknown>,
    new_values?: Record<string, unknown>,
  ) {
    await this.sendAuditEvent('audit.rdv', context, {
      action: this.getRdvAction(operation),
      category: AuditCategory.DATA_MODIFICATION,
      severity: AuditSeverity.INFO,
      entity_type: 'rdv',
      entity_id: rdv_id,
      old_values,
      new_values,
      description: `RDV ${rdv_id} ${operation}`,
      metadata: { operation },
    });
  }

  private getRdvAction(operation: string): AuditAction {
    const mapping: Record<string, AuditAction> = {
      created: AuditAction.RDV_CREATED,
      updated: AuditAction.RDV_UPDATED,
      cancelled: AuditAction.RDV_CANCELLED,
      checkin: AuditAction.RDV_CHECKIN,
      started: AuditAction.RDV_STARTED,
      completed: AuditAction.RDV_COMPLETED,
      no_show: AuditAction.RDV_NO_SHOW,
    };
    return mapping[operation] || AuditAction.RDV_UPDATED;
  }

  async auditPayment(
    context: AuditContext,
    operation: 'initiated' | 'succeeded' | 'failed' | 'refunded',
    payment_id: string,
    amount: number,
    metadata?: Record<string, unknown>,
  ) {
    const actionMapping: Record<string, AuditAction> = {
      initiated: AuditAction.PAYMENT_INITIATED,
      succeeded: AuditAction.PAYMENT_SUCCEEDED,
      failed: AuditAction.PAYMENT_FAILED,
      refunded: AuditAction.PAYMENT_REFUNDED,
    };

    await this.sendAuditEvent('audit.payment', context, {
      action: actionMapping[operation],
      category: AuditCategory.PAYMENT,
      severity: operation === 'failed' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      entity_type: 'payment',
      entity_id: payment_id,
      description: `Payment ${payment_id} ${operation} - ${amount}€`,
      metadata: { ...metadata, operation, amount },
    });
  }

  async auditError(
    context: AuditContext,
    error: Error,
    metadata?: Record<string, unknown>,
  ) {
    await this.sendAuditEvent('audit.error', context, {
      action: AuditAction.ERROR_OCCURRED,
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.ERROR,
      description: error.message,
      error_message: error.message,
      error_stack: error.stack,
      metadata: { ...metadata, operation: 'error' },
    });
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
