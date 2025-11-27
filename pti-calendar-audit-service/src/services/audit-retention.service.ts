import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLog, AuditRetentionPolicy, AuditSeverity } from '../entities/audit-log.entity';

interface RetentionConfig {
  defaultDays: number;
  criticalDays: number;
  archiveEnabled: boolean;
}

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AuditRetentionPolicy)
    private retentionPolicyRepository: Repository<AuditRetentionPolicy>,
    @Inject('AUDIT_CONFIG')
    private config: { retention: RetentionConfig },
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runRetentionCleanup() {
    this.logger.log('Starting daily audit retention cleanup');

    try {
      // Get all tenant retention policies
      const policies = await this.retentionPolicyRepository.find({
        where: { is_active: true },
      });

      // Process each tenant's retention
      for (const policy of policies) {
        await this.cleanupTenantAudits(policy);
      }

      // Cleanup default (tenants without specific policy)
      await this.cleanupDefaultRetention();

      this.logger.log('Audit retention cleanup completed');
    } catch (error) {
      this.logger.error('Error during retention cleanup', error);
    }
  }

  private async cleanupTenantAudits(policy: AuditRetentionPolicy) {
    const { tenant_id, retention_days, archive_before_delete } = policy;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention_days);

    try {
      // Find logs to delete (excluding CRITICAL severity which has longer retention)
      const logsToDelete = await this.auditLogRepository.find({
        where: {
          tenant_id,
          created_at: LessThan(cutoffDate),
          severity: LessThan(AuditSeverity.CRITICAL as any), // TypeORM comparison
        },
        take: 10000, // Process in batches
      });

      if (logsToDelete.length === 0) {
        return;
      }

      // Archive before delete if enabled
      if (archive_before_delete && this.config.retention.archiveEnabled) {
        await this.archiveLogs(tenant_id, logsToDelete);
      }

      // Delete old logs
      const ids = logsToDelete.map((log) => log.id);
      await this.auditLogRepository.delete(ids);

      this.logger.log(
        `Deleted ${logsToDelete.length} audit logs for tenant ${tenant_id}`,
      );

      // Update policy stats
      await this.retentionPolicyRepository.update(policy.id, {
        last_cleanup_at: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error cleaning up tenant ${tenant_id}`, error);
    }
  }

  private async cleanupDefaultRetention() {
    // Get tenants with custom policies
    const customPolicyTenants = await this.retentionPolicyRepository
      .createQueryBuilder('policy')
      .select('policy.tenant_id')
      .where('policy.is_active = :active', { active: true })
      .getMany();

    const excludedTenantIds = customPolicyTenants.map((p) => p.tenant_id);

    // Default retention cutoff
    const defaultCutoff = new Date();
    defaultCutoff.setDate(defaultCutoff.getDate() - this.config.retention.defaultDays);

    // Critical retention cutoff (longer for compliance)
    const criticalCutoff = new Date();
    criticalCutoff.setDate(criticalCutoff.getDate() - this.config.retention.criticalDays);

    try {
      // Delete non-critical logs past default retention
      let query = this.auditLogRepository
        .createQueryBuilder('audit')
        .delete()
        .where('created_at < :cutoff', { cutoff: defaultCutoff })
        .andWhere('severity != :critical', { critical: AuditSeverity.CRITICAL });

      if (excludedTenantIds.length > 0) {
        query = query.andWhere('tenant_id NOT IN (:...tenants)', {
          tenants: excludedTenantIds,
        });
      }

      const result = await query.execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(`Deleted ${result.affected} audit logs (default retention)`);
      }

      // Delete critical logs past critical retention
      query = this.auditLogRepository
        .createQueryBuilder('audit')
        .delete()
        .where('created_at < :cutoff', { cutoff: criticalCutoff })
        .andWhere('severity = :critical', { critical: AuditSeverity.CRITICAL });

      if (excludedTenantIds.length > 0) {
        query = query.andWhere('tenant_id NOT IN (:...tenants)', {
          tenants: excludedTenantIds,
        });
      }

      const criticalResult = await query.execute();

      if (criticalResult.affected && criticalResult.affected > 0) {
        this.logger.log(
          `Deleted ${criticalResult.affected} critical audit logs (extended retention)`,
        );
      }
    } catch (error) {
      this.logger.error('Error in default retention cleanup', error);
    }
  }

  private async archiveLogs(tenant_id: string, logs: AuditLog[]) {
    // In production, this would write to cold storage (S3, Azure Blob, etc.)
    // For now, we'll log the archive action
    this.logger.log(`Archiving ${logs.length} audit logs for tenant ${tenant_id}`);

    // Example: Write to S3 or other storage
    // const archiveData = JSON.stringify(logs);
    // await this.s3Service.putObject({
    //   Bucket: 'audit-archives',
    //   Key: `${tenant_id}/${new Date().toISOString()}/audit-logs.json.gz`,
    //   Body: gzip(archiveData),
    // });
  }

  // Manual cleanup methods for admin use
  async createRetentionPolicy(
    tenant_id: string,
    retention_days: number,
    archive_before_delete: boolean = true,
  ): Promise<AuditRetentionPolicy> {
    const policy = this.retentionPolicyRepository.create({
      tenant_id,
      retention_days,
      archive_before_delete,
      is_active: true,
    });

    return this.retentionPolicyRepository.save(policy);
  }

  async updateRetentionPolicy(
    tenant_id: string,
    updates: Partial<AuditRetentionPolicy>,
  ): Promise<AuditRetentionPolicy | null> {
    const policy = await this.retentionPolicyRepository.findOne({
      where: { tenant_id },
    });

    if (!policy) {
      return null;
    }

    Object.assign(policy, updates);
    return this.retentionPolicyRepository.save(policy);
  }

  async getRetentionPolicy(tenant_id: string): Promise<AuditRetentionPolicy | null> {
    return this.retentionPolicyRepository.findOne({
      where: { tenant_id },
    });
  }

  async getRetentionStats(): Promise<{
    total_logs: number;
    logs_by_severity: Record<string, number>;
    oldest_log: Date | null;
    storage_estimate_mb: number;
  }> {
    const totalLogs = await this.auditLogRepository.count();

    const severityCounts = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.severity')
      .getRawMany();

    const oldestLog = await this.auditLogRepository.findOne({
      order: { created_at: 'ASC' },
    });

    // Rough estimate: ~1KB per log entry
    const storageEstimateMb = (totalLogs * 1024) / (1024 * 1024);

    return {
      total_logs: totalLogs,
      logs_by_severity: severityCounts.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.severity]: parseInt(curr.count, 10),
        }),
        {},
      ),
      oldest_log: oldestLog?.created_at || null,
      storage_estimate_mb: Math.round(storageEstimateMb * 100) / 100,
    };
  }

  // Force cleanup for a specific tenant (admin action)
  async forceCleanup(
    tenant_id: string,
    retention_days: number,
  ): Promise<{ deleted_count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention_days);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('tenant_id = :tenant_id', { tenant_id })
      .andWhere('created_at < :cutoff', { cutoff: cutoffDate })
      .execute();

    this.logger.warn(
      `Force cleanup: Deleted ${result.affected} audit logs for tenant ${tenant_id}`,
    );

    return { deleted_count: result.affected || 0 };
  }
}
