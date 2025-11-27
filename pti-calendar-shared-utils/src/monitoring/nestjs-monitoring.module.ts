/**
 * PTI Calendar - NestJS Monitoring Module
 * Provides monitoring capabilities for NestJS services
 */

import {
  Module,
  DynamicModule,
  Global,
  Injectable,
  NestMiddleware,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Controller,
  Get,
  Header,
  OnModuleInit,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response, NextFunction } from 'express';
import {
  MetricsRegistry,
  HealthChecker,
  AlertManager,
  createStandardMetrics,
  standardAlertRules,
  HealthCheckResult,
} from './index';

// Configuration interface
export interface MonitoringModuleConfig {
  serviceName: string;
  serviceVersion?: string;
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
  enableAlerts?: boolean;
  metricsPath?: string;
  healthPath?: string;
}

// Monitoring service
@Injectable()
export class MonitoringService implements OnModuleInit {
  public readonly metrics: MetricsRegistry;
  public readonly healthChecker: HealthChecker;
  public readonly alertManager: AlertManager;

  private config: MonitoringModuleConfig;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.config = {
      serviceName: 'unknown',
      serviceVersion: '1.0.0',
      enableMetrics: true,
      enableHealthChecks: true,
      enableAlerts: true,
    };

    this.metrics = new MetricsRegistry(this.config.serviceName, this.config.serviceVersion);
    this.healthChecker = new HealthChecker(this.config.serviceVersion);
    this.alertManager = new AlertManager();
  }

  configure(config: MonitoringModuleConfig): void {
    this.config = { ...this.config, ...config };
    (this.metrics as any).serviceName = config.serviceName;
    (this.metrics as any).serviceVersion = config.serviceVersion || '1.0.0';
  }

  async onModuleInit(): Promise<void> {
    // Register standard metrics
    if (this.config.enableMetrics) {
      createStandardMetrics(this.metrics);
    }

    // Register standard alert rules
    if (this.config.enableAlerts) {
      for (const rule of standardAlertRules) {
        this.alertManager.registerRule(rule);
      }
    }

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  private startSystemMetricsCollection(): void {
    // Collect system metrics every 15 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.setGauge('pti_process_memory_bytes', memUsage.heapUsed, { type: 'heap_used' });
      this.metrics.setGauge('pti_process_memory_bytes', memUsage.heapTotal, { type: 'heap_total' });
      this.metrics.setGauge('pti_process_memory_bytes', memUsage.rss, { type: 'rss' });
      this.metrics.setGauge('pti_process_memory_bytes', memUsage.external, { type: 'external' });

      // CPU usage (simplified - in production use proper CPU profiling)
      const cpuUsage = process.cpuUsage();
      const totalCpu = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      this.metrics.setGauge('pti_process_cpu_usage', totalCpu);
    }, 15000);
  }

  getPrometheusMetrics(): string {
    return this.metrics.getPrometheusMetrics();
  }

  getMetricsJson(): Record<string, unknown> {
    return this.metrics.getMetricsJson();
  }

  async getHealth(): Promise<HealthCheckResult> {
    return this.healthChecker.runChecks();
  }

  // Track HTTP request
  trackHttpRequest(method: string, path: string, status: number, duration: number): void {
    this.metrics.incrementCounter('pti_http_requests_total', { method, path, status: String(status) });
    this.metrics.observeHistogram('pti_http_request_duration_seconds', duration / 1000, { method, path, status: String(status) });
  }

  // Track database query
  trackDbQuery(operation: string, table: string, duration: number): void {
    this.metrics.incrementCounter('pti_db_queries_total', { operation, table });
    this.metrics.observeHistogram('pti_db_query_duration_seconds', duration / 1000, { operation, table });
  }

  // Track cache operation
  trackCacheOperation(operation: string, hit: boolean): void {
    this.metrics.incrementCounter('pti_cache_requests_total', {
      operation,
      result: hit ? 'hit' : 'miss',
    });
  }

  // Track business metrics
  trackRdvCreated(centreId: string, typeControle: string): void {
    this.metrics.incrementCounter('pti_rdv_created_total', {
      centre_id: centreId,
      type_controle: typeControle,
    });
  }

  trackRdvCancelled(centreId: string, reason: string): void {
    this.metrics.incrementCounter('pti_rdv_cancelled_total', {
      centre_id: centreId,
      reason,
    });
  }

  trackPayment(status: string, method: string, amount: number): void {
    this.metrics.incrementCounter('pti_payments_total', { status, method });
    this.metrics.incrementGauge('pti_payments_amount_total', { status }, amount);
  }

  // Track errors
  trackError(type: string, severity: string): void {
    this.metrics.incrementCounter('pti_errors_total', { type, severity });
  }
}

// Metrics middleware for Express/NestJS
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const path = this.normalizePath(req.path);

    // Track in-flight requests
    this.monitoringService.metrics.incrementGauge('pti_http_requests_in_flight', {
      method: req.method,
      path,
    });

    // On response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.monitoringService.trackHttpRequest(req.method, path, res.statusCode, duration);

      this.monitoringService.metrics.decrementGauge('pti_http_requests_in_flight', {
        method: req.method,
        path,
      });
    });

    next();
  }

  private normalizePath(path: string): string {
    // Replace UUIDs and IDs with placeholders for better metric grouping
    return path
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+/g, '/:id');
  }
}

// Interceptor for automatic error tracking
@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: (error) => {
          const severity = this.getSeverity(error);
          const type = error.constructor?.name || 'UnknownError';
          this.monitoringService.trackError(type, severity);
        },
      }),
    );
  }

  private getSeverity(error: any): string {
    if (error.status >= 500) return 'critical';
    if (error.status >= 400) return 'warning';
    return 'info';
  }
}

// Metrics controller
@Controller('metrics')
export class MetricsController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  getMetrics(): string {
    return this.monitoringService.getPrometheusMetrics();
  }

  @Get('json')
  getMetricsJson(): Record<string, unknown> {
    return this.monitoringService.getMetricsJson();
  }
}

// Health controller
@Controller('health')
export class HealthController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  async getHealth(): Promise<HealthCheckResult> {
    return this.monitoringService.getHealth();
  }

  @Get('live')
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReadiness(): Promise<HealthCheckResult> {
    return this.monitoringService.getHealth();
  }
}

// Module
@Global()
@Module({})
export class MonitoringModule {
  static forRoot(config: MonitoringModuleConfig): DynamicModule {
    return {
      module: MonitoringModule,
      providers: [
        {
          provide: MonitoringService,
          useFactory: () => {
            const service = new MonitoringService();
            service.configure(config);
            return service;
          },
        },
        MetricsMiddleware,
        MonitoringInterceptor,
      ],
      controllers: config.enableMetrics ? [MetricsController] : [],
      exports: [MonitoringService, MetricsMiddleware, MonitoringInterceptor],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: MonitoringModule,
      providers: [MonitoringService],
      exports: [MonitoringService],
    };
  }
}

// Export decorators and utilities
export { MetricsRegistry, HealthChecker, AlertManager } from './index';
