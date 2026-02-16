import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE oh_referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES oh_providers(id) ON DELETE CASCADE,
      referred_by UUID NOT NULL REFERENCES users(id),
      status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
      reason TEXT NOT NULL,
      urgency VARCHAR(20) DEFAULT 'STANDARD',
      report_received_at TIMESTAMPTZ,
      report_notes_encrypted TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_oh_referrals_org ON oh_referrals(organisation_id)");
  await knex.raw("CREATE INDEX idx_oh_referrals_sickness_case ON oh_referrals(sickness_case_id)");
  await knex.raw("CREATE INDEX idx_oh_referrals_employee ON oh_referrals(employee_id)");
  await knex.raw("CREATE INDEX idx_oh_referrals_provider ON oh_referrals(provider_id)");
  await knex.raw("CREATE INDEX idx_oh_referrals_status ON oh_referrals(status)");

  await knex.raw(`
    CREATE TABLE oh_referral_communications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referral_id UUID NOT NULL REFERENCES oh_referrals(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(id),
      direction VARCHAR(10) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_oh_referral_comms_referral ON oh_referral_communications(referral_id)");

  // RLS policies for oh_referrals
  await knex.raw(`
    ALTER TABLE oh_referrals ENABLE ROW LEVEL SECURITY
  `);

  await knex.raw(`
    CREATE POLICY oh_referrals_org_isolation ON oh_referrals
    FOR ALL
    USING (
      organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);

  // RLS policies for oh_referral_communications (join through oh_referrals)
  await knex.raw(`
    ALTER TABLE oh_referral_communications ENABLE ROW LEVEL SECURITY
  `);

  await knex.raw(`
    CREATE POLICY oh_referral_comms_org_isolation ON oh_referral_communications
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM oh_referrals r
        WHERE r.id = oh_referral_communications.referral_id
        AND (
          r.organisation_id::text = current_setting('app.current_organisation_id', true)
          OR current_setting('app.is_platform_admin', true) = 'true'
        )
      )
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP POLICY IF EXISTS oh_referral_comms_org_isolation ON oh_referral_communications");
  await knex.raw("DROP TABLE IF EXISTS oh_referral_communications");
  await knex.raw("DROP POLICY IF EXISTS oh_referrals_org_isolation ON oh_referrals");
  await knex.raw("DROP TABLE IF EXISTS oh_referrals");
}
