import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AuditLog, AuditAction } from '../../domain/entities/audit-log.entity';

export interface AuditLogInput {
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  user_email?: string;
  tenant_id?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  success?: boolean;
  error_message?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      id: uuidv4(),
      action: input.action,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      user_id: input.user_id,
      user_email: input.user_email,
      tenant_id: input.tenant_id,
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      old_values: input.old_values,
      new_values: input.new_values,
      metadata: input.metadata,
      success: input.success ?? true,
      error_message: input.error_message,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByTenant(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findFailedLogins(tenantId?: string, limit: number = 50): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.action = :action', { action: AuditAction.LOGIN_FAILED })
      .andWhere('audit.success = false')
      .orderBy('audit.created_at', 'DESC')
      .take(limit);

    if (tenantId) {
      query.andWhere('audit.tenant_id = :tenantId', { tenantId });
    }

    return query.getMany();
  }
}
