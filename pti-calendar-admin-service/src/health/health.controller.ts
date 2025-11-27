import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    return { status: 'ok', service: 'admin-service', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  async ready() {
    const checks: Record<string, any> = {};
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = { status: 'ok' };
    } catch (e) {
      checks.database = { status: 'error', error: (e as Error).message };
    }
    const allHealthy = Object.values(checks).every((c: any) => c.status === 'ok');
    return { status: allHealthy ? 'ok' : 'degraded', service: 'admin-service', checks };
  }
}
