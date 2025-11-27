import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Check for wildcard permission
    if (user.permissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((permission) => {
      // Direct match
      if (user.permissions.includes(permission)) {
        return true;
      }

      // Wildcard match (e.g., 'rdv:*' matches 'rdv:read')
      const [resource] = permission.split(':');
      return user.permissions.includes(`${resource}:*`);
    });

    if (!hasPermission) {
      throw new ForbiddenException(`Permission requise: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
