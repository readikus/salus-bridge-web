import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add GP detail columns to employees table
  await knex.raw("ALTER TABLE employees ADD COLUMN gp_name VARCHAR(255)");
  await knex.raw("ALTER TABLE employees ADD COLUMN gp_address TEXT");
  await knex.raw("ALTER TABLE employees ADD COLUMN gp_phone VARCHAR(50)");

  // Create medical records consent table
  await knex.raw(`
    CREATE TABLE medical_records_consent (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      consented_by UUID NOT NULL REFERENCES users(id),
      consent_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      consent_date TIMESTAMPTZ,
      revoked_date TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_medical_consent_org ON medical_records_consent(organisation_id)");
  await knex.raw("CREATE INDEX idx_medical_consent_employee ON medical_records_consent(employee_id)");
  await knex.raw(
    "ALTER TABLE medical_records_consent ADD CONSTRAINT uq_medical_consent_employee UNIQUE(employee_id)",
  );

  // RLS policies: org isolation + platform admin bypass
  await knex.raw("ALTER TABLE medical_records_consent ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY medical_consent_org_isolation ON medical_records_consent
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS medical_records_consent");
  await knex.raw("ALTER TABLE employees DROP COLUMN IF EXISTS gp_phone");
  await knex.raw("ALTER TABLE employees DROP COLUMN IF EXISTS gp_address");
  await knex.raw("ALTER TABLE employees DROP COLUMN IF EXISTS gp_name");
}
