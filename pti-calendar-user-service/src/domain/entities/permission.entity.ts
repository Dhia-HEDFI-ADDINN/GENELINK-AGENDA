import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @CreateDateColumn()
  created_at: Date;
}

// Pre-defined system permissions
export const SYSTEM_PERMISSIONS = {
  // Tenant Management
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',

  // Centre Management
  CENTRE_CREATE: 'centre:create',
  CENTRE_READ: 'centre:read',
  CENTRE_UPDATE: 'centre:update',
  CENTRE_DELETE: 'centre:delete',

  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Planning Management
  PLANNING_CREATE: 'planning:create',
  PLANNING_READ: 'planning:read',
  PLANNING_UPDATE: 'planning:update',
  PLANNING_DELETE: 'planning:delete',

  // RDV Management
  RDV_CREATE: 'rdv:create',
  RDV_READ: 'rdv:read',
  RDV_UPDATE: 'rdv:update',
  RDV_CANCEL: 'rdv:cancel',

  // Payment Management
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',
  PAYMENT_REFUND: 'payment:refund',

  // Stats
  STATS_READ: 'stats:read',
  STATS_EXPORT: 'stats:export',

  // Admin
  ADMIN_ACCESS: 'admin:access',
};

// Permission assignments per role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Full access

  ADMIN_TENANT: [
    'centre:*',
    'user:*',
    'planning:*',
    'rdv:*',
    'payment:read',
    'payment:refund',
    'stats:*',
  ],

  ADMIN_AGENCE: [
    'centre:read',
    'user:read',
    'planning:*',
    'rdv:*',
    'payment:read',
    'stats:read',
  ],

  ADMIN_CT: [
    'planning:read',
    'planning:update',
    'rdv:read',
    'rdv:create',
    'rdv:update',
    'stats:read',
  ],

  CONTROLEUR: [
    'planning:read',
    'rdv:read',
    'rdv:update',
  ],

  CALL_CENTER: [
    'planning:read',
    'rdv:read',
    'rdv:create',
    'rdv:update',
    'rdv:cancel',
    'payment:create',
  ],

  CLIENT: [
    'rdv:read:own',
    'rdv:create',
    'rdv:cancel:own',
    'payment:create:own',
  ],

  API_KEY: [
    'planning:read',
    'rdv:read',
    'rdv:create',
  ],
};
