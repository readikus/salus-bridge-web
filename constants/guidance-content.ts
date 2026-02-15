/**
 * Manager conversation guidance content.
 * Scripted, empathetic guidance for initial contact, check-in, and RTW meeting scenarios.
 * Compliant with UK employment best practice (ACAS, Equality Act 2010).
 */

export interface GuidanceStep {
  id: string;
  title: string;
  prompt: string;
  rationale: string;
  doList: string[];
  dontList: string[];
}

export interface GuidanceScript {
  id: string;
  type: "initial_contact" | "check_in" | "rtw_meeting";
  absenceType: string;
  title: string;
  description: string;
  steps: GuidanceStep[];
}

export const GUIDANCE_SCRIPTS: GuidanceScript[] = [
  // ── Initial Contact: Mental Health ──────────────────────────────────
  {
    id: "initial_contact_mental_health",
    type: "initial_contact",
    absenceType: "mental_health",
    title: "Initial Contact: Mental Health Absence",
    description: "Guidance for making first contact with an employee absent due to mental health reasons.",
    steps: [
      {
        id: "ic_mh_1",
        title: "Open with genuine care",
        prompt:
          "Hi [name], I just wanted to check in and let you know we're thinking of you. There's no pressure to go into any details -- I simply wanted you to know we're here to support you whenever you're ready.",
        rationale:
          "People experiencing mental health difficulties often feel guilt or pressure about being off work. Leading with care rather than questions about return dates reduces anxiety and builds trust.",
        doList: [
          "Use a warm, unhurried tone",
          "Let them know their role is covered and the team is fine",
          "Ask how they'd prefer to stay in touch (call, text, email)",
          "Respect silence -- it's okay if they don't say much",
        ],
        dontList: [
          "Don't ask for a diagnosis or specific condition",
          "Don't mention how their absence is affecting the team",
          "Don't suggest when they should come back",
          "Don't share their absence reason with colleagues",
        ],
      },
      {
        id: "ic_mh_2",
        title: "Establish communication preferences",
        prompt:
          "What works best for you in terms of keeping in touch? I'm happy to check in by text, email, or a quick call -- whatever feels most comfortable. We can keep it as brief as you like.",
        rationale:
          "Giving control over communication method and frequency respects autonomy and reduces the pressure of unexpected calls, which can be particularly distressing for those with anxiety.",
        doList: [
          "Offer multiple communication channels",
          "Agree on a frequency that feels manageable",
          "Confirm they can change their preference at any time",
          "Note their preference for future check-ins",
        ],
        dontList: [
          "Don't insist on phone calls if they prefer text",
          "Don't contact them outside agreed times",
          "Don't ask them to be available at all times",
          "Don't involve others in the communication without consent",
        ],
      },
      {
        id: "ic_mh_3",
        title: "Signpost support resources",
        prompt:
          "I wanted to make sure you know about the support available. We have [EAP/occupational health/other resources]. There's no obligation to use any of them, but they're there if you find them helpful.",
        rationale:
          "Employees may not be aware of workplace support services. Signposting without pressure demonstrates the organisation's commitment to wellbeing while respecting personal choice.",
        doList: [
          "Mention specific available resources (EAP, OH referral)",
          "Emphasise that using these services is confidential",
          "Offer to send details by email so they can look in their own time",
          "Let them know the company genuinely wants to help",
        ],
        dontList: [
          "Don't pressure them to use any particular service",
          "Don't imply they need professional help",
          "Don't make assumptions about what support they need",
          "Don't share that you've offered resources with others",
        ],
      },
      {
        id: "ic_mh_4",
        title: "Close with reassurance",
        prompt:
          "Take all the time you need. When you're ready to think about coming back, we'll work together to make sure the transition feels right for you. There's genuinely no rush.",
        rationale:
          "A clear, pressure-free close helps the employee focus on recovery without worrying about work expectations. This reduces the risk of a premature return that could worsen their condition.",
        doList: [
          "Reiterate that their health comes first",
          "Confirm the next check-in date",
          "Thank them for speaking with you",
          "Document the conversation (factual notes only)",
        ],
        dontList: [
          "Don't end with questions about return dates",
          "Don't mention workload piling up",
          "Don't ask them to do any work tasks while off",
          "Don't make promises you cannot keep about their role",
        ],
      },
    ],
  },

  // ── Initial Contact: Musculoskeletal ────────────────────────────────
  {
    id: "initial_contact_musculoskeletal",
    type: "initial_contact",
    absenceType: "musculoskeletal",
    title: "Initial Contact: Musculoskeletal Absence",
    description: "Guidance for making first contact with an employee absent due to a musculoskeletal condition.",
    steps: [
      {
        id: "ic_msk_1",
        title: "Open with care and practical support",
        prompt:
          "Hi [name], I hope you're managing okay. I wanted to check in and see how you're doing. There's no need to go into medical details -- I just want to make sure we're supporting you properly.",
        rationale:
          "Musculoskeletal conditions vary widely in severity and recovery time. Opening with genuine concern rather than timeline questions helps the employee feel supported rather than pressured.",
        doList: [
          "Express genuine concern for their wellbeing",
          "Acknowledge that recovery takes time",
          "Reassure them their work is being covered",
          "Keep the tone conversational and relaxed",
        ],
        dontList: [
          "Don't ask for specific medical details or diagnosis",
          "Don't compare to others who had similar injuries",
          "Don't suggest they should be better by a certain date",
          "Don't ask them to work from home if they're unfit",
        ],
      },
      {
        id: "ic_msk_2",
        title: "Discuss workplace adjustments early",
        prompt:
          "When you do start thinking about coming back, we can look at things like a phased return, adjusted duties, or any equipment changes that might help. We'll figure out what works best for you.",
        rationale:
          "Early mention of adjustments signals that a return doesn't have to be all-or-nothing. For physical conditions, practical workplace changes often make the difference between a successful and unsuccessful return.",
        doList: [
          "Mention specific adjustments that may be relevant (ergonomic equipment, reduced lifting)",
          "Make clear that adjustments are normal and available",
          "Ask if they've received any guidance from their GP or physiotherapist",
          "Note any mentioned needs for the RTW planning stage",
        ],
        dontList: [
          "Don't promise adjustments you haven't confirmed with the organisation",
          "Don't minimise the condition or suggest they just need rest",
          "Don't ask them to do a specific workplace assessment while unwell",
          "Don't imply adjustments are difficult to arrange",
        ],
      },
      {
        id: "ic_msk_3",
        title: "Agree on keeping in touch",
        prompt:
          "I'd like to keep in touch while you're off -- nothing formal, just a quick check-in to see how you're getting on. Would a brief call or message every [week/two weeks] work for you?",
        rationale:
          "Regular but light-touch contact prevents the employee from feeling isolated or forgotten while avoiding the impression of being monitored or pressured.",
        doList: [
          "Agree on a specific contact schedule",
          "Let them choose the method (call, text, email)",
          "Keep check-ins brief and focused on wellbeing",
          "Document the agreed contact schedule",
        ],
        dontList: [
          "Don't make check-ins feel like performance reviews",
          "Don't ask for daily updates on their condition",
          "Don't use check-ins to assign work tasks",
          "Don't contact outside agreed times unless urgent",
        ],
      },
    ],
  },

  // ── Initial Contact: General ────────────────────────────────────────
  {
    id: "initial_contact_general",
    type: "initial_contact",
    absenceType: "general",
    title: "Initial Contact: General Absence",
    description: "Guidance for making first contact for respiratory, surgical, or other absence types.",
    steps: [
      {
        id: "ic_gen_1",
        title: "Make contact with warmth",
        prompt:
          "Hi [name], I wanted to check in and see how you're doing. We hope you're feeling better. There's nothing urgent -- I just wanted you to know we're here if you need anything.",
        rationale:
          "A straightforward, warm opening works well for most absence types. It shows care without making assumptions about the severity or nature of the illness.",
        doList: [
          "Keep the tone light and friendly",
          "Acknowledge their absence without making it the focus",
          "Let them lead the conversation depth",
          "Reassure them about work coverage",
        ],
        dontList: [
          "Don't ask for medical details",
          "Don't minimise their absence ('just a cold')",
          "Don't discuss team workload",
          "Don't suggest they could work from home while unwell",
        ],
      },
      {
        id: "ic_gen_2",
        title: "Offer support and set expectations",
        prompt:
          "There's no rush to get back, but when you're feeling ready, just let us know and we'll make sure everything's set up for a smooth return. Is there anything we can do for you in the meantime?",
        rationale:
          "Setting clear expectations -- that there's no rush and support is available -- reduces anxiety about returning. Asking what they need empowers them to voice specific concerns.",
        doList: [
          "Make clear there's no pressure to return before they're ready",
          "Offer to send any information they might need",
          "Ask about their preferred way to stay in touch",
          "Note any specific support they request",
        ],
        dontList: [
          "Don't ask when they'll be back",
          "Don't send work updates unless they request them",
          "Don't imply their absence is causing problems",
          "Don't discuss their absence with other team members",
        ],
      },
      {
        id: "ic_gen_3",
        title: "Close and arrange follow-up",
        prompt:
          "Thanks for chatting with me. I'll check in again [in a week / next Tuesday] unless you'd prefer a different time. Take care and focus on getting better.",
        rationale:
          "A clear close with a scheduled follow-up gives structure without pressure. It ensures the employee knows when to expect contact next.",
        doList: [
          "Confirm the next contact date",
          "Thank them for their time",
          "Wish them well genuinely",
          "Record a brief, factual note of the conversation",
        ],
        dontList: [
          "Don't leave the follow-up date vague",
          "Don't end with work-related requests",
          "Don't forget to actually follow up when agreed",
          "Don't share conversation details with the wider team",
        ],
      },
    ],
  },

  // ── Check-in: General ───────────────────────────────────────────────
  {
    id: "check_in_general",
    type: "check_in",
    absenceType: "general",
    title: "Check-in During Absence",
    description: "Guidance for ongoing check-in conversations during a period of absence.",
    steps: [
      {
        id: "ci_gen_1",
        title: "Start with genuine interest",
        prompt:
          "Hi [name], just checking in as we agreed. How are you feeling? No pressure to discuss anything specific -- I mainly wanted to see how you're getting on.",
        rationale:
          "Consistent, predictable check-ins maintain connection. Starting with open-ended wellbeing questions rather than return-focused questions keeps the conversation supportive.",
        doList: [
          "Reference the previously agreed schedule",
          "Ask about their general wellbeing first",
          "Listen actively and let them set the pace",
          "Be prepared for good days and bad days",
        ],
        dontList: [
          "Don't jump straight to return-to-work questions",
          "Don't express frustration about the length of absence",
          "Don't compare their progress to expectations",
          "Don't ask detailed medical questions",
        ],
      },
      {
        id: "ci_gen_2",
        title: "Explore readiness gently",
        prompt:
          "Have you had any thoughts about coming back, or is it still too early to think about that? Either way is absolutely fine -- we'll go at your pace.",
        rationale:
          "Gently exploring readiness gives the employee permission to think about return without feeling pushed. Their answer helps you plan without creating pressure.",
        doList: [
          "Accept 'not yet' as a perfectly valid answer",
          "If they express interest, discuss potential adjustments",
          "Note any changes in their outlook since last check-in",
          "Ask if they've had any medical guidance about return timelines",
        ],
        dontList: [
          "Don't push for a specific return date",
          "Don't imply they've been off too long",
          "Don't mention absence triggers or policies at this point",
          "Don't make them feel guilty for not being ready",
        ],
      },
      {
        id: "ci_gen_3",
        title: "Share relevant updates (if appropriate)",
        prompt:
          "I thought you might like to know [brief, positive team update]. But no need to worry about anything -- we've got it covered. Is there anything you'd like to know about?",
        rationale:
          "Brief, positive updates help the employee stay connected to the workplace and reduce anxiety about returning to an unfamiliar environment. Let them choose what they want to hear about.",
        doList: [
          "Share only positive or neutral updates",
          "Keep updates brief and optional",
          "Let them ask questions if they want more detail",
          "Mention any positive changes that might make return easier",
        ],
        dontList: [
          "Don't overwhelm with detailed work updates",
          "Don't mention problems caused by their absence",
          "Don't share gossip or negative team dynamics",
          "Don't send meeting notes or project updates unless requested",
        ],
      },
      {
        id: "ci_gen_4",
        title: "Confirm next steps",
        prompt:
          "Shall we keep our check-ins at the same time, or would you prefer to change things? And remember, if anything comes up between now and then, you can always reach out.",
        rationale:
          "Confirming the schedule maintains structure while giving the employee control. Reminding them they can initiate contact empowers them and prevents feelings of isolation.",
        doList: [
          "Confirm or adjust the check-in schedule",
          "Remind them of available support resources",
          "Thank them for the conversation",
          "Update your records with any new information",
        ],
        dontList: [
          "Don't change the frequency without their agreement",
          "Don't skip scheduled check-ins",
          "Don't make the check-in feel like a formality",
          "Don't forget to follow through on anything you promised",
        ],
      },
    ],
  },

  // ── RTW Meeting: General ────────────────────────────────────────────
  {
    id: "rtw_meeting_general",
    type: "rtw_meeting",
    absenceType: "general",
    title: "Return-to-Work Meeting",
    description: "Guidance for conducting a structured return-to-work meeting.",
    steps: [
      {
        id: "rtw_gen_1",
        title: "Welcome back warmly",
        prompt:
          "Welcome back, [name]. It's really good to see you. Before we go through anything formal, how are you feeling about being back? Take your time -- there's no rush.",
        rationale:
          "The first moments of a return-to-work meeting set the tone. A warm, unhurried welcome signals that this is a supportive conversation, not an interrogation about their absence.",
        doList: [
          "Smile and be genuinely welcoming",
          "Give them time to settle and feel comfortable",
          "Hold the meeting somewhere private and quiet",
          "Have water available and allow breaks",
        ],
        dontList: [
          "Don't rush straight into the questionnaire",
          "Don't say 'we've been struggling without you'",
          "Don't make comments about the length of absence",
          "Don't conduct the meeting in a public area",
        ],
      },
      {
        id: "rtw_gen_2",
        title: "Explore their experience",
        prompt:
          "I'd like to understand how you're feeling and if there's anything we can do to support your return. You don't need to share any medical details -- just whatever you're comfortable with.",
        rationale:
          "Understanding the employee's perspective is essential for planning appropriate support. Explicitly stating they don't need to share medical details removes pressure while leaving space for voluntary disclosure.",
        doList: [
          "Listen actively without interrupting",
          "Take notes on support needs, not medical details",
          "Acknowledge their feelings and experiences",
          "Ask follow-up questions about what would help, not what happened",
        ],
        dontList: [
          "Don't probe for a diagnosis or medical details",
          "Don't take notes that could be seen as a medical record",
          "Don't compare their experience to others",
          "Don't minimise or dismiss what they share",
        ],
      },
      {
        id: "rtw_gen_3",
        title: "Discuss workplace adjustments",
        prompt:
          "Let's talk about what would make your return as smooth as possible. We can look at things like a phased return, adjusted hours, modified duties, or any equipment changes. What do you think would help?",
        rationale:
          "Proactively offering adjustments demonstrates commitment to a successful return. Under the Equality Act 2010, employers have a duty to make reasonable adjustments for disabled employees.",
        doList: [
          "Present adjustment options clearly",
          "Let them suggest what would help most",
          "Agree on specific adjustments with review dates",
          "Document all agreed adjustments in writing",
        ],
        dontList: [
          "Don't dismiss adjustment requests as unnecessary",
          "Don't agree to adjustments you can't deliver",
          "Don't make adjustments sound like special treatment",
          "Don't set unrealistic review timelines",
        ],
      },
      {
        id: "rtw_gen_4",
        title: "Agree on a plan and close positively",
        prompt:
          "Let me summarise what we've agreed: [recap adjustments and plan]. We'll review how things are going on [date]. If anything changes or you need more support before then, please come and talk to me. Welcome back -- we're glad you're here.",
        rationale:
          "A clear summary ensures both parties understand the agreed plan. Setting a review date creates accountability. Closing positively reinforces that the employee is valued and supported.",
        doList: [
          "Summarise all agreed actions and adjustments clearly",
          "Set a specific review date (typically 1-2 weeks)",
          "Give them a copy of the agreed plan",
          "Check they have everything they need for their first day back",
        ],
        dontList: [
          "Don't leave the meeting without clear next steps",
          "Don't forget to actually follow up on the review date",
          "Don't share the meeting details with other team members",
          "Don't set expectations that are too demanding for the first week",
        ],
      },
    ],
  },
];
