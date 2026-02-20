import { pool } from "@/providers/database/pool";
import { CommunicationLogEntry, CommunicationLogEntryWithAuthor } from "@/types/database";
import { PoolClient } from "pg";

/**
 * CommunicationLog repository -- read and create operations for communication log entries.
 * Immutable by design: no update or delete methods.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class CommunicationLogRepository {
  private static readonly SELECT_COLUMNS = `
    cl.id,
    cl.organisation_id AS "organisationId",
    cl.sickness_case_id AS "sicknessCaseId",
    cl.author_id AS "authorId",
    cl.contact_date AS "contactDate",
    cl.contact_type AS "contactType",
    cl.notes,
    cl.created_at AS "createdAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    sickness_case_id AS "sicknessCaseId",
    author_id AS "authorId",
    contact_date AS "contactDate",
    contact_type AS "contactType",
    notes,
    created_at AS "createdAt"
  `;

  /**
   * Find all communication log entries for a sickness case, with author details.
   * Sorted by contact_date DESC, created_at DESC (most recent first).
   */
  static async findBySicknessCase(
    sicknessCaseId: string,
    client?: PoolClient,
  ): Promise<CommunicationLogEntryWithAuthor[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${CommunicationLogRepository.SELECT_COLUMNS},
        u.first_name AS "authorFirstName",
        u.last_name AS "authorLastName",
        u.email AS "authorEmail"
      FROM communication_logs cl
      JOIN users u ON u.id = cl.author_id
      WHERE cl.sickness_case_id = $1
      ORDER BY cl.contact_date DESC, cl.created_at DESC`,
      [sicknessCaseId],
    );

    return result.rows;
  }

  /**
   * Find a single communication log entry by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<CommunicationLogEntry | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${CommunicationLogRepository.SELECT_COLUMNS}
      FROM communication_logs cl
      WHERE cl.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new communication log entry.
   * This is the only write operation -- entries are immutable once created.
   */
  static async create(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      authorId: string;
      contactDate: string;
      contactType: string;
      notes: string;
    },
    client?: PoolClient,
  ): Promise<CommunicationLogEntry> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO communication_logs (organisation_id, sickness_case_id, author_id, contact_date, contact_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${CommunicationLogRepository.RETURNING_COLUMNS}`,
      [data.organisationId, data.sicknessCaseId, data.authorId, data.contactDate, data.contactType, data.notes],
    );

    return result.rows[0];
  }

  /**
   * Count communication log entries for a sickness case.
   */
  static async countBySicknessCase(sicknessCaseId: string, client?: PoolClient): Promise<number> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      "SELECT COUNT(*)::int AS count FROM communication_logs WHERE sickness_case_id = $1",
      [sicknessCaseId],
    );

    return result.rows[0].count;
  }
}
