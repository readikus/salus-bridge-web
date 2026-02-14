import { AuditLogRepository } from "@/providers/repositories/audit-log.repository";
import { AuditLog, PaginationOptions, AuditFilters } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";

interface LogParams {
  userId?: string;
  organisationId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditLogService {
  /**
   * Create a new audit log entry.
   */
  static async log(params: LogParams): Promise<AuditLog> {
    return AuditLogRepository.create({
      userId: params.userId,
      organisationId: params.organisationId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    });
  }

  /**
   * Get the audit trail for a specific entity.
   */
  static async getEntityHistory(entity: string, entityId: string): Promise<AuditLog[]> {
    return AuditLogRepository.findByEntity(entity, entityId);
  }

  /**
   * Get all activity for a specific user (COMP-05: SAR readiness).
   */
  static async getUserActivity(userId: string, options?: PaginationOptions): Promise<AuditLog[]> {
    return AuditLogRepository.findByUser(userId, options);
  }

  /**
   * Get the full audit trail for an organisation with optional filters.
   */
  static async getOrganisationAuditTrail(organisationId: string, filters?: AuditFilters): Promise<AuditLog[]> {
    return AuditLogRepository.findByOrganisation(organisationId, filters);
  }
}
