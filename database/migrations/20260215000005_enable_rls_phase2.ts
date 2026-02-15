import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Enable RLS on all Phase 2 tables
  const tables = ["sickness_cases", "case_transitions", "fit_notes", "rtw_meetings", "guidance_engagement"];

  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }

  // -- Organisation isolation policies --

  // sickness_cases: isolate by organisation_id
  await knex.raw(`
    CREATE POLICY sickness_cases_org_isolation ON sickness_cases
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY sickness_cases_platform_admin_bypass ON sickness_cases
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // case_transitions: isolate via join to sickness_cases (no direct organisation_id column)
  await knex.raw(`
    CREATE POLICY case_transitions_org_isolation ON case_transitions
    USING (sickness_case_id IN (
      SELECT id FROM sickness_cases
      WHERE organisation_id = current_setting('app.current_organisation_id', true)::uuid
    ))
  `);

  await knex.raw(`
    CREATE POLICY case_transitions_platform_admin_bypass ON case_transitions
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // fit_notes: isolate by organisation_id
  await knex.raw(`
    CREATE POLICY fit_notes_org_isolation ON fit_notes
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY fit_notes_platform_admin_bypass ON fit_notes
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // rtw_meetings: isolate by organisation_id
  await knex.raw(`
    CREATE POLICY rtw_meetings_org_isolation ON rtw_meetings
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY rtw_meetings_platform_admin_bypass ON rtw_meetings
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // guidance_engagement: isolate by organisation_id
  await knex.raw(`
    CREATE POLICY guidance_org_isolation ON guidance_engagement
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY guidance_platform_admin_bypass ON guidance_engagement
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all policies
  const policies = [
    { name: "guidance_platform_admin_bypass", table: "guidance_engagement" },
    { name: "guidance_org_isolation", table: "guidance_engagement" },
    { name: "rtw_meetings_platform_admin_bypass", table: "rtw_meetings" },
    { name: "rtw_meetings_org_isolation", table: "rtw_meetings" },
    { name: "fit_notes_platform_admin_bypass", table: "fit_notes" },
    { name: "fit_notes_org_isolation", table: "fit_notes" },
    { name: "case_transitions_platform_admin_bypass", table: "case_transitions" },
    { name: "case_transitions_org_isolation", table: "case_transitions" },
    { name: "sickness_cases_platform_admin_bypass", table: "sickness_cases" },
    { name: "sickness_cases_org_isolation", table: "sickness_cases" },
  ];

  for (const { name, table } of policies) {
    await knex.raw(`DROP POLICY IF EXISTS ${name} ON ${table}`);
  }

  // Disable RLS
  const tables = ["sickness_cases", "case_transitions", "fit_notes", "rtw_meetings", "guidance_engagement"];
  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
  }
}
