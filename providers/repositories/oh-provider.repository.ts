import { pool } from "@/providers/database/pool";
import { OhProvider } from "@/types/database";
import { PoolClient } from "pg";

/**
 * OH provider repository -- CRUD operations for occupational health providers.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class OhProviderRepository {
  private static readonly SELECT_COLUMNS = `
    p.id,
    p.organisation_id AS "organisationId",
    p.name,
    p.contact_email AS "contactEmail",
    p.contact_phone AS "contactPhone",
    p.address,
    p.notes,
    p.is_active AS "isActive",
    p.created_by AS "createdBy",
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    name,
    contact_email AS "contactEmail",
    contact_phone AS "contactPhone",
    address,
    notes,
    is_active AS "isActive",
    created_by AS "createdBy",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;

  /**
   * Find all providers for an organisation, ordered by name.
   */
  static async findByOrganisation(organisationId: string, client?: PoolClient): Promise<OhProvider[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${OhProviderRepository.SELECT_COLUMNS}
      FROM oh_providers p
      WHERE p.organisation_id = $1
      ORDER BY p.name ASC`,
      [organisationId],
    );

    return result.rows;
  }

  /**
   * Find a single provider by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<OhProvider | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${OhProviderRepository.SELECT_COLUMNS}
      FROM oh_providers p
      WHERE p.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new OH provider.
   */
  static async create(
    data: {
      organisationId: string;
      name: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      notes?: string;
      createdBy: string;
    },
    client?: PoolClient,
  ): Promise<OhProvider> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO oh_providers (
        organisation_id, name, contact_email, contact_phone, address, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${OhProviderRepository.RETURNING_COLUMNS}`,
      [
        data.organisationId,
        data.name,
        data.contactEmail || null,
        data.contactPhone || null,
        data.address || null,
        data.notes || null,
        data.createdBy,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update an OH provider (partial update).
   */
  static async update(
    id: string,
    data: {
      name?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      notes?: string;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<OhProvider> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    const setClauses: string[] = ["updated_at = NOW()"];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.contactEmail !== undefined) {
      setClauses.push(`contact_email = $${paramIndex++}`);
      values.push(data.contactEmail || "");
    }
    if (data.contactPhone !== undefined) {
      setClauses.push(`contact_phone = $${paramIndex++}`);
      values.push(data.contactPhone || "");
    }
    if (data.address !== undefined) {
      setClauses.push(`address = $${paramIndex++}`);
      values.push(data.address || "");
    }
    if (data.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(data.notes || "");
    }
    if (data.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    values.push(id as string);

    const result = await queryFn(
      `UPDATE oh_providers
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING ${OhProviderRepository.RETURNING_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Delete an OH provider (cascade will remove referrals).
   */
  static async delete(id: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn("DELETE FROM oh_providers WHERE id = $1", [id]);
  }
}
