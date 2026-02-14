import { pool } from "@/providers/database/pool";
import { Employee } from "@/types/database";

/**
 * Partial employee repository — invitation-related queries only.
 * Full CRUD will be added in Plan 03 (Employee Management).
 */
export class EmployeeRepository {
  /**
   * Find an employee by their invitation token.
   */
  static async findByInvitationToken(token: string): Promise<Employee | null> {
    const result = await pool.query(
      `SELECT
        id,
        user_id AS "userId",
        organisation_id AS "organisationId",
        department_id AS "departmentId",
        manager_id AS "managerId",
        job_title AS "jobTitle",
        status,
        invitation_token AS "invitationToken",
        invitation_expires_at AS "invitationExpiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM employees
      WHERE invitation_token = $1`,
      [token],
    );

    return result.rows[0] || null;
  }

  /**
   * Find an employee by ID.
   */
  static async findById(id: string): Promise<Employee | null> {
    const result = await pool.query(
      `SELECT
        id,
        user_id AS "userId",
        organisation_id AS "organisationId",
        department_id AS "departmentId",
        manager_id AS "managerId",
        job_title AS "jobTitle",
        status,
        invitation_token AS "invitationToken",
        invitation_expires_at AS "invitationExpiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM employees
      WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find an employee by their linked user ID.
   */
  static async findByUserId(userId: string): Promise<Employee | null> {
    const result = await pool.query(
      `SELECT
        id,
        user_id AS "userId",
        organisation_id AS "organisationId",
        department_id AS "departmentId",
        manager_id AS "managerId",
        job_title AS "jobTitle",
        status,
        invitation_token AS "invitationToken",
        invitation_expires_at AS "invitationExpiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM employees
      WHERE user_id = $1`,
      [userId],
    );

    return result.rows[0] || null;
  }

  /**
   * Get the email for an employee (from the linked user or from employee record).
   * Employees must have a linked user or an email stored. We look up through user_id.
   */
  static async getEmployeeEmail(employeeId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT u.email
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.id = $1`,
      [employeeId],
    );

    return result.rows[0]?.email || null;
  }

  /**
   * Update invitation status for an employee.
   */
  static async updateInvitationStatus(employeeId: string, status: string): Promise<void> {
    await pool.query(
      `UPDATE employees
      SET status = $2, updated_at = NOW()
      WHERE id = $1`,
      [employeeId, status],
    );
  }

  /**
   * Set invitation token and expiry for an employee.
   */
  static async setInvitationToken(
    employeeId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await pool.query(
      `UPDATE employees
      SET invitation_token = $2, invitation_expires_at = $3, status = 'INVITED', updated_at = NOW()
      WHERE id = $1`,
      [employeeId, token, expiresAt.toISOString()],
    );
  }

  /**
   * Clear the invitation token after acceptance.
   */
  static async clearInvitationToken(employeeId: string): Promise<void> {
    await pool.query(
      `UPDATE employees
      SET invitation_token = NULL, invitation_expires_at = NULL, updated_at = NOW()
      WHERE id = $1`,
      [employeeId],
    );
  }

  /**
   * Link an employee to a user account.
   */
  static async linkUser(employeeId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE employees
      SET user_id = $2, updated_at = NOW()
      WHERE id = $1`,
      [employeeId, userId],
    );
  }
}
