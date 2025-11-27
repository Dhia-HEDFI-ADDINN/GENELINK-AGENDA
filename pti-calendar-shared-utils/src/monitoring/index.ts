/**
 * PTI Calendar - Monitoring 360 Module
 * Provides Prometheus metrics, health checks, and alerting for all services
 */

// Types
export interface MetricLabels {
  [key: string]: string | number;
}

export interface HistogramBuckets {
  le: number;
  count: number;
}

export interface MetricValue {
  value: number;
  labels?: MetricLabels;
  timestamp?: Date;
}

export interface CounterConfig {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface GaugeConfig {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface HistogramConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

// Default buckets for HTTP response times
export const HTTP_REQUEST_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// Default buckets for database query times
export const DB_QUERY_BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5];

/**
 * Simple in-memory metrics registry for when Prometheus client is not available
 */
export class MetricsRegistry {
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, Map<string, { sum: number; count: number; buckets: Map<number, number> }>> = new Map();
  private configs: Map<string, CounterConfig | GaugeConfig | HistogramConfig> = new Map();

  // Service identification
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;

  constructor(serviceName: string, serviceVersion: string = '1.0.0') {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.environment = process.env.NODE_ENV || 'development';
  }

  private labelsToKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  // Counter methods
  registerCounter(config: CounterConfig): void {
    this.configs.set(config.name, config);
    this.counters.set(config.name, new Map());
  }

  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    const counter = this.counters.get(name);
    if (!counter) return;

    const key = this.labelsToKey(labels);
    const current = counter.get(key) || 0;
    counter.set(key, current + value);
  }

  // Gauge methods
  registerGauge(config: GaugeConfig): void {
    this.configs.set(config.name, config);
    this.gauges.set(config.name, new Map());
  }

  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    gauge.set(key, value);
  }

  incrementGauge(name: string, labels?: MetricLabels, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    const current = gauge.get(key) || 0;
    gauge.set(key, current + value);
  }

  decrementGauge(name: string, labels?: MetricLabels, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    const current = gauge.get(key) || 0;
    gauge.set(key, current - value);
  }

  // Histogram methods
  registerHistogram(config: HistogramConfig): void {
    this.configs.set(config.name, config);
    this.histograms.set(config.name, new Map());
  }

  observeHistogram(name: string, value: number, labels?: MetricLabels): void {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const config = this.configs.get(name) as HistogramConfig;
    const buckets = config?.buckets || HTTP_REQUEST_BUCKETS;

    const key = this.labelsToKey(labels);
    let data = histogram.get(key);

    if (!data) {
      data = {
        sum: 0,
        count: 0,
        buckets: new Map(buckets.map(b => [b, 0])),
      };
      histogram.set(key, data);
    }

    data.sum += value;
    data.count += 1;

    for (const bucket of buckets) {
      if (value <= bucket) {
        data.buckets.set(bucket, (data.buckets.get(bucket) || 0) + 1);
      }
    }
  }

  // Export metrics in Prometheus format
  getPrometheusMetrics(): string {
    let output = '';

    // Add service info
    output += `# Service: ${this.serviceName}\n`;
    output += `# Version: ${this.serviceVersion}\n`;
    output += `# Environment: ${this.environment}\n\n`;

    // Counters
    for (const [name, counter] of this.counters) {
      const config = this.configs.get(name) as CounterConfig;
      if (config) {
        output += `# HELP ${name} ${config.help}\n`;
        output += `# TYPE ${name} counter\n`;
      }

      for (const [labels, value] of counter) {
        if (labels) {
          output += `${name}{${labels}} ${value}\n`;
        } else {
          output += `${name} ${value}\n`;
        }
      }
      output += '\n';
    }

    // Gauges
    for (const [name, gauge] of this.gauges) {
      const config = this.configs.get(name) as GaugeConfig;
      if (config) {
        output += `# HELP ${name} ${config.help}\n`;
        output += `# TYPE ${name} gauge\n`;
      }

      for (const [labels, value] of gauge) {
        if (labels) {
          output += `${name}{${labels}} ${value}\n`;
        } else {
          output += `${name} ${value}\n`;
        }
      }
      output += '\n';
    }

    // Histograms
    for (const [name, histogram] of this.histograms) {
      const config = this.configs.get(name) as HistogramConfig;
      if (config) {
        output += `# HELP ${name} ${config.help}\n`;
        output += `# TYPE ${name} histogram\n`;
      }

      for (const [labels, data] of histogram) {
        const baseLabels = labels ? `${labels},` : '';

        for (const [bucket, count] of data.buckets) {
          output += `${name}_bucket{${baseLabels}le="${bucket}"} ${count}\n`;
        }
        output += `${name}_bucket{${baseLabels}le="+Inf"} ${data.count}\n`;
        output += `${name}_sum{${labels || ''}} ${data.sum}\n`;
        output += `${name}_count{${labels || ''}} ${data.count}\n`;
      }
      output += '\n';
    }

    return output;
  }

  // Get metrics as JSON
  getMetricsJson(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      service: this.serviceName,
      version: this.serviceVersion,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      counters: {},
      gauges: {},
      histograms: {},
    };

    for (const [name, counter] of this.counters) {
      (result.counters as Record<string, unknown>)[name] = Object.fromEntries(counter);
    }

    for (const [name, gauge] of this.gauges) {
      (result.gauges as Record<string, unknown>)[name] = Object.fromEntries(gauge);
    }

    for (const [name, histogram] of this.histograms) {
      (result.histograms as Record<string, unknown>)[name] = {};
      for (const [labels, data] of histogram) {
        ((result.histograms as Record<string, Record<string, unknown>>)[name])[labels || 'default'] = {
          sum: data.sum,
          count: data.count,
          avg: data.count > 0 ? data.sum / data.count : 0,
        };
      }
    }

    return result;
  }

  // Reset all metrics (useful for testing)
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.clear();
    }
    for (const gauge of this.gauges.values()) {
      gauge.clear();
    }
    for (const histogram of this.histograms.values()) {
      histogram.clear();
    }
  }
}

/**
 * Standard metrics for all PTI Calendar services
 */
export function createStandardMetrics(registry: MetricsRegistry): void {
  // HTTP metrics
  registry.registerCounter({
    name: 'pti_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
  });

  registry.registerHistogram({
    name: 'pti_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: HTTP_REQUEST_BUCKETS,
  });

  registry.registerGauge({
    name: 'pti_http_requests_in_flight',
    help: 'Number of HTTP requests currently being processed',
    labelNames: ['method', 'path'],
  });

  // Database metrics
  registry.registerCounter({
    name: 'pti_db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
  });

  registry.registerHistogram({
    name: 'pti_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: DB_QUERY_BUCKETS,
  });

  registry.registerGauge({
    name: 'pti_db_pool_connections',
    help: 'Number of database pool connections',
    labelNames: ['state'],
  });

  // Cache metrics
  registry.registerCounter({
    name: 'pti_cache_requests_total',
    help: 'Total number of cache requests',
    labelNames: ['operation', 'result'],
  });

  registry.registerGauge({
    name: 'pti_cache_keys_total',
    help: 'Total number of keys in cache',
  });

  // Business metrics
  registry.registerCounter({
    name: 'pti_rdv_created_total',
    help: 'Total number of RDVs created',
    labelNames: ['centre_id', 'type_controle'],
  });

  registry.registerCounter({
    name: 'pti_rdv_cancelled_total',
    help: 'Total number of RDVs cancelled',
    labelNames: ['centre_id', 'reason'],
  });

  registry.registerCounter({
    name: 'pti_payments_total',
    help: 'Total number of payments processed',
    labelNames: ['status', 'method'],
  });

  registry.registerGauge({
    name: 'pti_payments_amount_total',
    help: 'Total amount of payments in euros',
    labelNames: ['status'],
  });

  // Error metrics
  registry.registerCounter({
    name: 'pti_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'severity'],
  });

  // System metrics
  registry.registerGauge({
    name: 'pti_process_memory_bytes',
    help: 'Process memory usage in bytes',
    labelNames: ['type'],
  });

  registry.registerGauge({
    name: 'pti_process_cpu_usage',
    help: 'Process CPU usage percentage',
  });

  registry.registerGauge({
    name: 'pti_nodejs_event_loop_lag_seconds',
    help: 'Node.js event loop lag in seconds',
  });
}

/**
 * Health check interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'up' | 'down' | 'degraded';
    latency_ms?: number;
    message?: string;
    details?: Record<string, unknown>;
  }>;
  timestamp: string;
  version: string;
  uptime_seconds: number;
}

/**
 * Health checker for services
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<{ status: 'up' | 'down' | 'degraded'; latency_ms?: number; message?: string; details?: Record<string, unknown> }>> = new Map();
  private startTime: Date;
  private version: string;

  constructor(version: string = '1.0.0') {
    this.startTime = new Date();
    this.version = version;
  }

  registerCheck(name: string, check: () => Promise<{ status: 'up' | 'down' | 'degraded'; latency_ms?: number; message?: string; details?: Record<string, unknown> }>): void {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<HealthCheckResult> {
    const results: HealthCheckResult = {
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime_seconds: (Date.now() - this.startTime.getTime()) / 1000,
    };

    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const result = await check();
        const latency = Date.now() - start;

        results.checks[name] = {
          ...result,
          latency_ms: result.latency_ms ?? latency,
        };

        if (result.status === 'down') {
          results.status = 'unhealthy';
        } else if (result.status === 'degraded' && results.status === 'healthy') {
          results.status = 'degraded';
        }
      } catch (error) {
        results.checks[name] = {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        results.status = 'unhealthy';
      }
    }

    return results;
  }
}

/**
 * Standard health checks for PTI Calendar services
 */
export function createDatabaseHealthCheck(
  checkFn: () => Promise<boolean>,
): () => Promise<{ status: 'up' | 'down'; latency_ms?: number; message?: string }> {
  return async () => {
    const start = Date.now();
    try {
      const isHealthy = await checkFn();
      return {
        status: isHealthy ? 'up' : 'down',
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency_ms: Date.now() - start,
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  };
}

export function createRedisHealthCheck(
  checkFn: () => Promise<boolean>,
): () => Promise<{ status: 'up' | 'down'; latency_ms?: number; message?: string }> {
  return async () => {
    const start = Date.now();
    try {
      const isHealthy = await checkFn();
      return {
        status: isHealthy ? 'up' : 'down',
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency_ms: Date.now() - start,
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  };
}

export function createKafkaHealthCheck(
  checkFn: () => Promise<boolean>,
): () => Promise<{ status: 'up' | 'down'; latency_ms?: number; message?: string }> {
  return async () => {
    const start = Date.now();
    try {
      const isHealthy = await checkFn();
      return {
        status: isHealthy ? 'up' : 'down',
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency_ms: Date.now() - start,
        message: error instanceof Error ? error.message : 'Kafka check failed',
      };
    }
  };
}

/**
 * Alert manager interface
 */
export interface Alert {
  id: string;
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  labels: MetricLabels;
  value: number;
  threshold: number;
  fired_at: Date;
  resolved_at?: Date;
}

export type AlertHandler = (alert: Alert) => Promise<void>;

/**
 * Simple alert manager
 */
export class AlertManager {
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private handlers: AlertHandler[] = [];

  registerRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  registerHandler(handler: AlertHandler): void {
    this.handlers.push(handler);
  }

  async evaluate(metrics: Record<string, number>): Promise<void> {
    for (const rule of this.rules) {
      const value = metrics[rule.condition];
      if (value === undefined) continue;

      const alertId = `${rule.name}`;
      const isTriggered = value >= rule.threshold;
      const existingAlert = this.activeAlerts.get(alertId);

      if (isTriggered && !existingAlert) {
        // Fire new alert
        const alert: Alert = {
          id: alertId,
          rule: rule.name,
          severity: rule.severity,
          message: rule.message.replace('{value}', String(value)).replace('{threshold}', String(rule.threshold)),
          labels: {},
          value,
          threshold: rule.threshold,
          fired_at: new Date(),
        };

        this.activeAlerts.set(alertId, alert);

        for (const handler of this.handlers) {
          try {
            await handler(alert);
          } catch (error) {
            console.error(`Alert handler error for ${alertId}:`, error);
          }
        }
      } else if (!isTriggered && existingAlert) {
        // Resolve alert
        existingAlert.resolved_at = new Date();
        this.activeAlerts.delete(alertId);

        for (const handler of this.handlers) {
          try {
            await handler({ ...existingAlert, resolved_at: new Date() });
          } catch (error) {
            console.error(`Alert handler error for ${alertId}:`, error);
          }
        }
      }
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}

/**
 * Standard alert rules for PTI Calendar
 */
export const standardAlertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    condition: 'error_rate_percent',
    threshold: 5,
    duration: '5m',
    severity: 'critical',
    message: 'Error rate is {value}% (threshold: {threshold}%)',
  },
  {
    name: 'high_latency',
    condition: 'p99_latency_ms',
    threshold: 2000,
    duration: '5m',
    severity: 'warning',
    message: 'P99 latency is {value}ms (threshold: {threshold}ms)',
  },
  {
    name: 'high_memory_usage',
    condition: 'memory_usage_percent',
    threshold: 85,
    duration: '10m',
    severity: 'warning',
    message: 'Memory usage is {value}% (threshold: {threshold}%)',
  },
  {
    name: 'database_connection_pool_exhausted',
    condition: 'db_pool_available',
    threshold: 2,
    duration: '1m',
    severity: 'critical',
    message: 'Only {value} database connections available (threshold: {threshold})',
  },
  {
    name: 'failed_login_spike',
    condition: 'failed_logins_per_minute',
    threshold: 10,
    duration: '5m',
    severity: 'warning',
    message: '{value} failed logins per minute (threshold: {threshold})',
  },
];

// Export utilities
export { createStandardMetrics as initStandardMetrics };
