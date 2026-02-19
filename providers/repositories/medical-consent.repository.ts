import { pool } from "@/providers/database/pool";
import { MedicalRecordsConsent, MedicalRecordsConsentWithEmployee } from "@/types/database";
import { PoolClient } from "pg";

/**
 * MedicalConsentRepository -- CRUD for the medical_records_consent table.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class MedicalConsentRepository {
  private static readonly SELECT_COLUMNS = `
    mc.id,
    mc.organisation_id AS "organisationId",
    mc.employee_id AS "employeeId",
    mc.consented_by AS "consentedBy",
    mc.consent_status AS "consentStatus",
    mc.consent_date AS "consentDate",
    mc.revoked_date AS "revokedDate",
    mc.notes,
    mc.created_at AS "createdAt",
    mc.updated_at AS "updatedAt"
  `;

  /**
   * Find the consent record for an employee (single row due to UNIQUE constraint).
   */
  static async findByEmployee(employeeId: string, client?: PoolClient): Promise<MedicalRecordsConsent | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MedicalConsentRepository.SELECT_COLUMNS}
      FROM medical_records_consent mc
      WHERE mc.employee_id = $1`,
      [employeeId],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all consent records for an organisation, joined with employee/user details.
   */
  static async findByOrganisation(orgId: string, client?: PoolClient): Promise<MedicalRecordsConsentWithEmployee[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT
        ${MedicalConsentRepository.SELECT_COLUMNS},
        u.first_name AS "employeeFirstName",
        u.last_name AS "employeeLastName",
        u.email AS "employeeEmail"
      FROM medical_records_consent mc
      LEFT JOIN employees e ON mc.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE mc.organisation_id = $1
      ORDER BY mc.updated_at DESC`,
      [orgId],
    );

    return result.rows;
  }

  /**
   * Upsert a consent record (INSERT or UPDATE on employee_id conflict).
   * Sets consent_date on GRANTED, revoked_date on REVOKED.
   */
  static async upsert(
    data: {
      organisationId: string;
      employeeId: string;
      consentedBy: string;
      consentStatus: string;
      notes?: string | null;
    },
    client?: PoolClient,
  ): Promise<MedicalRecordsConsent> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const consentDate = data.consentStatus === "GRANTED" ? "NOW()" : "NULL";
    const revokedDate = data.consentStatus === "REVOKED" ? "NOW()" : "NULL";

    const result = await queryFn(
      `INSERT INTO medical_records_consent (organisation_id, employee_id, consented_by, consent_status, consent_date, revoked_date, notes)
      VALUES ($1, $2, $3, $4, ${consentDate}, ${revokedDate}, $5)
      ON CONFLICT (employee_id) DO UPDATE SET
        consented_by = EXCLUDED.consented_by,
        consent_status = EXCLUDED.consent_status,
        consent_date = ${consentDate},
        revoked_date = ${revokedDate},
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING ${MedicalConsentRepository.SELECT_COLUMNS}`,
      [data.organisationId, data.employeeId, data.consentedBy, data.consentStatus, data.notes || null],
    );

    return result.rows[0];
  }

  /**
   * Find a consent record by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<MedicalRecordsConsent | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MedicalConsentRepository.SELECT_COLUMNS}
      FROM medical_records_consent mc
      WHERE mc.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }
}
