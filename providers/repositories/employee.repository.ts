import { pool } from "@/providers/database/pool";
import { Employee, EmployeeWithDetails, CreateEmployeeParams, UpdateEmployeeParams, EmployeeFilters, DataSubjectRecord, AuditLog } from "@/types/database";
import { EmployeeStatus } from "@/types/enums";
import { PoolClient } from "pg";

/**
 * Employee repository — full CRUD with invitation-related queries.
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

  /**
   * Find all employees for an organisation with optional filters.
   * JOINs users for name/email and departments for department name.
   */
  static async findByOrganisation(
    organisationId: string,
    filters?: EmployeeFilters,
    client?: PoolClient,
  ): Promise<EmployeeWithDetails[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const conditions: string[] = ["e.organisation_id = $1"];
    const values: (string | undefined)[] = [organisationId];
    let paramIndex = 2;

    if (filters?.status) {
      conditions.push(`e.status = $${paramIndex++}`);
      values.push(filters.status);
    }
    if (filters?.departmentId) {
      conditions.push(`e.department_id = $${paramIndex++}`);
      values.push(filters.departmentId);
    }
    if (filters?.managerId) {
      conditions.push(`e.manager_id = $${paramIndex++}`);
      values.push(filters.managerId);
    }

    const result = await queryFn(
      `SELECT
        e.id,
        e.user_id AS "userId",
        e.organisation_id AS "organisationId",
        e.department_id AS "departmentId",
        e.manager_id AS "managerId",
        e.job_title AS "jobTitle",
        e.status,
        e.invitation_token AS "invitationToken",
        e.invitation_expires_at AS "invitationExpiresAt",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email,
        d.name AS "departmentName",
        m_user.first_name AS "managerFirstName",
        m_user.last_name AS "managerLastName",
        m_user.email AS "managerEmail"
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users m_user ON m.user_id = m_user.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.first_name ASC NULLS LAST, u.last_name ASC NULLS LAST, e.created_at ASC`,
      values,
    );

    return result.rows;
  }

  /**
   * Find an employee by ID with joined user and department data.
   */
  static async findByIdWithDetails(id: string, client?: PoolClient): Promise<EmployeeWithDetails | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT
        e.id,
        e.user_id AS "userId",
        e.organisation_id AS "organisationId",
        e.department_id AS "departmentId",
        e.manager_id AS "managerId",
        e.job_title AS "jobTitle",
        e.status,
        e.invitation_token AS "invitationToken",
        e.invitation_expires_at AS "invitationExpiresAt",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email,
        d.name AS "departmentName",
        m_user.first_name AS "managerFirstName",
        m_user.last_name AS "managerLastName",
        m_user.email AS "managerEmail"
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users m_user ON m.user_id = m_user.id
      WHERE e.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new employee record linked to an existing user.
   */
  static async create(params: CreateEmployeeParams, client?: PoolClient): Promise<Employee> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO employees (organisation_id, user_id, department_id, manager_id, job_title, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
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
        updated_at AS "updatedAt"`,
      [
        params.organisationId,
        null, // userId will be set when user is created
        params.departmentId || null,
        params.managerId || null,
        params.jobTitle || null,
        EmployeeStatus.ACTIVE,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update an employee record.
   */
  static async update(id: string, params: UpdateEmployeeParams, client?: PoolClient): Promise<Employee> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const setClauses: string[] = [];
    const values: (string | null | undefined)[] = [];
    let paramIndex = 1;

    if (params.jobTitle !== undefined) {
      setClauses.push(`job_title = $${paramIndex++}`);
      values.push(params.jobTitle);
    }
    if (params.departmentId !== undefined) {
      setClauses.push(`department_id = $${paramIndex++}`);
      values.push(params.departmentId);
    }
    if (params.managerId !== undefined) {
      setClauses.push(`manager_id = $${paramIndex++}`);
      values.push(params.managerId);
    }
    if (params.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(params.status);
    }

    setClauses.push("updated_at = NOW()");
    values.push(id);

    const result = await queryFn(
      `UPDATE employees
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING
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
        updated_at AS "updatedAt"`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Deactivate an employee (soft delete).
   */
  static async deactivate(id: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn(
      `UPDATE employees
      SET status = $2, updated_at = NOW()
      WHERE id = $1`,
      [id, EmployeeStatus.DEACTIVATED],
    );
  }

  /**
   * Find an employee by email within an organisation (for duplicate detection).
   * Looks up through the linked user record.
   */
  static async findByEmail(email: string, organisationId: string, client?: PoolClient): Promise<Employee | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT
        e.id,
        e.user_id AS "userId",
        e.organisation_id AS "organisationId",
        e.department_id AS "departmentId",
        e.manager_id AS "managerId",
        e.job_title AS "jobTitle",
        e.status,
        e.invitation_token AS "invitationToken",
        e.invitation_expires_at AS "invitationExpiresAt",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt"
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE LOWER(u.email) = LOWER($1) AND e.organisation_id = $2`,
      [email, organisationId],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all employees managed by a specific employee (direct reports and their reports).
   * Uses recursive CTE for full reporting chain.
   */
  static async findByManagerChain(managerId: string, organisationId: string, client?: PoolClient): Promise<EmployeeWithDetails[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `WITH RECURSIVE team AS (
        SELECT id FROM employees WHERE manager_id = $1 AND organisation_id = $2
        UNION ALL
        SELECT e.id FROM employees e INNER JOIN team t ON e.manager_id = t.id
      )
      SELECT
        e.id,
        e.user_id AS "userId",
        e.organisation_id AS "organisationId",
        e.department_id AS "departmentId",
        e.manager_id AS "managerId",
        e.job_title AS "jobTitle",
        e.status,
        e.invitation_token AS "invitationToken",
        e.invitation_expires_at AS "invitationExpiresAt",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email,
        d.name AS "departmentName",
        m_user.first_name AS "managerFirstName",
        m_user.last_name AS "managerLastName",
        m_user.email AS "managerEmail"
      FROM employees e
      INNER JOIN team t ON e.id = t.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users m_user ON m.user_id = m_user.id
      ORDER BY u.first_name ASC NULLS LAST, u.last_name ASC NULLS LAST`,
      [managerId, organisationId],
    );

    return result.rows;
  }

  /**
   * Get the reporting chain for a manager (recursive CTE).
   * Returns all direct and indirect reports as Employee records.
   */
  static async getReportingChain(managerId: string, client?: PoolClient): Promise<Employee[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `WITH RECURSIVE team AS (
        SELECT id FROM employees WHERE manager_id = $1
        UNION ALL
        SELECT e.id FROM employees e INNER JOIN team t ON e.manager_id = t.id
      )
      SELECT
        e.id,
        e.user_id AS "userId",
        e.organisation_id AS "organisationId",
        e.department_id AS "departmentId",
        e.manager_id AS "managerId",
        e.job_title AS "jobTitle",
        e.status,
        e.invitation_token AS "invitationToken",
        e.invitation_expires_at AS "invitationExpiresAt",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt"
      FROM employees e
      INNER JOIN team t ON e.id = t.id
      ORDER BY e.created_at ASC`,
      [managerId],
    );

    return result.rows;
  }

  /**
   * Get the manager's email and user ID for an employee.
   * Returns null if the employee has no manager assigned.
   */
  static async getManagerInfo(
    employeeId: string,
  ): Promise<{ email: string; userId: string; organisationId: string } | null> {
    const result = await pool.query(
      `SELECT
        u.email,
        u.id AS "userId",
        e.organisation_id AS "organisationId"
      FROM employees e
      INNER JOIN employees m ON e.manager_id = m.id
      INNER JOIN users u ON m.user_id = u.id
      WHERE e.id = $1`,
      [employeeId],
    );

    return result.rows[0] || null;
  }

  /**
   * Get all data held about an employee for SAR readiness (COMP-05).
   * Returns personal info, roles, and audit log entries about them.
   */
  static async getDataSubjectRecord(employeeId: string): Promise<DataSubjectRecord | null> {
    // Get employee with details
    const employee = await EmployeeRepository.findByIdWithDetails(employeeId);
    if (!employee) return null;

    // Get roles for the employee's user
    let roles: { role: string; organisationName: string; createdAt: Date }[] = [];
    if (employee.userId) {
      const rolesResult = await pool.query(
        `SELECT
          ur.role,
          o.name AS "organisationName",
          ur.created_at AS "createdAt"
        FROM user_roles ur
        INNER JOIN organisations o ON ur.organisation_id = o.id
        WHERE ur.user_id = $1
        ORDER BY ur.created_at ASC`,
        [employee.userId],
      );
      roles = rolesResult.rows;
    }

    // Get audit log entries about this employee (entity_id = employeeId or user_id = userId)
    const auditConditions: string[] = [];
    const auditParams: string[] = [];
    let paramIdx = 1;

    auditConditions.push(`(entity = 'EMPLOYEE' AND entity_id = $${paramIdx++})`);
    auditParams.push(employeeId);

    if (employee.userId) {
      auditConditions.push(`user_id = $${paramIdx++}`);
      auditParams.push(employee.userId);
    }

    const auditResult = await pool.query(
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
      WHERE ${auditConditions.join(" OR ")}
      ORDER BY created_at DESC
      LIMIT 100`,
      auditParams,
    );

    const managerName =
      employee.managerFirstName && employee.managerLastName
        ? `${employee.managerFirstName} ${employee.managerLastName}`
        : null;

    return {
      personalInfo: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        jobTitle: employee.jobTitle,
        departmentName: employee.departmentName,
        managerName,
        status: employee.status,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
      roles,
      activityLog: auditResult.rows,
    };
  }
}
