/**
 * PTI Calendar - Frontend Audit Client
 * Captures and sends audit events from frontend applications
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = typeof process !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000')
  : 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface AuditEvent {
  action: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'ERROR' | 'NAVIGATION';
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface AuditContext {
  app_name: string;
  app_version: string;
  page_path?: string;
  session_id?: string;
}

class AuditClient {
  private context: AuditContext;
  private queue: AuditEvent[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushIntervalMs: number = 5000;

  constructor(appName: string, appVersion: string = '1.0.0') {
    this.context = {
      app_name: appName,
      app_version: appVersion,
    };

    // Setup page visibility listener for flush on hide
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Set audit context
   */
  setContext(context: Partial<AuditContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    if (!this.isEnabled) return;

    const fullEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      context: {
        ...this.context,
        page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    };

    this.queue.push(fullEvent);

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    } else {
      // Schedule flush
      this.scheduleFlush();
    }
  }

  /**
   * Log page view
   */
  async logPageView(pagePath: string, pageTitle?: string): Promise<void> {
    await this.log({
      action: 'PAGE_VIEW',
      action_type: 'VIEW',
      entity_type: 'PAGE',
      entity_id: pagePath,
      metadata: { page_title: pageTitle },
    });
  }

  /**
   * Log user action
   */
  async logAction(
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action,
      action_type: this.inferActionType(action),
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  }

  /**
   * Log RDV creation
   */
  async logRdvCreated(rdvId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      action: 'RDV_CREATED',
      action_type: 'CREATE',
      entity_type: 'RDV',
      entity_id: rdvId,
      metadata,
    });
  }

  /**
   * Log RDV modification
   */
  async logRdvModified(rdvId: string, changes?: Record<string, unknown>): Promise<void> {
    await this.log({
      action: 'RDV_MODIFIED',
      action_type: 'UPDATE',
      entity_type: 'RDV',
      entity_id: rdvId,
      metadata: { changes },
    });
  }

  /**
   * Log RDV cancellation
   */
  async logRdvCancelled(rdvId: string, motif?: string): Promise<void> {
    await this.log({
      action: 'RDV_CANCELLED',
      action_type: 'DELETE',
      entity_type: 'RDV',
      entity_id: rdvId,
      metadata: { motif },
    });
  }

  /**
   * Log payment action
   */
  async logPayment(paymentId: string, status: string, amount: number): Promise<void> {
    await this.log({
      action: `PAYMENT_${status.toUpperCase()}`,
      action_type: status === 'COMPLETED' ? 'CREATE' : 'UPDATE',
      entity_type: 'PAYMENT',
      entity_id: paymentId,
      metadata: { status, amount },
    });
  }

  /**
   * Log login
   */
  async logLogin(userId: string, method: string = 'EMAIL'): Promise<void> {
    await this.log({
      action: 'USER_LOGIN',
      action_type: 'LOGIN',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { method },
    });
  }

  /**
   * Log logout
   */
  async logLogout(userId: string): Promise<void> {
    await this.log({
      action: 'USER_LOGOUT',
      action_type: 'LOGOUT',
      entity_type: 'USER',
      entity_id: userId,
    });
  }

  /**
   * Log error
   */
  async logError(error: Error | string, metadata?: Record<string, unknown>): Promise<void> {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: error };

    await this.log({
      action: 'ERROR_OCCURRED',
      action_type: 'ERROR',
      entity_type: 'ERROR',
      metadata: { error: errorInfo, ...metadata },
    });
  }

  /**
   * Log search action
   */
  async logSearch(query: string, entityType: string, resultsCount?: number): Promise<void> {
    await this.log({
      action: 'SEARCH_PERFORMED',
      action_type: 'VIEW',
      entity_type: entityType,
      metadata: { query, results_count: resultsCount },
    });
  }

  /**
   * Log file download
   */
  async logDownload(fileType: string, entityType: string, entityId?: string): Promise<void> {
    await this.log({
      action: 'FILE_DOWNLOADED',
      action_type: 'VIEW',
      entity_type: entityType,
      entity_id: entityId,
      metadata: { file_type: fileType },
    });
  }

  /**
   * Flush queued events to backend
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    try {
      await api.post('/audit/events/batch', { events });
    } catch (error) {
      // Re-queue events on failure (with max retry limit)
      console.error('Failed to send audit events:', error);
      // Optionally re-queue: this.queue.unshift(...events);
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private inferActionType(action: string): AuditEvent['action_type'] {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) return 'CREATE';
    if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) return 'UPDATE';
    if (actionLower.includes('delete') || actionLower.includes('remove') || actionLower.includes('cancel')) return 'DELETE';
    if (actionLower.includes('view') || actionLower.includes('read') || actionLower.includes('get')) return 'VIEW';
    if (actionLower.includes('login')) return 'LOGIN';
    if (actionLower.includes('logout')) return 'LOGOUT';
    if (actionLower.includes('error')) return 'ERROR';
    return 'VIEW';
  }
}

// Singleton instances for each app
let clientPwaAudit: AuditClient | null = null;
let proWebappAudit: AuditClient | null = null;
let adminWebappAudit: AuditClient | null = null;
let callcenterWebappAudit: AuditClient | null = null;

export function getAuditClient(appName: string): AuditClient {
  switch (appName) {
    case 'client-pwa':
      if (!clientPwaAudit) clientPwaAudit = new AuditClient('pti-calendar-client-pwa');
      return clientPwaAudit;
    case 'pro-webapp':
      if (!proWebappAudit) proWebappAudit = new AuditClient('pti-calendar-pro-webapp');
      return proWebappAudit;
    case 'admin-webapp':
      if (!adminWebappAudit) adminWebappAudit = new AuditClient('pti-calendar-admin-webapp');
      return adminWebappAudit;
    case 'callcenter-webapp':
      if (!callcenterWebappAudit) callcenterWebappAudit = new AuditClient('pti-calendar-callcenter-webapp');
      return callcenterWebappAudit;
    default:
      return new AuditClient(appName);
  }
}

export { AuditClient };
