import { pool } from "@/providers/database/pool";
import { PoolClient } from "pg";

/**
 * TenantService sets the RLS session variables that enable tenant isolation.
 * Every data query that touches org-scoped tables must go through withTenant()
 * to ensure the correct RLS context is applied.
 *
 * This is the critical link making RLS work: app.current_organisation_id and
 * app.is_platform_admin are checked by the Postgres RLS policies created in Plan 01.
 */
export class TenantService {
  /**
   * Set RLS session variables on a database client within a transaction.
   * Uses SET LOCAL so the settings are scoped to the current transaction only.
   */
  static async setTenantContext(
    client: PoolClient,
    organisationId: string,
    isPlatformAdmin: boolean,
  ): Promise<void> {
    await client.query(`SET LOCAL app.current_organisation_id = $1`, [organisationId]);
    await client.query(`SET LOCAL app.is_platform_admin = $1`, [isPlatformAdmin.toString()]);
  }

  /**
   * Execute a callback within a transaction that has the tenant context set.
   * This is the primary way to run org-scoped queries with RLS.
   *
   * @param organisationId - The organisation ID for RLS context
   * @param isPlatformAdmin - Whether the current user is a platform admin (bypasses RLS)
   * @param fn - The callback to execute with the tenant-scoped client
   * @returns The result of the callback
   *
   * @example
   * const employees = await TenantService.withTenant(orgId, false, async (client) => {
   *   const result = await client.query('SELECT * FROM employees');
   *   return result.rows;
   * });
   */
  static async withTenant<T>(
    organisationId: string,
    isPlatformAdmin: boolean,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await TenantService.setTenantContext(client, organisationId, isPlatformAdmin);

      const result = await fn(client);

      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
