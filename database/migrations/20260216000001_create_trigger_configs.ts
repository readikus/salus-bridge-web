import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE trigger_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      trigger_type VARCHAR(30) NOT NULL,
      threshold_value INTEGER NOT NULL,
      period_days INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_trigger_configs_org ON trigger_configs(organisation_id)");
  await knex.raw("CREATE INDEX idx_trigger_configs_org_active ON trigger_configs(organisation_id, is_active)");

  // RLS policies: org isolation + platform admin bypass
  await knex.raw("ALTER TABLE trigger_configs ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY trigger_configs_org_isolation ON trigger_configs
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS trigger_configs");
}
