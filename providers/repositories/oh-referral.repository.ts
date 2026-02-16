import { pool } from "@/providers/database/pool";
import {
  OhReferral,
  OhReferralWithDetails,
  OhReferralCommunication,
  OhReferralCommunicationWithAuthor,
} from "@/types/database";
import { PoolClient } from "pg";

export interface OhReferralFilters {
  status?: string;
  employeeId?: string;
  providerId?: string;
}

/**
 * OH referral repository -- CRUD operations for occupational health referrals.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class OhReferralRepository {
  private static readonly SELECT_COLUMNS = `
    r.id,
    r.organisation_id AS "organisationId",
    r.sickness_case_id AS "sicknessCaseId",
    r.employee_id AS "employeeId",
    r.provider_id AS "providerId",
    r.referred_by AS "referredBy",
    r.status,
    r.reason,
    r.urgency,
    r.report_received_at AS "reportReceivedAt",
    r.report_notes_encrypted AS "reportNotesEncrypted",
    r.created_at AS "createdAt",
    r.updated_at AS "updatedAt"
  `;

  private static readonly SELECT_WITH_DETAILS = `
    ${OhReferralRepository.SELECT_COLUMNS},
    u.first_name AS "employeeFirstName",
    u.last_name AS "employeeLastName",
    op.name AS "providerName",
    sc.absence_type AS "absenceType",
    sc.absence_start_date AS "absenceStartDate"
  `;

  /**
   * Find all referrals for an organisation with optional filters.
   * Joins for employee name, provider name, and sickness case info.
   */
  static async findByOrganisation(
    organisationId: string,
    filters?: OhReferralFilters,
    client?: PoolClient,
  ): Promise<OhReferralWithDetails[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const conditions: string[] = ["r.organisation_id = $1"];
    const values: string[] = [organisationId];
    let paramIndex = 2;

    if (filters?.status) {
      conditions.push(`r.status = $${paramIndex++}`);
      values.push(filters.status);
    }
    if (filters?.employeeId) {
      conditions.push(`r.employee_id = $${paramIndex++}`);
      values.push(filters.employeeId);
    }
    if (filters?.providerId) {
      conditions.push(`r.provider_id = $${paramIndex++}`);
      values.push(filters.providerId);
    }

    const result = await queryFn(
      `SELECT ${OhReferralRepository.SELECT_WITH_DETAILS}
      FROM oh_referrals r
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN oh_providers op ON r.provider_id = op.id
      LEFT JOIN sickness_cases sc ON r.sickness_case_id = sc.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY r.created_at DESC`,
      values,
    );

    return result.rows;
  }

  /**
   * Find a single referral by ID with joined details.
   */
  static async findById(id: string, client?: PoolClient): Promise<OhReferralWithDetails | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${OhReferralRepository.SELECT_WITH_DETAILS}
      FROM oh_referrals r
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN oh_providers op ON r.provider_id = op.id
      LEFT JOIN sickness_cases sc ON r.sickness_case_id = sc.id
      WHERE r.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all referrals for a sickness case.
   */
  static async findBySicknessCase(sicknessCaseId: string, client?: PoolClient): Promise<OhReferral[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${OhReferralRepository.SELECT_COLUMNS}
      FROM oh_referrals r
      WHERE r.sickness_case_id = $1
      ORDER BY r.created_at DESC`,
      [sicknessCaseId],
    );

    return result.rows;
  }

  /**
   * Create a new referral.
   */
  static async create(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      employeeId: string;
      providerId: string;
      referredBy: string;
      reason: string;
      urgency: string;
    },
    client?: PoolClient,
  ): Promise<OhReferral> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO oh_referrals (
        organisation_id, sickness_case_id, employee_id, provider_id,
        referred_by, reason, urgency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${OhReferralRepository.SELECT_COLUMNS}`,
      [
        data.organisationId,
        data.sicknessCaseId,
        data.employeeId,
        data.providerId,
        data.referredBy,
        data.reason,
        data.urgency,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update referral status. Sets report_received_at if transitioning to REPORT_RECEIVED.
   */
  static async updateStatus(
    id: string,
    status: string,
    reportNotesEncrypted?: string,
    client?: PoolClient,
  ): Promise<OhReferral> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    const setClauses: string[] = ["status = $2", "updated_at = NOW()"];
    const values: (string | null)[] = [id, status];
    let paramIndex = 3;

    if (status === "REPORT_RECEIVED") {
      setClauses.push(`report_received_at = NOW()`);
    }

    if (reportNotesEncrypted !== undefined) {
      setClauses.push(`report_notes_encrypted = $${paramIndex++}`);
      values.push(reportNotesEncrypted || null);
    }

    const result = await queryFn(
      `UPDATE oh_referrals r
      SET ${setClauses.join(", ")}
      WHERE r.id = $1
      RETURNING ${OhReferralRepository.SELECT_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Add a communication record for a referral.
   */
  static async addCommunication(
    data: {
      referralId: string;
      authorId: string;
      direction: string;
      message: string;
    },
    client?: PoolClient,
  ): Promise<OhReferralCommunication> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO oh_referral_communications (referral_id, author_id, direction, message)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        referral_id AS "referralId",
        author_id AS "authorId",
        direction,
        message,
        created_at AS "createdAt"`,
      [data.referralId, data.authorId, data.direction, data.message],
    );

    return result.rows[0];
  }

  /**
   * Get all communications for a referral, ordered chronologically.
   */
  static async getCommunications(
    referralId: string,
    client?: PoolClient,
  ): Promise<OhReferralCommunicationWithAuthor[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT
        c.id,
        c.referral_id AS "referralId",
        c.author_id AS "authorId",
        c.direction,
        c.message,
        c.created_at AS "createdAt",
        u.first_name AS "authorFirstName",
        u.last_name AS "authorLastName",
        u.email AS "authorEmail"
      FROM oh_referral_communications c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.referral_id = $1
      ORDER BY c.created_at ASC`,
      [referralId],
    );

    return result.rows;
  }
}
