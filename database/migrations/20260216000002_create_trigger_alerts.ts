import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE trigger_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      trigger_config_id UUID NOT NULL REFERENCES trigger_configs(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      sickness_case_id UUID REFERENCES sickness_cases(id) ON DELETE SET NULL,
      triggered_value INTEGER NOT NULL,
      acknowledged_by UUID REFERENCES users(id),
      acknowledged_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_trigger_alerts_org ON trigger_alerts(organisation_id)");
  await knex.raw("CREATE INDEX idx_trigger_alerts_employee ON trigger_alerts(employee_id)");
  await knex.raw(
    "CREATE INDEX idx_trigger_alerts_org_unacknowledged ON trigger_alerts(organisation_id, acknowledged_at)",
  );

  // RLS policies: org isolation + platform admin bypass
  await knex.raw("ALTER TABLE trigger_alerts ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY trigger_alerts_org_isolation ON trigger_alerts
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS trigger_alerts");
}
