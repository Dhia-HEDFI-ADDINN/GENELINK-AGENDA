import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditLog,
  AuditAction,
  AuditCategory,
  AuditSeverity,
  AuditRetentionPolicy,
} from '../entities/audit-log.entity';

export interface AuditContext {
  tenant_id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  user_name?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  correlation_id?: string;
  source?: string;
  service_name?: string;
}

export interface AuditEntry {
  action: AuditAction;
  category: AuditCategory;
  severity?: AuditSeverity;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  endpoint?: string;
  http_method?: string;
  response_status?: number;
  duration_ms?: number;
  error_message?: string;
  error_stack?: string;
}

export interface AuditSearchParams {
  tenant_id: string;
  user_id?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  entity_type?: string;
  entity_id?: string;
  start_date?: Date;
  end_date?: Date;
  search_text?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface AuditStats {
  total_entries: number;
  by_action: Record<string, number>;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_user: Array<{ user_id: string; user_name: string; count: number }>;
  by_hour: Array<{ hour: number; count: number }>;
  errors_count: number;
  unique_users: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private elasticsearchClient: ElasticsearchClient | null = null;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AuditRetentionPolicy)
    private readonly retentionPolicyRepository: Repository<AuditRetentionPolicy>,
  ) {
    this.initElasticsearch();
  }

  private async initElasticsearch() {
    const esUrl = process.env.ELASTICSEARCH_URL;
    if (esUrl) {
      try {
        this.elasticsearchClient = new ElasticsearchClient({
          node: esUrl,
          auth: {
            username: process.env.ELASTICSEARCH_USER || 'elastic',
            password: process.env.ELASTICSEARCH_PASSWORD || '',
          },
        });
        await this.elasticsearchClient.ping();
        this.logger.log('Connected to Elasticsearch');
        await this.ensureIndex();
      } catch (error) {
        this.logger.warn('Elasticsearch not available, using PostgreSQL only');
        this.elasticsearchClient = null;
      }
    }
  }

  private async ensureIndex() {
    if (!this.elasticsearchClient) return;

    const indexName = 'pti-audit-logs';
    const exists = await this.elasticsearchClient.indices.exists({ index: indexName });

    if (!exists) {
      await this.elasticsearchClient.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              tenant_id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              user_email: { type: 'keyword' },
              user_name: { type: 'text' },
              action: { type: 'keyword' },
              category: { type: 'keyword' },
              severity: { type: 'keyword' },
              entity_type: { type: 'keyword' },
              entity_id: { type: 'keyword' },
              description: { type: 'text' },
              ip_address: { type: 'ip' },
              created_at: { type: 'date' },
              metadata: { type: 'object', enabled: false },
            },
          },
        },
      });
      this.logger.log('Created Elasticsearch index: pti-audit-logs');
    }
  }

  async log(context: AuditContext, entry: AuditEntry): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      id: uuidv4(),
      tenant_id: context.tenant_id,
      user_id: context.user_id || null,
      user_email: context.user_email || null,
      user_role: context.user_role || null,
      user_name: context.user_name || null,
      session_id: context.session_id || null,
      ip_address: context.ip_address || null,
      user_agent: context.user_agent || null,
      request_id: context.request_id || null,
      correlation_id: context.correlation_id || null,
      source: context.source || 'api',
      service_name: context.service_name || null,
      ...entry,
      severity: entry.severity || AuditSeverity.INFO,
    });

    // Save to PostgreSQL
    const savedLog = await this.auditLogRepository.save(auditLog);

    // Index in Elasticsearch (async, non-blocking)
    if (this.elasticsearchClient) {
      this.indexInElasticsearch(savedLog).catch((err) => {
        this.logger.error('Failed to index in Elasticsearch', err);
      });
    }

    // Log critical events to console
    if (entry.severity === AuditSeverity.CRITICAL || entry.severity === AuditSeverity.ERROR) {
      this.logger.warn(`[AUDIT] ${entry.action}: ${entry.description || 'No description'}`, {
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        entity: `${entry.entity_type}:${entry.entity_id}`,
      });
    }

    return savedLog;
  }

  private async indexInElasticsearch(log: AuditLog) {
    if (!this.elasticsearchClient) return;

    await this.elasticsearchClient.index({
      index: 'pti-audit-logs',
      id: log.id,
      body: {
        tenant_id: log.tenant_id,
        user_id: log.user_id,
        user_email: log.user_email,
        user_name: log.user_name,
        action: log.action,
        category: log.category,
        severity: log.severity,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        description: log.description,
        ip_address: log.ip_address,
        created_at: log.created_at,
        metadata: log.metadata,
      },
    });
  }

  async search(params: AuditSearchParams): Promise<{ data: AuditLog[]; total: number }> {
    const {
      tenant_id,
      user_id,
      action,
      category,
      severity,
      entity_type,
      entity_id,
      start_date,
      end_date,
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = params;

    const where: Record<string, unknown> = { tenant_id };

    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;

    if (start_date && end_date) {
      where.created_at = Between(start_date, end_date);
    } else if (start_date) {
      where.created_at = MoreThan(start_date);
    } else if (end_date) {
      where.created_at = LessThan(end_date);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { [sort_by]: sort_order },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total };
  }

  async getStats(
    tenant_id: string,
    start_date: Date,
    end_date: Date,
  ): Promise<AuditStats> {
    const baseQuery = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.tenant_id = :tenant_id', { tenant_id })
      .andWhere('audit.created_at BETWEEN :start_date AND :end_date', {
        start_date,
        end_date,
      });

    // Total count
    const total_entries = await baseQuery.clone().getCount();

    // By action
    const byActionResult = await baseQuery
      .clone()
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .getRawMany();
    const by_action = byActionResult.reduce(
      (acc, r) => ({ ...acc, [r.action]: parseInt(r.count) }),
      {},
    );

    // By category
    const byCategoryResult = await baseQuery
      .clone()
      .select('audit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.category')
      .getRawMany();
    const by_category = byCategoryResult.reduce(
      (acc, r) => ({ ...acc, [r.category]: parseInt(r.count) }),
      {},
    );

    // By severity
    const bySeverityResult = await baseQuery
      .clone()
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.severity')
      .getRawMany();
    const by_severity = bySeverityResult.reduce(
      (acc, r) => ({ ...acc, [r.severity]: parseInt(r.count) }),
      {},
    );

    // By user (top 10)
    const by_user = await baseQuery
      .clone()
      .select('audit.user_id', 'user_id')
      .addSelect('audit.user_name', 'user_name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.user_id')
      .addGroupBy('audit.user_name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // By hour
    const byHourResult = await baseQuery
      .clone()
      .select("EXTRACT(HOUR FROM audit.created_at)", 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy("EXTRACT(HOUR FROM audit.created_at)")
      .getRawMany();
    const by_hour = byHourResult.map((r) => ({
      hour: parseInt(r.hour),
      count: parseInt(r.count),
    }));

    // Errors count
    const errors_count = await baseQuery
      .clone()
      .andWhere('audit.severity IN (:...severities)', {
        severities: [AuditSeverity.ERROR, AuditSeverity.CRITICAL],
      })
      .getCount();

    // Unique users
    const uniqueUsersResult = await baseQuery
      .clone()
      .select('COUNT(DISTINCT audit.user_id)', 'count')
      .getRawOne();
    const unique_users = parseInt(uniqueUsersResult?.count || '0');

    return {
      total_entries,
      by_action,
      by_category,
      by_severity,
      by_user,
      by_hour,
      errors_count,
      unique_users,
    };
  }

  async getEntityHistory(
    tenant_id: string,
    entity_type: string,
    entity_id: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenant_id, entity_type, entity_id },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async getUserActivity(
    tenant_id: string,
    user_id: string,
    days: number = 30,
  ): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.auditLogRepository.find({
      where: {
        tenant_id,
        user_id,
        created_at: MoreThan(startDate),
      },
      order: { created_at: 'DESC' },
      take: 500,
    });
  }

  async getSecurityEvents(
    tenant_id: string,
    start_date: Date,
    end_date: Date,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        tenant_id,
        category: AuditCategory.AUTHENTICATION,
        created_at: Between(start_date, end_date),
      },
      order: { created_at: 'DESC' },
    });
  }

  async cleanup(tenant_id: string): Promise<number> {
    const policies = await this.retentionPolicyRepository.find({
      where: { tenant_id },
    });

    let totalDeleted = 0;

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

      const result = await this.auditLogRepository.delete({
        tenant_id,
        category: policy.category,
        created_at: LessThan(cutoffDate),
      });

      totalDeleted += result.affected || 0;
    }

    this.logger.log(`Cleaned up ${totalDeleted} audit logs for tenant ${tenant_id}`);
    return totalDeleted;
  }

  // Helper methods for common audit scenarios
  async logLogin(
    context: AuditContext,
    success: boolean,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(context, {
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      category: AuditCategory.AUTHENTICATION,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      description: success
        ? `User ${context.user_email} logged in successfully`
        : `Failed login attempt for ${context.user_email}`,
      metadata,
    });
  }

  async logDataAccess(
    context: AuditContext,
    entity_type: string,
    entity_id: string,
    action: 'VIEW' | 'EXPORT',
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(context, {
      action: action === 'VIEW' ? AuditAction.DATA_VIEWED : AuditAction.DATA_EXPORTED,
      category: AuditCategory.DATA_ACCESS,
      severity: AuditSeverity.INFO,
      entity_type,
      entity_id,
      description: `${action === 'VIEW' ? 'Viewed' : 'Exported'} ${entity_type} ${entity_id}`,
      metadata,
    });
  }

  async logDataModification(
    context: AuditContext,
    entity_type: string,
    entity_id: string,
    action: AuditAction,
    old_values?: Record<string, unknown>,
    new_values?: Record<string, unknown>,
    description?: string,
  ): Promise<AuditLog> {
    return this.log(context, {
      action,
      category: AuditCategory.DATA_MODIFICATION,
      severity: AuditSeverity.INFO,
      entity_type,
      entity_id,
      old_values,
      new_values,
      description: description || `${action} on ${entity_type} ${entity_id}`,
    });
  }

  async logError(
    context: AuditContext,
    error: Error,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(context, {
      action: AuditAction.ERROR_OCCURRED,
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.ERROR,
      description: error.message,
      error_message: error.message,
      error_stack: error.stack,
      metadata,
    });
  }
}
