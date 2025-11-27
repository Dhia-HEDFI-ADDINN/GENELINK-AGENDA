import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',

  // RDV
  RDV_CREATED = 'RDV_CREATED',
  RDV_UPDATED = 'RDV_UPDATED',
  RDV_CANCELLED = 'RDV_CANCELLED',
  RDV_RESCHEDULED = 'RDV_RESCHEDULED',
  RDV_CHECKIN = 'RDV_CHECKIN',
  RDV_STARTED = 'RDV_STARTED',
  RDV_COMPLETED = 'RDV_COMPLETED',
  RDV_NO_SHOW = 'RDV_NO_SHOW',

  // Planning
  PLANNING_VIEWED = 'PLANNING_VIEWED',
  PLANNING_UPDATED = 'PLANNING_UPDATED',
  CRENEAU_BLOCKED = 'CRENEAU_BLOCKED',
  CRENEAU_UNBLOCKED = 'CRENEAU_UNBLOCKED',
  DISPONIBILITES_CALCULATED = 'DISPONIBILITES_CALCULATED',

  // Payment
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PROMO_CODE_APPLIED = 'PROMO_CODE_APPLIED',

  // Notifications
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',

  // Admin
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',

  CENTRE_CREATED = 'CENTRE_CREATED',
  CENTRE_UPDATED = 'CENTRE_UPDATED',
  CENTRE_ACTIVATED = 'CENTRE_ACTIVATED',
  CENTRE_DEACTIVATED = 'CENTRE_DEACTIVATED',

  CONTROLEUR_CREATED = 'CONTROLEUR_CREATED',
  CONTROLEUR_UPDATED = 'CONTROLEUR_UPDATED',
  CONTROLEUR_ASSIGNED = 'CONTROLEUR_ASSIGNED',

  TARIF_CREATED = 'TARIF_CREATED',
  TARIF_UPDATED = 'TARIF_UPDATED',

  // System
  EXPORT_GENERATED = 'EXPORT_GENERATED',
  IMPORT_COMPLETED = 'IMPORT_COMPLETED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  CACHE_INVALIDATED = 'CACHE_INVALIDATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',

  // Data Access
  DATA_VIEWED = 'DATA_VIEWED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  REPORT_GENERATED = 'REPORT_GENERATED',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  NOTIFICATION = 'NOTIFICATION',
  CONFIGURATION = 'CONFIGURATION',
}

@Entity('audit_logs')
@Index(['tenant_id', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['entity_type', 'entity_id'])
@Index(['action', 'created_at'])
@Index(['session_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid', { nullable: true })
  user_id: string | null;

  @Column({ nullable: true })
  user_email: string | null;

  @Column({ nullable: true })
  user_role: string | null;

  @Column({ nullable: true })
  user_name: string | null;

  @Column('uuid', { nullable: true })
  session_id: string | null;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditCategory,
  })
  category: AuditCategory;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO,
  })
  severity: AuditSeverity;

  @Column({ nullable: true })
  entity_type: string | null;

  @Column('uuid', { nullable: true })
  entity_id: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ nullable: true })
  ip_address: string | null;

  @Column({ nullable: true })
  user_agent: string | null;

  @Column({ nullable: true })
  request_id: string | null;

  @Column({ nullable: true })
  endpoint: string | null;

  @Column({ nullable: true })
  http_method: string | null;

  @Column({ nullable: true })
  response_status: number | null;

  @Column({ nullable: true })
  duration_ms: number | null;

  @Column({ nullable: true })
  error_message: string | null;

  @Column({ nullable: true })
  error_stack: string | null;

  @Column({ default: 'api' })
  source: string;

  @Column({ nullable: true })
  service_name: string | null;

  @Column({ nullable: true })
  correlation_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  geo_location: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

@Entity('audit_retention_policies')
export class AuditRetentionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({
    type: 'enum',
    enum: AuditCategory,
  })
  category: AuditCategory;

  @Column({ default: 365 })
  retention_days: number;

  @Column({ default: true })
  archive_before_delete: boolean;

  @Column({ nullable: true })
  archive_location: string | null;

  @CreateDateColumn()
  created_at: Date;
}
