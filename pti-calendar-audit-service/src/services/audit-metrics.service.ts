import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLog, AuditAction, AuditCategory, AuditSeverity } from '../entities/audit-log.entity';

// Prometheus-compatible metrics format
interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  values: Array<{
    labels: Record<string, string>;
    value: number;
  }>;
}

interface AuditMetricsSnapshot {
  timestamp: Date;
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_category: Record<string, number>;
  events_by_severity: Record<string, number>;
  events_by_tenant: Record<string, number>;
  error_rate: number;
  failed_login_count: number;
  avg_events_per_minute: number;
}

@Injectable()
export class AuditMetricsService implements OnModuleInit {
  private readonly logger = new Logger(AuditMetricsService.name);
  private metricsCache: AuditMetricsSnapshot | null = null;
  private lastMetricsUpdate: Date = new Date(0);

  // In-memory counters for real-time metrics
  private counters = {
    total_events: 0,
    events_by_action: new Map<string, number>(),
    events_by_category: new Map<string, number>(),
    events_by_severity: new Map<string, number>(),
    events_by_tenant: new Map<string, number>(),
    errors: 0,
    failed_logins: 0,
  };

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async onModuleInit() {
    await this.refreshMetrics();
  }

  // Track new audit events in real-time
  trackEvent(log: AuditLog) {
    this.counters.total_events++;

    const actionKey = log.action;
    this.counters.events_by_action.set(
      actionKey,
      (this.counters.events_by_action.get(actionKey) || 0) + 1,
    );

    const categoryKey = log.category;
    this.counters.events_by_category.set(
      categoryKey,
      (this.counters.events_by_category.get(categoryKey) || 0) + 1,
    );

    const severityKey = log.severity;
    this.counters.events_by_severity.set(
      severityKey,
      (this.counters.events_by_severity.get(severityKey) || 0) + 1,
    );

    this.counters.events_by_tenant.set(
      log.tenant_id,
      (this.counters.events_by_tenant.get(log.tenant_id) || 0) + 1,
    );

    if (log.action === AuditAction.ERROR_OCCURRED) {
      this.counters.errors++;
    }

    if (log.action === AuditAction.LOGIN_FAILED) {
      this.counters.failed_logins++;
    }
  }

  // Refresh metrics from database every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get counts by action
      const actionCounts = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('audit.created_at >= :start', { start: oneHourAgo })
        .groupBy('audit.action')
        .getRawMany();

      // Get counts by category
      const categoryCounts = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('audit.created_at >= :start', { start: oneHourAgo })
        .groupBy('audit.category')
        .getRawMany();

      // Get counts by severity
      const severityCounts = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.severity', 'severity')
        .addSelect('COUNT(*)', 'count')
        .where('audit.created_at >= :start', { start: oneHourAgo })
        .groupBy('audit.severity')
        .getRawMany();

      // Get counts by tenant (top 10)
      const tenantCounts = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.tenant_id', 'tenant_id')
        .addSelect('COUNT(*)', 'count')
        .where('audit.created_at >= :start', { start: oneHourAgo })
        .groupBy('audit.tenant_id')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      // Get error count
      const errorCount = await this.auditLogRepository.count({
        where: {
          action: AuditAction.ERROR_OCCURRED,
          created_at: oneHourAgo as any, // TypeORM MoreThanOrEqual alternative
        },
      });

      // Get failed login count
      const failedLoginCount = await this.auditLogRepository.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          created_at: oneHourAgo as any,
        },
      });

      // Total events in last hour
      const totalEvents = await this.auditLogRepository
        .createQueryBuilder('audit')
        .where('audit.created_at >= :start', { start: oneHourAgo })
        .getCount();

      // Calculate error rate
      const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;

      // Calculate avg events per minute
      const avgEventsPerMinute = totalEvents / 60;

      this.metricsCache = {
        timestamp: now,
        total_events: totalEvents,
        events_by_action: actionCounts.reduce(
          (acc, curr) => ({ ...acc, [curr.action]: parseInt(curr.count, 10) }),
          {},
        ),
        events_by_category: categoryCounts.reduce(
          (acc, curr) => ({ ...acc, [curr.category]: parseInt(curr.count, 10) }),
          {},
        ),
        events_by_severity: severityCounts.reduce(
          (acc, curr) => ({ ...acc, [curr.severity]: parseInt(curr.count, 10) }),
          {},
        ),
        events_by_tenant: tenantCounts.reduce(
          (acc, curr) => ({ ...acc, [curr.tenant_id]: parseInt(curr.count, 10) }),
          {},
        ),
        error_rate: errorRate,
        failed_login_count: failedLoginCount,
        avg_events_per_minute: avgEventsPerMinute,
      };

      this.lastMetricsUpdate = now;
      this.logger.debug('Metrics refreshed successfully');
    } catch (error) {
      this.logger.error('Error refreshing metrics', error);
    }
  }

  // Get current metrics snapshot
  getMetrics(): AuditMetricsSnapshot | null {
    return this.metricsCache;
  }

  // Get Prometheus-formatted metrics
  getPrometheusMetrics(): string {
    const metrics: Metric[] = [];

    if (!this.metricsCache) {
      return '# No metrics available yet\n';
    }

    // Total events gauge
    metrics.push({
      name: 'pti_audit_events_total',
      help: 'Total audit events in the last hour',
      type: 'gauge',
      values: [{ labels: {}, value: this.metricsCache.total_events }],
    });

    // Events by action
    metrics.push({
      name: 'pti_audit_events_by_action',
      help: 'Audit events grouped by action',
      type: 'gauge',
      values: Object.entries(this.metricsCache.events_by_action).map(
        ([action, count]) => ({
          labels: { action },
          value: count,
        }),
      ),
    });

    // Events by category
    metrics.push({
      name: 'pti_audit_events_by_category',
      help: 'Audit events grouped by category',
      type: 'gauge',
      values: Object.entries(this.metricsCache.events_by_category).map(
        ([category, count]) => ({
          labels: { category },
          value: count,
        }),
      ),
    });

    // Events by severity
    metrics.push({
      name: 'pti_audit_events_by_severity',
      help: 'Audit events grouped by severity',
      type: 'gauge',
      values: Object.entries(this.metricsCache.events_by_severity).map(
        ([severity, count]) => ({
          labels: { severity },
          value: count,
        }),
      ),
    });

    // Events by tenant
    metrics.push({
      name: 'pti_audit_events_by_tenant',
      help: 'Audit events grouped by tenant',
      type: 'gauge',
      values: Object.entries(this.metricsCache.events_by_tenant).map(
        ([tenant_id, count]) => ({
          labels: { tenant_id },
          value: count,
        }),
      ),
    });

    // Error rate
    metrics.push({
      name: 'pti_audit_error_rate',
      help: 'Percentage of error events in the last hour',
      type: 'gauge',
      values: [{ labels: {}, value: this.metricsCache.error_rate }],
    });

    // Failed logins
    metrics.push({
      name: 'pti_audit_failed_logins',
      help: 'Number of failed login attempts in the last hour',
      type: 'gauge',
      values: [{ labels: {}, value: this.metricsCache.failed_login_count }],
    });

    // Events per minute
    metrics.push({
      name: 'pti_audit_events_per_minute',
      help: 'Average audit events per minute in the last hour',
      type: 'gauge',
      values: [{ labels: {}, value: this.metricsCache.avg_events_per_minute }],
    });

    // Format as Prometheus exposition format
    return this.formatPrometheusOutput(metrics);
  }

  private formatPrometheusOutput(metrics: Metric[]): string {
    let output = '';

    for (const metric of metrics) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      for (const value of metric.values) {
        const labelStr = Object.entries(value.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        if (labelStr) {
          output += `${metric.name}{${labelStr}} ${value.value}\n`;
        } else {
          output += `${metric.name} ${value.value}\n`;
        }
      }

      output += '\n';
    }

    return output;
  }

  // Get real-time counters (since service start)
  getRealTimeCounters() {
    return {
      total_events: this.counters.total_events,
      events_by_action: Object.fromEntries(this.counters.events_by_action),
      events_by_category: Object.fromEntries(this.counters.events_by_category),
      events_by_severity: Object.fromEntries(this.counters.events_by_severity),
      events_by_tenant: Object.fromEntries(this.counters.events_by_tenant),
      errors: this.counters.errors,
      failed_logins: this.counters.failed_logins,
      service_start: new Date().toISOString(),
    };
  }

  // Reset counters (for testing or after aggregation)
  resetCounters() {
    this.counters = {
      total_events: 0,
      events_by_action: new Map(),
      events_by_category: new Map(),
      events_by_severity: new Map(),
      events_by_tenant: new Map(),
      errors: 0,
      failed_logins: 0,
    };
  }

  // Get detailed stats for dashboard
  async getDashboardStats(tenant_id?: string): Promise<{
    today: AuditMetricsSnapshot;
    week: AuditMetricsSnapshot;
    month: AuditMetricsSnapshot;
    trends: {
      daily_totals: Array<{ date: string; count: number }>;
      hourly_distribution: Array<{ hour: number; count: number }>;
    };
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build base query
    const baseQuery = (startDate: Date) => {
      let query = this.auditLogRepository
        .createQueryBuilder('audit')
        .where('audit.created_at >= :start', { start: startDate });

      if (tenant_id) {
        query = query.andWhere('audit.tenant_id = :tenant_id', { tenant_id });
      }

      return query;
    };

    // Get daily totals for last 30 days
    const dailyTotals = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select("DATE_TRUNC('day', audit.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('audit.created_at >= :start', { start: monthStart })
      .groupBy("DATE_TRUNC('day', audit.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get hourly distribution
    const hourlyDistribution = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('EXTRACT(HOUR FROM audit.created_at)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('audit.created_at >= :start', { start: weekStart })
      .groupBy('EXTRACT(HOUR FROM audit.created_at)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Get counts for different periods
    const [todayCount, weekCount, monthCount] = await Promise.all([
      baseQuery(todayStart).getCount(),
      baseQuery(weekStart).getCount(),
      baseQuery(monthStart).getCount(),
    ]);

    return {
      today: {
        timestamp: now,
        total_events: todayCount,
        events_by_action: {},
        events_by_category: {},
        events_by_severity: {},
        events_by_tenant: {},
        error_rate: 0,
        failed_login_count: 0,
        avg_events_per_minute: todayCount / ((now.getTime() - todayStart.getTime()) / 60000),
      },
      week: {
        timestamp: now,
        total_events: weekCount,
        events_by_action: {},
        events_by_category: {},
        events_by_severity: {},
        events_by_tenant: {},
        error_rate: 0,
        failed_login_count: 0,
        avg_events_per_minute: weekCount / (7 * 24 * 60),
      },
      month: {
        timestamp: now,
        total_events: monthCount,
        events_by_action: {},
        events_by_category: {},
        events_by_severity: {},
        events_by_tenant: {},
        error_rate: 0,
        failed_login_count: 0,
        avg_events_per_minute: monthCount / (30 * 24 * 60),
      },
      trends: {
        daily_totals: dailyTotals.map((d) => ({
          date: d.date,
          count: parseInt(d.count, 10),
        })),
        hourly_distribution: hourlyDistribution.map((h) => ({
          hour: parseInt(h.hour, 10),
          count: parseInt(h.count, 10),
        })),
      },
    };
  }
}
