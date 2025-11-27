import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_system: boolean;

  @Column({ type: 'int', default: 0 })
  hierarchy_level: number;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  getPermissionNames(): string[] {
    return this.permissions?.map(p => p.name) || [];
  }
}

// Pre-defined system roles
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_TENANT = 'ADMIN_TENANT',
  ADMIN_AGENCE = 'ADMIN_AGENCE',
  ADMIN_CT = 'ADMIN_CT',
  CONTROLEUR = 'CONTROLEUR',
  CALL_CENTER = 'CALL_CENTER',
  CLIENT = 'CLIENT',
  API_KEY = 'API_KEY',
}

export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  [SystemRole.SUPER_ADMIN]: 100,
  [SystemRole.ADMIN_TENANT]: 80,
  [SystemRole.ADMIN_AGENCE]: 60,
  [SystemRole.ADMIN_CT]: 50,
  [SystemRole.CONTROLEUR]: 30,
  [SystemRole.CALL_CENTER]: 30,
  [SystemRole.CLIENT]: 10,
  [SystemRole.API_KEY]: 20,
};
