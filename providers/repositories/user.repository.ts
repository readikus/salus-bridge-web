import { pool } from "@/providers/database/pool";
import { User } from "@/types/database";

export interface CreateUserParams {
  email: string;
  auth0Id?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserParams {
  email?: string;
  auth0Id?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export class UserRepository {
  /**
   * Find a user by their internal ID.
   */
  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        auth0_id AS "auth0Id",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find a user by email address.
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        auth0_id AS "auth0Id",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    return result.rows[0] || null;
  }

  /**
   * Find a user by their Auth0 ID (sub claim).
   */
  static async findByAuth0Id(auth0Id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        auth0_id AS "auth0Id",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE auth0_id = $1`,
      [auth0Id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new user.
   */
  static async create(params: CreateUserParams): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, auth0_id, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        email,
        auth0_id AS "auth0Id",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [params.email, params.auth0Id || null, params.firstName || null, params.lastName || null],
    );

    return result.rows[0];
  }

  /**
   * Update an existing user.
   */
  static async update(id: string, params: UpdateUserParams): Promise<User> {
    const setClauses: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (params.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(params.email);
    }
    if (params.auth0Id !== undefined) {
      setClauses.push(`auth0_id = $${paramIndex++}`);
      values.push(params.auth0Id);
    }
    if (params.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIndex++}`);
      values.push(params.firstName);
    }
    if (params.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIndex++}`);
      values.push(params.lastName);
    }
    if (params.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(params.isActive);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        email,
        auth0_id AS "auth0Id",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Find all users belonging to an organisation (via user_roles JOIN).
   */
  static async findByOrganisation(organisationId: string): Promise<User[]> {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id,
        u.email,
        u.auth0_id AS "auth0Id",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.is_active AS "isActive",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.organisation_id = $1
      ORDER BY u.created_at ASC`,
      [organisationId],
    );

    return result.rows;
  }
}
