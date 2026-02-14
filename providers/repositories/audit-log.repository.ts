import { pool } from "@/providers/database/pool";
import { AuditLog, CreateAuditLogParams, PaginationOptions, AuditFilters } from "@/types/database";

export class AuditLogRepository {
  /**
   * Create a new audit log entry.
   */
  static async create(entry: CreateAuditLogParams): Promise<AuditLog> {
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id, organisation_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         user_id AS "userId",
         organisation_id AS "organisationId",
         action,
         entity,
         entity_id AS "entityId",
         metadata,
         ip_address AS "ipAddress",
         created_at AS "createdAt"`,
      [
        entry.userId || null,
        entry.organisationId || null,
        entry.action,
        entry.entity,
        entry.entityId || null,
        JSON.stringify(entry.metadata || {}),
        entry.ipAddress || null,
      ],
    );

    return result.rows[0];
  }

  /**
   * Find audit log entries by entity type and entity ID.
   */
  static async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const result = await pool.query(
      `SELECT
         id,
         user_id AS "userId",
         organisation_id AS "organisationId",
         action,
         entity,
         entity_id AS "entityId",
         metadata,
         ip_address AS "ipAddress",
         created_at AS "createdAt"
       FROM audit_logs
       WHERE entity = $1 AND entity_id = $2
       ORDER BY created_at DESC`,
      [entity, entityId],
    );

    return result.rows;
  }

  /**
   * Find audit log entries by user ID (for SAR readiness - COMP-05).
   */
  static async findByUser(userId: string, options?: PaginationOptions): Promise<AuditLog[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const result = await pool.query(
      `SELECT
         id,
         user_id AS "userId",
         organisation_id AS "organisationId",
         action,
         entity,
         entity_id AS "entityId",
         metadata,
         ip_address AS "ipAddress",
         created_at AS "createdAt"
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return result.rows;
  }

  /**
   * Find audit log entries by organisation with optional filters.
   */
  static async findByOrganisation(organisationId: string, options?: AuditFilters): Promise<AuditLog[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const conditions = ["organisation_id = $1"];
    const params: (string | number)[] = [organisationId];
    let paramIndex = 2;

    if (options?.entity) {
      conditions.push(`entity = $${paramIndex}`);
      params.push(options.entity);
      paramIndex++;
    }

    if (options?.action) {
      conditions.push(`action = $${paramIndex}`);
      params.push(options.action);
      paramIndex++;
    }

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
         id,
         user_id AS "userId",
         organisation_id AS "organisationId",
         action,
         entity,
         entity_id AS "entityId",
         metadata,
         ip_address AS "ipAddress",
         created_at AS "createdAt"
       FROM audit_logs
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params,
    );

    return result.rows;
  }
}
