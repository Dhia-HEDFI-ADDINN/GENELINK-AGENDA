import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REVOKE = 'ROLE_REVOKE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKE = 'TOKEN_REVOKE',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
}

@Entity('audit_logs')
@Index(['tenant_id', 'created_at'])
@Index(['user_id', 'action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  user_email: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  resource_type: string;

  @Column({ type: 'uuid', nullable: true })
  resource_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
