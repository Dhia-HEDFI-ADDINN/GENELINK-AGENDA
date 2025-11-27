import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oauth_provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oauth_id: string;

  @Column({ type: 'uuid', array: true, default: '{}' })
  centre_ids: string[];

  @Column({ type: 'varchar', array: true, default: '{}' })
  permissions: string[];

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Helper methods
  getRoleNames(): string[] {
    return this.roles?.map(r => r.name) || [];
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some(r => r.name === roleName) || false;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  isAdminTenant(): boolean {
    return this.hasRole('ADMIN_TENANT');
  }

  canAccessCentre(centreId: string): boolean {
    if (this.isSuperAdmin() || this.isAdminTenant()) return true;
    return this.centre_ids.includes(centreId);
  }
}
