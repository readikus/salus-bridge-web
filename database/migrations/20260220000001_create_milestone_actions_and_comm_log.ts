import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // milestone_actions table -- tracks which milestones have been actioned per case
  await knex.raw(`
    CREATE TABLE milestone_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      milestone_key VARCHAR(50) NOT NULL,
      action_type VARCHAR(30) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      due_date DATE NOT NULL,
      completed_by UUID REFERENCES users(id),
      completed_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_milestone_actions_case_key UNIQUE(sickness_case_id, milestone_key)
    )
  `);

  await knex.raw("CREATE INDEX idx_milestone_actions_org_status ON milestone_actions(organisation_id, status)");
  await knex.raw("CREATE INDEX idx_milestone_actions_case ON milestone_actions(sickness_case_id)");
  await knex.raw("CREATE INDEX idx_milestone_actions_due_status ON milestone_actions(due_date, status)");

  // RLS for milestone_actions
  await knex.raw("ALTER TABLE milestone_actions ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY milestone_actions_org_isolation ON milestone_actions
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);

  await knex.raw("GRANT SELECT, INSERT, UPDATE ON milestone_actions TO authenticated");

  // communication_logs table -- immutable audit trail of employer-employee contact
  await knex.raw(`
    CREATE TABLE communication_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(id),
      contact_date DATE NOT NULL,
      contact_type VARCHAR(30) NOT NULL,
      notes TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_communication_logs_case_date ON communication_logs(sickness_case_id, created_at)");
  await knex.raw("CREATE INDEX idx_communication_logs_org ON communication_logs(organisation_id)");

  // RLS for communication_logs
  await knex.raw("ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY communication_logs_org_isolation ON communication_logs
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);

  // Immutability: only SELECT and INSERT -- no UPDATE or DELETE
  await knex.raw("GRANT SELECT, INSERT ON communication_logs TO authenticated");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS communication_logs");
  await knex.raw("DROP TABLE IF EXISTS milestone_actions");
}
