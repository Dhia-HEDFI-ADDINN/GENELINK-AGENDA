import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, SystemRole, ROLE_HIERARCHY } from '../domain/entities/role.entity';
import { Permission, ROLE_PERMISSIONS } from '../domain/entities/permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { hierarchy_level: 'DESC' },
    });
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async getPermissionsForRole(roleName: string): Promise<string[]> {
    const role = await this.getRoleByName(roleName);
    return role?.getPermissionNames() || [];
  }

  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Check wildcard
    if (userPermissions.includes('*')) return true;

    // Direct match
    if (userPermissions.includes(requiredPermission)) return true;

    // Resource wildcard (e.g., 'rdv:*' matches 'rdv:read')
    const [resource] = requiredPermission.split(':');
    return userPermissions.includes(`${resource}:*`);
  }

  canManageRole(managerRoles: string[], targetRole: string): boolean {
    const managerMaxLevel = Math.max(
      ...managerRoles.map(r => ROLE_HIERARCHY[r as SystemRole] || 0)
    );
    const targetLevel = ROLE_HIERARCHY[targetRole as SystemRole] || 0;

    // Can only manage roles with lower hierarchy level
    return managerMaxLevel > targetLevel;
  }

  async seedDefaultRolesAndPermissions(): Promise<void> {
    // Seed permissions
    const permissionMap = new Map<string, Permission>();

    for (const [resource, actions] of Object.entries({
      tenant: ['create', 'read', 'update', 'delete'],
      centre: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update', 'delete'],
      planning: ['create', 'read', 'update', 'delete'],
      rdv: ['create', 'read', 'update', 'cancel'],
      payment: ['create', 'read', 'refund'],
      stats: ['read', 'export'],
      admin: ['access'],
    })) {
      for (const action of actions) {
        const name = `${resource}:${action}`;
        let permission = await this.permissionRepository.findOne({ where: { name } });

        if (!permission) {
          permission = this.permissionRepository.create({
            name,
            resource,
            action,
            description: `${action} permission for ${resource}`,
          });
          permission = await this.permissionRepository.save(permission);
        }

        permissionMap.set(name, permission);
      }
    }

    // Seed roles
    for (const [roleName, config] of Object.entries({
      SUPER_ADMIN: { description: 'Super administrateur', level: 100 },
      ADMIN_TENANT: { description: 'Administrateur tenant', level: 80 },
      ADMIN_AGENCE: { description: 'Administrateur agence', level: 60 },
      ADMIN_CT: { description: 'Administrateur centre', level: 50 },
      CONTROLEUR: { description: 'Contrôleur technique', level: 30 },
      CALL_CENTER: { description: 'Opérateur call center', level: 30 },
      CLIENT: { description: 'Client', level: 10 },
      API_KEY: { description: 'Accès API', level: 20 },
    })) {
      let role = await this.roleRepository.findOne({
        where: { name: roleName },
        relations: ['permissions'],
      });

      if (!role) {
        role = this.roleRepository.create({
          name: roleName,
          description: config.description,
          hierarchy_level: config.level,
          is_system: true,
          permissions: [],
        });
      }

      // Assign permissions based on ROLE_PERMISSIONS mapping
      const rolePermissionNames = ROLE_PERMISSIONS[roleName] || [];
      const permissions: Permission[] = [];

      for (const permName of rolePermissionNames) {
        if (permName === '*') {
          // Full access
          permissions.push(...permissionMap.values());
          break;
        } else if (permName.endsWith(':*')) {
          // Resource wildcard
          const resource = permName.replace(':*', '');
          for (const [name, perm] of permissionMap) {
            if (name.startsWith(`${resource}:`)) {
              permissions.push(perm);
            }
          }
        } else {
          // Specific permission
          const perm = permissionMap.get(permName);
          if (perm) {
            permissions.push(perm);
          }
        }
      }

      role.permissions = permissions;
      await this.roleRepository.save(role);
    }

    console.log('Default roles and permissions seeded');
  }
}
