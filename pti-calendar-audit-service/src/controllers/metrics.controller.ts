import { Controller, Get, Query, Req, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditMetricsService } from '../services/audit-metrics.service';

// Simple JWT Guard placeholder
class JwtAuthGuard {
  canActivate() {
    return true;
  }
}

// Roles decorator placeholder
function Roles(...roles: string[]) {
  return function (target: any, key?: string, descriptor?: PropertyDescriptor) {
    return descriptor;
  };
}

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: AuditMetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics as JSON' })
  @ApiResponse({ status: 200, description: 'Metrics in JSON format' })
  getJsonMetrics() {
    const metrics = this.metricsService.getMetrics();
    const realtime = this.metricsService.getRealTimeCounters();

    return {
      success: true,
      data: {
        snapshot: metrics,
        realtime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'tenant_id', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getDashboardStats(@Query('tenant_id') tenant_id?: string, @Req() req?: any) {
    const effectiveTenantId = tenant_id || req?.user?.tenant_id;
    const stats = await this.metricsService.getDashboardStats(effectiveTenantId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time counters' })
  @ApiResponse({ status: 200, description: 'Real-time event counters' })
  getRealTimeCounters() {
    return {
      success: true,
      data: this.metricsService.getRealTimeCounters(),
    };
  }
}
