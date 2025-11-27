import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, AuditSearchParams, AuditContext, AuditEntry } from '../services/audit.service';
import { AuditAction, AuditCategory, AuditSeverity } from '../entities/audit-log.entity';

// DTOs
export class SearchAuditLogsDto {
  tenant_id?: string;
  user_id?: string;
  centre_id?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export class AuditStatsQueryDto {
  start_date: string;
  end_date: string;
}

export class CreateAuditLogDto {
  context: {
    tenant_id: string;
    user_id?: string;
    user_email?: string;
    user_role?: string;
    centre_id?: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
  };
  entry: {
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
  };
}

export class ExportAuditLogsDto extends SearchAuditLogsDto {
  format: 'csv' | 'json' | 'xlsx';
}

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

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU')
  @ApiOperation({ summary: 'Search audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'tenant_id', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'centre_id', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'category', required: false, enum: AuditCategory })
  @ApiQuery({ name: 'severity', required: false, enum: AuditSeverity })
  @ApiQuery({ name: 'entity_type', required: false })
  @ApiQuery({ name: 'entity_id', required: false })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  async searchLogs(@Query() query: SearchAuditLogsDto, @Req() req: any) {
    const params: AuditSearchParams = {
      ...query,
      tenant_id: query.tenant_id || req.user?.tenant_id,
      start_date: query.start_date ? new Date(query.start_date) : undefined,
      end_date: query.end_date ? new Date(query.end_date) : undefined,
      page: query.page || 1,
      limit: Math.min(query.limit || 50, 100),
    };

    const result = await this.auditService.search(params);

    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(result.total / params.limit!),
      },
    };
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  async getLogById(@Param('id') id: string) {
    const log = await this.auditService.getById(id);
    return {
      success: true,
      data: log,
    };
  }

  @Get('entity/:entity_type/:entity_id/history')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU', 'RESPONSABLE_CENTRE')
  @ApiOperation({ summary: 'Get audit history for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity history retrieved successfully' })
  async getEntityHistory(
    @Param('entity_type') entity_type: string,
    @Param('entity_id') entity_id: string,
    @Req() req: any,
  ) {
    const tenant_id = req.user?.tenant_id;
    const history = await this.auditService.getEntityHistory(tenant_id, entity_type, entity_id);

    return {
      success: true,
      data: history,
    };
  }

  @Get('user/:user_id/activity')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU')
  @ApiOperation({ summary: 'Get user activity audit trail' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserActivity(
    @Param('user_id') user_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ) {
    const result = await this.auditService.search({
      tenant_id: req.user?.tenant_id,
      user_id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      limit: Math.min(limit || 100, 500),
      sort_by: 'created_at',
      sort_order: 'DESC',
    });

    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
      },
    };
  }

  @Get('centre/:centre_id/activity')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU', 'RESPONSABLE_CENTRE')
  @ApiOperation({ summary: 'Get centre activity audit trail' })
  @ApiResponse({ status: 200, description: 'Centre activity retrieved successfully' })
  async getCentreActivity(
    @Param('centre_id') centre_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ) {
    const result = await this.auditService.search({
      tenant_id: req.user?.tenant_id,
      centre_id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      limit: Math.min(limit || 100, 500),
      sort_by: 'created_at',
      sort_order: 'DESC',
    });

    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
      },
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN', 'RESPONSABLE_RESEAU')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  async getStats(@Query() query: AuditStatsQueryDto, @Req() req: any) {
    const tenant_id = req.user?.tenant_id;
    const start_date = new Date(query.start_date);
    const end_date = new Date(query.end_date);

    const stats = await this.auditService.getStats(tenant_id, start_date, end_date);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('stats/realtime')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get real-time audit statistics' })
  @ApiResponse({ status: 200, description: 'Real-time statistics retrieved successfully' })
  async getRealtimeStats(@Req() req: any) {
    const tenant_id = req.user?.tenant_id;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyStats, dailyStats] = await Promise.all([
      this.auditService.getStats(tenant_id, oneHourAgo, now),
      this.auditService.getStats(tenant_id, oneDayAgo, now),
    ]);

    return {
      success: true,
      data: {
        last_hour: hourlyStats,
        last_24_hours: dailyStats,
        timestamp: now.toISOString(),
      },
    };
  }

  @Get('security/failed-logins')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get failed login attempts for security monitoring' })
  @ApiResponse({ status: 200, description: 'Failed logins retrieved successfully' })
  @ApiQuery({ name: 'hours', required: false, type: Number })
  async getFailedLogins(@Query('hours') hours?: number, @Req() req?: any) {
    const tenant_id = req.user?.tenant_id;
    const now = new Date();
    const startTime = new Date(now.getTime() - (hours || 24) * 60 * 60 * 1000);

    const result = await this.auditService.search({
      tenant_id,
      action: AuditAction.LOGIN_FAILED,
      start_date: startTime,
      end_date: now,
      limit: 500,
      sort_by: 'created_at',
      sort_order: 'DESC',
    });

    // Group by IP address
    const byIp: Record<string, { count: number; emails: Set<string>; lastAttempt: Date }> = {};
    for (const log of result.data) {
      const ip = log.ip_address || 'unknown';
      if (!byIp[ip]) {
        byIp[ip] = { count: 0, emails: new Set(), lastAttempt: log.created_at };
      }
      byIp[ip].count++;
      if (log.user_email) byIp[ip].emails.add(log.user_email);
      if (new Date(log.created_at) > byIp[ip].lastAttempt) {
        byIp[ip].lastAttempt = new Date(log.created_at);
      }
    }

    const suspicious = Object.entries(byIp)
      .filter(([, data]) => data.count >= 5)
      .map(([ip, data]) => ({
        ip_address: ip,
        attempt_count: data.count,
        targeted_emails: Array.from(data.emails),
        last_attempt: data.lastAttempt,
      }))
      .sort((a, b) => b.attempt_count - a.attempt_count);

    return {
      success: true,
      data: {
        total_failed_logins: result.total,
        suspicious_ips: suspicious,
        period_hours: hours || 24,
      },
    };
  }

  @Get('security/suspicious-activity')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get suspicious activity alerts' })
  @ApiResponse({ status: 200, description: 'Suspicious activity retrieved successfully' })
  async getSuspiciousActivity(@Req() req: any) {
    const tenant_id = req.user?.tenant_id;
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get high severity events
    const criticalEvents = await this.auditService.search({
      tenant_id,
      severity: AuditSeverity.CRITICAL,
      start_date: last24Hours,
      end_date: now,
      limit: 100,
    });

    // Get errors
    const errors = await this.auditService.search({
      tenant_id,
      action: AuditAction.ERROR_OCCURRED,
      start_date: last24Hours,
      end_date: now,
      limit: 100,
    });

    // Get permission denied events
    const permissionDenied = await this.auditService.search({
      tenant_id,
      action: AuditAction.PERMISSION_DENIED,
      start_date: last24Hours,
      end_date: now,
      limit: 100,
    });

    return {
      success: true,
      data: {
        critical_events: criticalEvents.data,
        errors: errors.data,
        permission_denied: permissionDenied.data,
        summary: {
          critical_count: criticalEvents.total,
          error_count: errors.total,
          permission_denied_count: permissionDenied.total,
        },
      },
    };
  }

  @Post('logs')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an audit log entry' })
  @ApiResponse({ status: 201, description: 'Audit log created successfully' })
  async createLog(@Body() dto: CreateAuditLogDto, @Req() req: any) {
    const context: AuditContext = {
      tenant_id: dto.context.tenant_id || req.user?.tenant_id,
      user_id: dto.context.user_id || req.user?.id,
      user_email: dto.context.user_email || req.user?.email,
      user_role: dto.context.user_role || req.user?.role,
      centre_id: dto.context.centre_id || req.user?.centre_id,
      ip_address: dto.context.ip_address || req.ip,
      user_agent: dto.context.user_agent || req.headers['user-agent'],
      session_id: dto.context.session_id,
    };

    const entry: AuditEntry = {
      action: dto.entry.action,
      category: dto.entry.category,
      severity: dto.entry.severity,
      entity_type: dto.entry.entity_type,
      entity_id: dto.entry.entity_id,
      old_values: dto.entry.old_values,
      new_values: dto.entry.new_values,
      description: dto.entry.description,
      metadata: dto.entry.metadata,
      error_message: dto.entry.error_message,
      error_stack: dto.entry.error_stack,
    };

    const log = await this.auditService.log(context, entry);

    return {
      success: true,
      data: { id: log.id },
    };
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiResponse({ status: 200, description: 'Export generated successfully' })
  async exportLogs(@Body() dto: ExportAuditLogsDto, @Req() req: any) {
    const params: AuditSearchParams = {
      ...dto,
      tenant_id: dto.tenant_id || req.user?.tenant_id,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      limit: 10000, // Max export limit
    };

    const result = await this.auditService.search(params);

    // Format based on requested format
    let exportData: string;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (dto.format) {
      case 'csv':
        exportData = this.formatAsCsv(result.data);
        contentType = 'text/csv';
        filename = `audit-export-${timestamp}.csv`;
        break;
      case 'json':
        exportData = JSON.stringify(result.data, null, 2);
        contentType = 'application/json';
        filename = `audit-export-${timestamp}.json`;
        break;
      case 'xlsx':
        // For XLSX, return base64 encoded data
        exportData = this.formatAsXlsxBase64(result.data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `audit-export-${timestamp}.xlsx`;
        break;
      default:
        exportData = JSON.stringify(result.data);
        contentType = 'application/json';
        filename = `audit-export-${timestamp}.json`;
    }

    // Log the export action
    await this.auditService.log(
      {
        tenant_id: req.user?.tenant_id,
        user_id: req.user?.id,
        user_email: req.user?.email,
        user_role: req.user?.role,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      },
      {
        action: AuditAction.EXPORT_GENERATED,
        category: AuditCategory.DATA_ACCESS,
        severity: AuditSeverity.INFO,
        description: `Audit logs exported (${result.total} records, format: ${dto.format})`,
        metadata: {
          export_format: dto.format,
          record_count: result.total,
          filters: dto,
        },
      },
    );

    return {
      success: true,
      data: {
        content: exportData,
        contentType,
        filename,
        recordCount: result.total,
      },
    };
  }

  private formatAsCsv(data: any[]): string {
    if (data.length === 0) return '';

    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Category',
      'Severity',
      'User ID',
      'User Email',
      'Centre ID',
      'Entity Type',
      'Entity ID',
      'Description',
      'IP Address',
    ];

    const rows = data.map((log) => [
      log.id,
      log.created_at,
      log.action,
      log.category,
      log.severity,
      log.user_id || '',
      log.user_email || '',
      log.centre_id || '',
      log.entity_type || '',
      log.entity_id || '',
      (log.description || '').replace(/"/g, '""'),
      log.ip_address || '',
    ]);

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return csvRows.join('\n');
  }

  private formatAsXlsxBase64(data: any[]): string {
    // Simplified XLSX generation - in production, use a proper library like exceljs
    // This returns a placeholder; real implementation would generate proper XLSX
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString).toString('base64');
  }

  @Get('compliance/gdpr')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN_SGS', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get GDPR compliance audit report' })
  @ApiResponse({ status: 200, description: 'GDPR report generated successfully' })
  async getGdprReport(
    @Query('user_email') user_email: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
    @Req() req: any,
  ) {
    const tenant_id = req.user?.tenant_id;

    // Get all activity related to a specific user (for data subject access request)
    const result = await this.auditService.search({
      tenant_id,
      search: user_email,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      limit: 10000,
    });

    // Categorize by data processing activity
    const dataAccess = result.data.filter((log) => log.category === AuditCategory.DATA_ACCESS);
    const dataModification = result.data.filter(
      (log) => log.category === AuditCategory.DATA_MODIFICATION,
    );
    const authentication = result.data.filter(
      (log) => log.category === AuditCategory.AUTHENTICATION,
    );

    return {
      success: true,
      data: {
        subject_email: user_email,
        report_period: {
          start: start_date,
          end: end_date,
        },
        summary: {
          total_events: result.total,
          data_access_events: dataAccess.length,
          data_modification_events: dataModification.length,
          authentication_events: authentication.length,
        },
        data_access_logs: dataAccess,
        data_modification_logs: dataModification,
        authentication_logs: authentication,
        generated_at: new Date().toISOString(),
        generated_by: req.user?.email,
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check audit service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const isHealthy = await this.auditService.healthCheck();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'audit-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: isHealthy,
        elasticsearch: isHealthy,
      },
    };
  }
}
