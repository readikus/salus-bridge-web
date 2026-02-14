import { pool } from "@/providers/database/pool";
import { UserRoleRecord } from "@/types/database";
import { UserRole } from "@/types/enums";
import { UserRoleWithOrg } from "@/types/auth";

export interface CreateUserRoleParams {
  userId: string;
  organisationId: string;
  role: UserRole;
}

export class UserRoleRepository {
  /**
   * Find all roles for a user, including organisation name (for session context).
   */
  static async findByUserId(userId: string): Promise<UserRoleWithOrg[]> {
    const result = await pool.query(
      `SELECT
        ur.role,
        ur.organisation_id AS "organisationId",
        o.name AS "organisationName"
      FROM user_roles ur
      INNER JOIN organisations o ON ur.organisation_id = o.id
      WHERE ur.user_id = $1
      ORDER BY o.name ASC`,
      [userId],
    );

    return result.rows;
  }

  /**
   * Find roles for a user within a specific organisation.
   */
  static async findByUserAndOrg(userId: string, organisationId: string): Promise<UserRoleRecord[]> {
    const result = await pool.query(
      `SELECT
        id,
        user_id AS "userId",
        organisation_id AS "organisationId",
        role,
        created_at AS "createdAt"
      FROM user_roles
      WHERE user_id = $1 AND organisation_id = $2`,
      [userId, organisationId],
    );

    return result.rows;
  }

  /**
   * Create a new role assignment.
   */
  static async create(params: CreateUserRoleParams): Promise<UserRoleRecord> {
    const result = await pool.query(
      `INSERT INTO user_roles (user_id, organisation_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, organisation_id, role) DO NOTHING
      RETURNING
        id,
        user_id AS "userId",
        organisation_id AS "organisationId",
        role,
        created_at AS "createdAt"`,
      [params.userId, params.organisationId, params.role],
    );

    // If ON CONFLICT triggered, fetch the existing record
    if (result.rows.length === 0) {
      const existing = await pool.query(
        `SELECT
          id,
          user_id AS "userId",
          organisation_id AS "organisationId",
          role,
          created_at AS "createdAt"
        FROM user_roles
        WHERE user_id = $1 AND organisation_id = $2 AND role = $3`,
        [params.userId, params.organisationId, params.role],
      );
      return existing.rows[0];
    }

    return result.rows[0];
  }

  /**
   * Delete a specific role assignment.
   */
  static async delete(userId: string, organisationId: string, role: string): Promise<void> {
    await pool.query(
      `DELETE FROM user_roles
      WHERE user_id = $1 AND organisation_id = $2 AND role = $3`,
      [userId, organisationId, role],
    );
  }

  /**
   * Check if a user has a specific role in an organisation.
   */
  static async hasRole(userId: string, organisationId: string, role: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM user_roles
      WHERE user_id = $1 AND organisation_id = $2 AND role = $3
      LIMIT 1`,
      [userId, organisationId, role],
    );

    return result.rows.length > 0;
  }
}
