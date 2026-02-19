import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE milestone_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
      milestone_key VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      day_offset INTEGER NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      is_default BOOLEAN DEFAULT false,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_milestone_configs_org ON milestone_configs(organisation_id)");
  await knex.raw("CREATE INDEX idx_milestone_configs_key ON milestone_configs(milestone_key)");
  await knex.raw(
    "ALTER TABLE milestone_configs ADD CONSTRAINT uq_milestone_configs_org_key UNIQUE(organisation_id, milestone_key)",
  );
  await knex.raw(
    "CREATE UNIQUE INDEX idx_milestone_configs_default_key ON milestone_configs(milestone_key) WHERE organisation_id IS NULL",
  );

  // RLS policies: org isolation + platform admin bypass + public defaults
  await knex.raw("ALTER TABLE milestone_configs ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY milestone_configs_org_isolation ON milestone_configs
    FOR ALL
    USING (
      organisation_id IS NULL
      OR organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);

  // Seed default milestones (system-level, organisation_id IS NULL)
  await knex.raw(`
    INSERT INTO milestone_configs (organisation_id, milestone_key, label, day_offset, description, is_active, is_default) VALUES
      (NULL, 'DAY_1', 'Day 1 - Absence Reported', 1, 'Initial absence notification to employee, manager, and HR', true, true),
      (NULL, 'DAY_3', 'Day 3 - GP Visit Reminder', 3, 'Remind employee about GP visit and fit note requirements', true, true),
      (NULL, 'DAY_7', 'Day 7 - Long-Term Transition', 7, 'Case transitions to long-term; prompt for fit note upload and expected return date', true, true),
      (NULL, 'WEEK_2', 'Week 2 - Check-in', 14, 'Check-in prompt and fit note renewal reminder', true, true),
      (NULL, 'WEEK_3', 'Week 3 - Fit Note Renewal', 21, 'Fit note renewal reminder', true, true),
      (NULL, 'WEEK_4', 'Week 4 - GP/OH Report Request', 28, 'Prompt HR/manager to request GP or occupational health report', true, true),
      (NULL, 'WEEK_6', 'Week 6 - Plan of Action', 42, 'Prompt creation of a Plan of Action', true, true),
      (NULL, 'WEEK_10', 'Week 10 - First Evaluation', 70, 'First evaluation meeting', true, true),
      (NULL, 'WEEK_14', 'Week 14 - Evaluation', 98, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_18', 'Week 18 - Evaluation', 126, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_22', 'Week 22 - Evaluation', 154, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_26', 'Week 26 - Evaluation', 182, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_30', 'Week 30 - Evaluation', 210, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_34', 'Week 34 - Evaluation', 238, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_38', 'Week 38 - Evaluation', 266, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_42', 'Week 42 - Evaluation', 294, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_46', 'Week 46 - Evaluation', 322, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_50', 'Week 50 - Evaluation', 350, 'Scheduled evaluation meeting', true, true),
      (NULL, 'WEEK_52', 'Week 52 - Capability Review', 364, 'Formal capability review trigger', true, true)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DELETE FROM milestone_configs WHERE is_default = true AND organisation_id IS NULL");
  await knex.raw("DROP TABLE IF EXISTS milestone_configs");
}
