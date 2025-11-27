import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Get tenant_id from various sources
    const tenantId =
      req.headers['x-tenant-id'] as string ||
      (req as any).user?.tenant_id ||
      req.query.tenant_id as string;

    if (tenantId) {
      // Set tenant context for Row-Level Security
      // This would be used if RLS is enabled in PostgreSQL
      try {
        await this.dataSource.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      } catch (error) {
        // RLS might not be configured, continue anyway
        console.debug('RLS tenant context not set:', error);
      }

      // Attach to request for easy access
      (req as any).tenantId = tenantId;
    }

    next();
  }
}
