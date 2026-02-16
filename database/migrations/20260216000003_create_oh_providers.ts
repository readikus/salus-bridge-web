import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE oh_providers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      address TEXT,
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_oh_providers_org ON oh_providers(organisation_id)");

  // RLS policies: org isolation + platform admin bypass
  await knex.raw(`
    ALTER TABLE oh_providers ENABLE ROW LEVEL SECURITY
  `);

  await knex.raw(`
    CREATE POLICY oh_providers_org_isolation ON oh_providers
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP POLICY IF EXISTS oh_providers_org_isolation ON oh_providers");
  await knex.raw("DROP TABLE IF EXISTS oh_providers");
}
