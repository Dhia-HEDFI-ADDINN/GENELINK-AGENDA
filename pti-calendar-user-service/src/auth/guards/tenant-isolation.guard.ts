import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get tenant_id from header or params
    const requestedTenantId =
      request.headers['x-tenant-id'] ||
      request.params?.tenant_id ||
      request.body?.tenant_id;

    // If no tenant specified in request, allow (use user's tenant)
    if (!requestedTenantId) {
      return true;
    }

    // SUPER_ADMIN can access all tenants
    if (user?.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    // Check if user belongs to requested tenant
    if (user?.tenant_id !== requestedTenantId) {
      throw new ForbiddenException('Accès non autorisé à ce tenant');
    }

    return true;
  }
}
