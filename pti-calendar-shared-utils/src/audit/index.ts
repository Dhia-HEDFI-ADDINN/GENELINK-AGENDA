/**
 * PTI Calendar - Audit Client Module
 * Provides audit capabilities for all services
 */

import { Kafka, Producer, ProducerRecord } from 'kafkajs';

// Audit types
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // RDV Operations
  RDV_CREATED = 'RDV_CREATED',
  RDV_UPDATED = 'RDV_UPDATED',
  RDV_CANCELLED = 'RDV_CANCELLED',
  RDV_CHECKIN = 'RDV_CHECKIN',
  RDV_STARTED = 'RDV_STARTED',
  RDV_COMPLETED = 'RDV_COMPLETED',
  RDV_NO_SHOW = 'RDV_NO_SHOW',
  RDV_RESCHEDULED = 'RDV_RESCHEDULED',

  // Planning Operations
  PLANNING_VIEWED = 'PLANNING_VIEWED',
  PLANNING_UPDATED = 'PLANNING_UPDATED',
  CRENEAU_BLOCKED = 'CRENEAU_BLOCKED',
  CRENEAU_UNBLOCKED = 'CRENEAU_UNBLOCKED',
  HORAIRES_UPDATED = 'HORAIRES_UPDATED',

  // Payment Operations
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PROMO_CODE_APPLIED = 'PROMO_CODE_APPLIED',
  PROMO_CODE_REJECTED = 'PROMO_CODE_REJECTED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',

  // Centre Management
  CENTRE_CREATED = 'CENTRE_CREATED',
  CENTRE_UPDATED = 'CENTRE_UPDATED',
  CENTRE_ACTIVATED = 'CENTRE_ACTIVATED',
  CENTRE_DEACTIVATED = 'CENTRE_DEACTIVATED',
  CONTROLEUR_ASSIGNED = 'CONTROLEUR_ASSIGNED',
  LIGNE_CREATED = 'LIGNE_CREATED',
  LIGNE_UPDATED = 'LIGNE_UPDATED',

  // Notification
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  NOTIFICATION_CLICKED = 'NOTIFICATION_CLICKED',

  // Data Access
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_VIEWED = 'DATA_VIEWED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  EXPORT_GENERATED = 'EXPORT_GENERATED',

  // System
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_ACCESS = 'DATA_ACCESS',
  CONFIGURATION = 'CONFIGURATION',
  PAYMENT = 'PAYMENT',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditContext {
  tenant_id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  centre_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  correlation_id?: string;
}

export interface AuditEntry {
  action: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
  error_message?: string;
  error_stack?: string;
}

interface KafkaAuditMessage {
  context: AuditContext;
  entry: AuditEntry;
  timestamp: string;
  service: string;
}

/**
 * Audit client for sending audit events via Kafka
 */
export class AuditClient {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;
  private serviceName: string;
  private enabled: boolean;
  private pendingMessages: KafkaAuditMessage[] = [];
  private maxPendingMessages = 1000;

  constructor(serviceName: string, options?: { enabled?: boolean; brokers?: string[] }) {
    this.serviceName = serviceName;
    this.enabled = options?.enabled ?? process.env.AUDIT_ENABLED !== 'false';

    if (this.enabled) {
      const brokers = options?.brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
      this.kafka = new Kafka({
        clientId: `${serviceName}-audit-client`,
        brokers,
      });
      this.producer = this.kafka.producer();
    }
  }

  async connect(): Promise<void> {
    if (!this.enabled || !this.producer) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log(`[${this.serviceName}] Audit client connected`);

      // Send pending messages
      if (this.pendingMessages.length > 0) {
        console.log(`[${this.serviceName}] Sending ${this.pendingMessages.length} pending audit messages`);
        for (const msg of this.pendingMessages) {
          await this.sendToKafka(msg);
        }
        this.pendingMessages = [];
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to connect audit client:`, error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  private async sendToKafka(message: KafkaAuditMessage): Promise<void> {
    if (!this.producer || !this.isConnected) return;

    const topic = this.getTopicForAction(message.entry.action);

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.context.tenant_id,
            value: JSON.stringify(message),
          },
        ],
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send audit message:`, error);
    }
  }

  private getTopicForAction(action: AuditAction): string {
    if (action.startsWith('LOGIN') || action.startsWith('LOGOUT') || action.startsWith('PASSWORD') || action.startsWith('TOKEN') || action.startsWith('SESSION')) {
      return 'audit.auth';
    }
    if (action.startsWith('RDV')) {
      return 'audit.rdv';
    }
    if (action.startsWith('PLANNING') || action.startsWith('CRENEAU') || action.startsWith('HORAIRES')) {
      return 'audit.planning';
    }
    if (action.startsWith('PAYMENT') || action.startsWith('PROMO')) {
      return 'audit.payment';
    }
    if (action.startsWith('NOTIFICATION')) {
      return 'audit.notification';
    }
    if (action.startsWith('USER') || action.startsWith('ROLE') || action.startsWith('PERMISSION')) {
      return 'audit.user';
    }
    if (action.startsWith('CENTRE') || action.startsWith('CONTROLEUR') || action.startsWith('LIGNE')) {
      return 'audit.centre';
    }
    if (action === AuditAction.ERROR_OCCURRED) {
      return 'audit.error';
    }
    return 'audit.system';
  }

  async log(context: AuditContext, entry: AuditEntry): Promise<void> {
    if (!this.enabled) return;

    // Set defaults
    if (!entry.category) {
      entry.category = this.inferCategory(entry.action);
    }
    if (!entry.severity) {
      entry.severity = this.inferSeverity(entry.action);
    }

    const message: KafkaAuditMessage = {
      context,
      entry,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };

    if (this.isConnected) {
      await this.sendToKafka(message);
    } else {
      // Queue message for later
      if (this.pendingMessages.length < this.maxPendingMessages) {
        this.pendingMessages.push(message);
      }
    }
  }

  private inferCategory(action: AuditAction): AuditCategory {
    if (action.startsWith('LOGIN') || action.startsWith('LOGOUT') || action.startsWith('PASSWORD') || action.startsWith('TOKEN') || action.startsWith('SESSION')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (action.startsWith('PAYMENT') || action.startsWith('PROMO')) {
      return AuditCategory.PAYMENT;
    }
    if (action.startsWith('NOTIFICATION')) {
      return AuditCategory.NOTIFICATION;
    }
    if (action.startsWith('CONFIG') || action.startsWith('CENTRE') || action.startsWith('LIGNE')) {
      return AuditCategory.CONFIGURATION;
    }
    if (action === AuditAction.DATA_VIEWED || action === AuditAction.DATA_EXPORTED || action === AuditAction.REPORT_GENERATED) {
      return AuditCategory.DATA_ACCESS;
    }
    if (action === AuditAction.ERROR_OCCURRED || action === AuditAction.SYSTEM_ALERT) {
      return AuditCategory.SYSTEM;
    }
    return AuditCategory.DATA_MODIFICATION;
  }

  private inferSeverity(action: AuditAction): AuditSeverity {
    if (action === AuditAction.ERROR_OCCURRED) return AuditSeverity.ERROR;
    if (action === AuditAction.LOGIN_FAILED || action === AuditAction.PERMISSION_DENIED) return AuditSeverity.WARNING;
    if (action === AuditAction.PAYMENT_FAILED || action === AuditAction.NOTIFICATION_FAILED) return AuditSeverity.WARNING;
    if (action === AuditAction.SYSTEM_ALERT) return AuditSeverity.CRITICAL;
    return AuditSeverity.INFO;
  }

  // Convenience methods
  async logLogin(context: AuditContext, success: boolean, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(context, {
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      description: success
        ? `User ${context.user_email} logged in successfully`
        : `Failed login attempt for ${context.user_email}`,
      metadata,
    });
  }

  async logLogout(context: AuditContext): Promise<void> {
    await this.log(context, {
      action: AuditAction.LOGOUT,
      description: `User ${context.user_email} logged out`,
    });
  }

  async logRdvCreated(context: AuditContext, rdvId: string, rdvData: Record<string, unknown>): Promise<void> {
    await this.log(context, {
      action: AuditAction.RDV_CREATED,
      entity_type: 'rdv',
      entity_id: rdvId,
      new_values: rdvData,
      description: `RDV ${rdvId} created`,
    });
  }

  async logRdvUpdated(
    context: AuditContext,
    rdvId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
  ): Promise<void> {
    await this.log(context, {
      action: AuditAction.RDV_UPDATED,
      entity_type: 'rdv',
      entity_id: rdvId,
      old_values: oldValues,
      new_values: newValues,
      description: `RDV ${rdvId} updated`,
    });
  }

  async logRdvCancelled(context: AuditContext, rdvId: string, reason?: string): Promise<void> {
    await this.log(context, {
      action: AuditAction.RDV_CANCELLED,
      entity_type: 'rdv',
      entity_id: rdvId,
      description: `RDV ${rdvId} cancelled`,
      metadata: { reason },
    });
  }

  async logRdvStatusChange(
    context: AuditContext,
    rdvId: string,
    action: 'checkin' | 'started' | 'completed' | 'no_show',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      checkin: AuditAction.RDV_CHECKIN,
      started: AuditAction.RDV_STARTED,
      completed: AuditAction.RDV_COMPLETED,
      no_show: AuditAction.RDV_NO_SHOW,
    };

    await this.log(context, {
      action: actionMap[action],
      entity_type: 'rdv',
      entity_id: rdvId,
      description: `RDV ${rdvId} ${action}`,
      metadata,
    });
  }

  async logPayment(
    context: AuditContext,
    paymentId: string,
    status: 'initiated' | 'succeeded' | 'failed' | 'refunded',
    amount: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      initiated: AuditAction.PAYMENT_INITIATED,
      succeeded: AuditAction.PAYMENT_SUCCEEDED,
      failed: AuditAction.PAYMENT_FAILED,
      refunded: AuditAction.PAYMENT_REFUNDED,
    };

    await this.log(context, {
      action: actionMap[status],
      entity_type: 'payment',
      entity_id: paymentId,
      description: `Payment ${paymentId} ${status} - ${amount}€`,
      metadata: { ...metadata, amount },
    });
  }

  async logError(context: AuditContext, error: Error, metadata?: Record<string, unknown>): Promise<void> {
    await this.log(context, {
      action: AuditAction.ERROR_OCCURRED,
      description: error.message,
      error_message: error.message,
      error_stack: error.stack,
      metadata,
    });
  }

  async logDataAccess(
    context: AuditContext,
    action: 'viewed' | 'exported' | 'report',
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      viewed: AuditAction.DATA_VIEWED,
      exported: AuditAction.DATA_EXPORTED,
      report: AuditAction.REPORT_GENERATED,
    };

    await this.log(context, {
      action: actionMap[action],
      entity_type: entityType,
      entity_id: entityId,
      description: `${entityType} ${action}`,
      metadata,
    });
  }

  async logUserAction(
    context: AuditContext,
    action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated',
    userId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      created: AuditAction.USER_CREATED,
      updated: AuditAction.USER_UPDATED,
      deleted: AuditAction.USER_DELETED,
      activated: AuditAction.USER_ACTIVATED,
      deactivated: AuditAction.USER_DEACTIVATED,
    };

    await this.log(context, {
      action: actionMap[action],
      entity_type: 'user',
      entity_id: userId,
      old_values: oldValues,
      new_values: newValues,
      description: `User ${userId} ${action}`,
    });
  }

  async logCentreAction(
    context: AuditContext,
    action: 'created' | 'updated' | 'activated' | 'deactivated',
    centreId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      created: AuditAction.CENTRE_CREATED,
      updated: AuditAction.CENTRE_UPDATED,
      activated: AuditAction.CENTRE_ACTIVATED,
      deactivated: AuditAction.CENTRE_DEACTIVATED,
    };

    await this.log(context, {
      action: actionMap[action],
      entity_type: 'centre',
      entity_id: centreId,
      old_values: oldValues,
      new_values: newValues,
      description: `Centre ${centreId} ${action}`,
    });
  }

  async logNotification(
    context: AuditContext,
    notificationId: string,
    success: boolean,
    channel: 'email' | 'sms' | 'push',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log(context, {
      action: success ? AuditAction.NOTIFICATION_SENT : AuditAction.NOTIFICATION_FAILED,
      entity_type: 'notification',
      entity_id: notificationId,
      description: `Notification ${notificationId} ${success ? 'sent' : 'failed'} via ${channel}`,
      metadata: { ...metadata, channel },
    });
  }
}

/**
 * NestJS Module for Audit Client
 */
export function createAuditClient(serviceName: string): AuditClient {
  return new AuditClient(serviceName);
}

// Extract context from NestJS request
export function extractAuditContext(request: any, tenantId?: string): AuditContext {
  return {
    tenant_id: tenantId || request.headers['x-tenant-id'] || request.user?.tenant_id || 'unknown',
    user_id: request.user?.id,
    user_email: request.user?.email,
    user_role: request.user?.role,
    centre_id: request.user?.centre_id,
    ip_address: request.ip || request.connection?.remoteAddress,
    user_agent: request.headers['user-agent'],
    session_id: request.headers['x-session-id'],
    correlation_id: request.headers['x-correlation-id'] || request.headers['x-request-id'],
  };
}
