import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
      action VARCHAR(20) NOT NULL,
      entity VARCHAR(50) NOT NULL,
      entity_id UUID,
      metadata JSONB DEFAULT '{}',
      ip_address INET,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id)");
  await knex.raw("CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)");
  await knex.raw("CREATE INDEX idx_audit_logs_organisation_id ON audit_logs(organisation_id)");
  await knex.raw("CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)");

  // Revoke UPDATE and DELETE on audit_logs — immutable by design (COMP-01)
  // Note: This revokes from PUBLIC role. The application connects as postgres user
  // which has superuser privileges, so we also create a trigger to prevent mutations.
  await knex.raw(`
    CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted.';
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation()
  `);

  await knex.raw(`
    CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation()
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs");
  await knex.raw("DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs");
  await knex.raw("DROP FUNCTION IF EXISTS prevent_audit_log_mutation");
  await knex.raw("DROP TABLE IF EXISTS audit_logs");
}
