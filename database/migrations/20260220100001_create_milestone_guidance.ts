import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE milestone_guidance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
      milestone_key VARCHAR(50) NOT NULL,
      action_title VARCHAR(200) NOT NULL,
      manager_guidance TEXT NOT NULL,
      suggested_text TEXT NOT NULL,
      instructions JSONB NOT NULL DEFAULT '[]',
      employee_view TEXT NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_milestone_guidance_org ON milestone_guidance(organisation_id)");
  await knex.raw("CREATE INDEX idx_milestone_guidance_key ON milestone_guidance(milestone_key)");
  await knex.raw(
    "ALTER TABLE milestone_guidance ADD CONSTRAINT uq_milestone_guidance_org_key UNIQUE(organisation_id, milestone_key)",
  );
  await knex.raw(
    "CREATE UNIQUE INDEX idx_milestone_guidance_default_key ON milestone_guidance(milestone_key) WHERE organisation_id IS NULL",
  );

  // RLS policies: org isolation + platform admin bypass + public defaults
  await knex.raw("ALTER TABLE milestone_guidance ENABLE ROW LEVEL SECURITY");

  await knex.raw(`
    CREATE POLICY milestone_guidance_org_isolation ON milestone_guidance
    FOR ALL
    USING (
      organisation_id IS NULL
      OR organisation_id::text = current_setting('app.current_organisation_id', true)
      OR current_setting('app.is_platform_admin', true) = 'true'
    )
  `);

  await knex.raw("GRANT SELECT ON milestone_guidance TO authenticated");

  // Seed all 19 default milestone guidance entries (organisation_id IS NULL, is_default = true)
  await knex.raw(`
    INSERT INTO milestone_guidance (organisation_id, milestone_key, action_title, manager_guidance, suggested_text, instructions, employee_view, is_default) VALUES
      (NULL, 'DAY_1', 'Contact your employee',
       'Reach out to your employee to acknowledge their absence and express concern for their wellbeing. Keep the conversation supportive, not investigative. A short, caring message goes a long way in helping them feel valued during a difficult time.',
       'Hi [name], I hope you''re feeling okay. Just wanted to let you know we''ve noted your absence and hope you recover soon. Please don''t worry about work -- just focus on getting better. Let me know if there''s anything I can do to help.',
       '["Send a brief, supportive message via phone or email","Do not ask for medical details at this stage","Record the absence start date","Ensure the employee knows who to contact if they need anything"]'::jsonb,
       'Your manager has been notified of your absence. You should receive a supportive message from them. No action is required from you at this stage -- focus on your recovery.',
       true),

      (NULL, 'DAY_3', 'Remind about GP visit',
       'If the absence is continuing, gently remind your employee that a fit note will be required from day 7 onwards. Frame this as helpful information rather than a demand. Continue to express concern for their wellbeing.',
       'Hi [name], I hope you''re starting to feel better. Just a heads-up that if you''re still unwell after 7 days, you''ll need a fit note from your GP. There''s no rush right now, but it''s worth booking an appointment if you haven''t already. We''re thinking of you.',
       '["Check in with the employee about how they are feeling","Mention the fit note requirement after 7 days as helpful information","Suggest booking a GP appointment if they haven''t already","Reassure them that their workload is being covered"]'::jsonb,
       'Your manager may check in with you around this time. If your absence continues beyond 7 days, you will need to obtain a fit note from your GP. Consider booking an appointment now to avoid delays.',
       true),

      (NULL, 'DAY_7', 'Request fit note',
       'The absence has reached 7 days and now transitions to long-term. A fit note is now legally required. Approach this conversation with empathy -- the employee may be anxious about their extended absence. Reassure them about job security and support.',
       'Hi [name], I hope you''re doing okay. As your absence has now reached 7 days, we''ll need a fit note from your GP going forward. If you have one already, please send it over when you can. If you need any help or have questions about the process, I''m here. Your health comes first.',
       '["Request a fit note from the employee","Explain the fit note process if they are unfamiliar","Update the case to reflect long-term status","Discuss any expected return date if the employee feels comfortable sharing","Reassure them about job security and ongoing support"]'::jsonb,
       'Your absence has reached 7 days and is now classified as long-term. You are required to provide a fit note from your GP. If you haven''t already, please arrange one and share it with your manager or HR. This is a standard process and does not affect your employment.',
       true),

      (NULL, 'WEEK_2', 'Conduct welfare check-in',
       'Two weeks into the absence, schedule a welfare check-in. The goal is to show continued support and understand how the employee is progressing. Avoid pressuring them about a return date. If a fit note is due for renewal, remind them gently.',
       'Hi [name], it''s been a couple of weeks and I wanted to check in to see how you''re doing. There''s no pressure to rush back -- I just want to make sure you have everything you need and that we''re supporting you properly. If your fit note is due for renewal, please arrange that when you can.',
       '["Schedule a brief welfare call or send a supportive message","Ask how they are feeling without pressuring for a return date","Remind about fit note renewal if applicable","Document the check-in outcome","Ask if any workplace adjustments might help when they are ready to return"]'::jsonb,
       'Your manager will check in with you to see how you are progressing. This is a welfare check, not a return-to-work discussion. If your fit note is expiring soon, please arrange a renewal with your GP.',
       true),

      (NULL, 'WEEK_3', 'Chase fit note renewal',
       'The initial fit note may be expiring around this time. Follow up to ensure a renewed fit note is obtained. Continue to be supportive and understanding -- some employees feel embarrassed about extended absence.',
       'Hi [name], I hope you''re continuing to recover well. I just wanted to check whether your fit note needs renewing -- if so, please arrange this with your GP when you get a chance. If there''s anything I can help with, please let me know.',
       '["Check if the current fit note is expiring or has expired","Request a renewed fit note if needed","Continue to express support and understanding","Update the case record with any new information"]'::jsonb,
       'If your fit note is expiring, please arrange a renewal with your GP. Your manager may follow up to confirm this is in hand. This is routine and nothing to worry about.',
       true),

      (NULL, 'WEEK_4', 'Request GP or occupational health report',
       'At the four-week mark, it is appropriate to request a GP or occupational health report to better understand the employee''s condition and any adjustments that might support their return. Frame this as a supportive step, not a compliance exercise.',
       'Hi [name], as we''re now at the four-week point, we''d like to arrange an occupational health assessment to help us understand how best to support your return to work. This is standard practice and is designed to help us make any adjustments you might need. I''ll arrange the referral -- please let me know if you have any questions.',
       '["Discuss an occupational health referral with HR","Obtain employee consent for the referral","Send the referral with relevant job role information","Ensure the employee understands the purpose is to support their return","Chase the current fit note renewal if applicable"]'::jsonb,
       'Your employer may arrange an occupational health assessment around this time. This is a standard and supportive process designed to help plan your return to work with any necessary adjustments. You will be asked for your consent before any referral is made.',
       true),

      (NULL, 'WEEK_6', 'Create a plan of action',
       'Six weeks of absence is a significant milestone. Work with HR and, where possible, the employee to create a formal plan of action. This should outline steps towards a return, any adjustments needed, and ongoing support measures. Be collaborative and positive.',
       'Hi [name], I''d like to work with you on a plan of action to support your return when you''re ready. This isn''t about rushing you back -- it''s about making sure we have the right support in place. Could we arrange a time to discuss this? I''d welcome your input on what would help most.',
       '["Review any occupational health reports received","Draft a plan of action with input from HR","Invite the employee to contribute to the plan","Include reasonable adjustments, phased return options, and support measures","Set a review date for the plan","Document and share the plan with the employee"]'::jsonb,
       'Your manager and HR will be working on a plan of action to support your eventual return. You will be invited to contribute and your input is valued. This plan may include adjustments to your role, a phased return, or other support measures.',
       true),

      (NULL, 'WEEK_10', 'Conduct first evaluation meeting',
       'Schedule a formal evaluation meeting to review the plan of action and the employee''s progress. This should be constructive and forward-looking. Discuss any barriers to return and whether adjustments are working or need modification.',
       'Hi [name], I''d like to arrange our first formal evaluation meeting to review how things are going and update the plan of action. This is a chance for us both to discuss what''s working, what might need changing, and how we can best support you. Would [date/time] work for you?',
       '["Schedule the evaluation meeting with reasonable notice","Review the plan of action before the meeting","Discuss progress, barriers, and any new information","Update the plan of action based on the discussion","Set the date for the next evaluation","Document the meeting outcome and share with the employee"]'::jsonb,
       'A formal evaluation meeting will be arranged to review your progress and update the plan of action. This is a two-way conversation and you are encouraged to share your views on what is helping and what could be improved. You may bring a companion if you wish.',
       true),

      (NULL, 'WEEK_14', 'Conduct evaluation meeting',
       'Continue the regular evaluation cycle. At 14 weeks, reassess the plan of action and consider whether any additional support or adjustments are needed. Maintain a hopeful but realistic tone about the return to work.',
       'Hi [name], it''s time for our next evaluation meeting. I''d like to review how things have been since our last discussion and see if there are any changes we should make to support you better. Would [date/time] suit you?',
       '["Schedule the evaluation meeting","Review progress since the last evaluation","Consider requesting an updated occupational health report if circumstances have changed","Update the plan of action as needed","Set the date for the next evaluation","Document the meeting outcome"]'::jsonb,
       'Your next evaluation meeting is due. This continues the regular review process to ensure you are receiving the right support. Feel free to raise any concerns or suggestions during the meeting.',
       true),

      (NULL, 'WEEK_18', 'Conduct evaluation meeting',
       'At 18 weeks, the absence is becoming extended. Continue evaluation meetings with compassion, but also begin to discuss longer-term scenarios openly and honestly. The employee needs clarity about the process ahead.',
       'Hi [name], I''d like to arrange our next evaluation meeting. I want to make sure we''re doing everything we can to support you. Let''s review where things stand and discuss the path ahead together. Would [date/time] work?',
       '["Schedule the evaluation meeting","Discuss long-term outlook openly and sensitively","Review whether current adjustments and support are adequate","Consider whether further specialist input is needed","Update the plan of action","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 18 weeks will review your progress and discuss the path ahead. Your manager will want to understand how you are feeling about a return to work and whether any additional support would help.',
       true),

      (NULL, 'WEEK_22', 'Conduct evaluation meeting',
       'Continue the evaluation cycle. At 22 weeks, review all support measures in place and assess whether the current approach is sustainable. Have an honest conversation about timelines while remaining supportive.',
       'Hi [name], it''s time for our next review. I''d like to discuss how you''re feeling and whether there''s anything else we can do. Let''s look at the plan together and make any updates. Would [date/time] suit you?',
       '["Schedule the evaluation meeting","Review all support measures and adjustments in place","Discuss realistic timelines for return","Consider whether ill-health retirement or other options should be explored","Update the plan of action","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 22 weeks will review your overall progress and the support in place. This is an opportunity to discuss any changes to your circumstances and your thoughts on returning to work.',
       true),

      (NULL, 'WEEK_26', 'Conduct six-month evaluation',
       'The six-month mark is significant. Conduct a thorough review of the entire case, including all medical evidence, adjustments, and support provided. This evaluation should be comprehensive and may involve HR more directly. Be transparent about the organisation''s position while showing continued care.',
       'Hi [name], we''re reaching the six-month point and I''d like to arrange a comprehensive review meeting. This is an important checkpoint for us to look at everything together -- your health, the support we''ve provided, and the plan going forward. I want to make sure we''re being as helpful as possible. Would [date/time] work?',
       '["Schedule a comprehensive review meeting with HR involvement","Prepare a full case summary including all medical evidence","Review all adjustments and support measures provided to date","Discuss long-term prognosis and realistic return scenarios","Consider formal options if return is unlikely in the medium term","Document the meeting thoroughly"]'::jsonb,
       'A comprehensive six-month review will be conducted. This is an important milestone where your employer will review the full picture of your absence, the support provided, and the plan ahead. You are encouraged to share any medical updates and your own view of your recovery.',
       true),

      (NULL, 'WEEK_30', 'Conduct evaluation meeting',
       'Continue regular evaluations. At 30 weeks, the focus should increasingly be on realistic planning -- whether that means a phased return, role adjustments, or exploring other options. Be direct but compassionate.',
       'Hi [name], I''d like to arrange our next evaluation meeting. We''ll review your situation and discuss what realistic options look like going forward. As always, I want to make sure you''re supported. Would [date/time] work?',
       '["Schedule the evaluation meeting","Focus on realistic return planning","Review any updated medical evidence","Discuss alternative role options if applicable","Update the plan of action","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 30 weeks will focus on planning the path ahead. Your manager will discuss realistic options with you and ensure you continue to receive appropriate support.',
       true),

      (NULL, 'WEEK_34', 'Conduct evaluation meeting',
       'At 34 weeks, continue the evaluation process. If a return to work remains unlikely, begin discussing formal options more concretely with HR. Ensure the employee understands the process and their rights throughout.',
       'Hi [name], it''s time for our next review meeting. I want to discuss how you''re doing and look at the options ahead. It''s important we''re open with each other about the situation. Would [date/time] suit you?',
       '["Schedule the evaluation meeting","Review the latest medical position","Discuss formal options with HR before the meeting","Be transparent about the organisation''s considerations","Ensure the employee understands their rights and any support available","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 34 weeks will review your situation. Your employer may discuss formal options at this stage. You have the right to be accompanied at meetings and to seek independent advice.',
       true),

      (NULL, 'WEEK_38', 'Conduct evaluation meeting',
       'Continue evaluations at 38 weeks. The tone should balance continued support with honest discussion about the sustainability of the absence. Work closely with HR on any formal processes that may need to begin.',
       'Hi [name], I''d like to arrange our next evaluation meeting. I want to review where things stand and talk honestly about the way forward. Your wellbeing remains important to us. Would [date/time] work?',
       '["Schedule the evaluation meeting","Work with HR to prepare for the discussion","Review all options available to both parties","Ensure fair and transparent communication","Update the plan of action","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 38 weeks will continue the review process. Your employer will discuss the options ahead with you. You may wish to seek advice from a union representative or employment adviser.',
       true),

      (NULL, 'WEEK_42', 'Conduct evaluation meeting',
       'At 42 weeks, the absence is approaching one year. If a return is not foreseeable, the organisation needs to consider formal next steps. Ensure all previous evaluations and support measures are well documented.',
       'Hi [name], we''re approaching a significant point in your absence and I''d like to arrange our next review. I want to discuss the situation openly and ensure you understand what happens next. Would [date/time] suit you?',
       '["Schedule the evaluation meeting","Prepare a comprehensive case review with HR","Discuss the approaching 52-week capability review threshold","Ensure all documentation is complete and accurate","Be clear about the formal process while showing empathy","Document the meeting outcome"]'::jsonb,
       'Your evaluation meeting at 42 weeks marks an important stage. Your employer will discuss the broader picture, including what happens as the absence approaches one year. Make sure you understand the process and seek advice if needed.',
       true),

      (NULL, 'WEEK_46', 'Conduct evaluation meeting',
       'At 46 weeks, prepare the employee for the formal capability review at 52 weeks if return remains unlikely. This conversation should be handled with great sensitivity. Ensure the employee has access to support and representation.',
       'Hi [name], I''d like to arrange our next meeting. As we approach the one-year mark, I want to make sure you understand the process ahead and that you have all the support you need. Would [date/time] work?',
       '["Schedule the evaluation meeting","Formally advise of the approaching capability review process","Ensure the employee understands their rights and options","Offer access to employee assistance programmes","Coordinate with HR on capability review preparation","Document the meeting and communications thoroughly"]'::jsonb,
       'As your absence approaches one year, your employer will discuss the formal capability review process with you. You have the right to representation at meetings and access to support services. Please make sure you understand the process and your options.',
       true),

      (NULL, 'WEEK_50', 'Conduct pre-review evaluation',
       'This is the final evaluation before the formal capability review at 52 weeks. Use this meeting to ensure the employee is fully informed about what the capability review involves, their rights, and the possible outcomes. This must be handled with the utmost care and fairness.',
       'Hi [name], I''d like to arrange what will be our final evaluation meeting before the formal capability review. I want to make sure you fully understand the process, your rights, and the support available to you. Would [date/time] work? You are welcome to bring a companion.',
       '["Schedule the final pre-review evaluation","Provide written details of the capability review process","Ensure the employee knows their right to representation","Review all evidence, adjustments, and support provided","Give the employee opportunity to provide any final medical evidence","Document everything meticulously"]'::jsonb,
       'This is the final evaluation before a formal capability review. You will receive information about the process, your rights, and possible outcomes. It is strongly recommended that you seek advice and arrange for someone to accompany you to future meetings.',
       true),

      (NULL, 'WEEK_52', 'Initiate capability review',
       'The one-year mark triggers a formal capability review. This is a serious but fair process that must follow your organisation''s capability procedure. Work closely with HR throughout. The review considers whether the employee can return to their role, an alternative role, or whether termination on grounds of capability is appropriate. Ensure all steps are well documented and the process is handled with dignity.',
       'Hi [name], as we have now reached the one-year mark, we are initiating a formal capability review in line with our policy. I want to assure you that this process will be conducted fairly and with respect. You will receive a formal invitation with full details. You have the right to be accompanied at all meetings. Please don''t hesitate to reach out if you have any questions.',
       '["Issue formal capability review notification in writing","Follow the organisation''s capability review procedure exactly","Ensure HR is fully involved in all stages","Provide the employee with all relevant documentation","Confirm the employee''s right to representation","Consider all options: return to role, alternative role, ill-health retirement, termination","Document every step of the process thoroughly","Ensure decisions are fair, consistent, and legally compliant"]'::jsonb,
       'A formal capability review has been initiated following one year of absence. You will receive formal written notification with details of the process, your rights, and possible outcomes. You have the right to representation at all meetings. It is strongly recommended that you seek advice from a trade union, employment adviser, or legal representative.',
       true)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DELETE FROM milestone_guidance WHERE is_default = true AND organisation_id IS NULL");
  await knex.raw("DROP TABLE IF EXISTS milestone_guidance");
}
