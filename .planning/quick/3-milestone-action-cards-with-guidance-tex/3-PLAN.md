---
phase: quick-3
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - constants/milestone-guidance.ts
  - components/milestone-action-cards/index.tsx
  - components/case-timeline/index.tsx
  - app/(authenticated)/sickness/[id]/page.tsx
autonomous: true
must_haves:
  truths:
    - "OVERDUE and DUE_TODAY milestones show action cards with guidance text"
    - "Each action card shows what to do, suggested text, and instructions"
    - "Manager can toggle view-as-employee to see the employee perspective"
    - "UPCOMING milestones remain in the timeline without action cards"
  artifacts:
    - path: "constants/milestone-guidance.ts"
      provides: "Guidance content for each milestone key"
      contains: "MILESTONE_GUIDANCE"
    - path: "components/milestone-action-cards/index.tsx"
      provides: "Action card UI with guidance and view-as-employee toggle"
      exports: ["MilestoneActionCards"]
  key_links:
    - from: "components/milestone-action-cards/index.tsx"
      to: "constants/milestone-guidance.ts"
      via: "import MILESTONE_GUIDANCE"
      pattern: "MILESTONE_GUIDANCE\\[.*milestoneKey"
    - from: "app/(authenticated)/sickness/[id]/page.tsx"
      to: "components/milestone-action-cards/index.tsx"
      via: "renders MilestoneActionCards"
      pattern: "MilestoneActionCards"
---

<objective>
Add milestone action cards with empathetic guidance text for OVERDUE and DUE_TODAY milestones on the sickness case detail page, plus a "View as Employee" toggle showing the employee perspective.

Purpose: Managers currently see a timeline but get no guidance on WHAT to do. Action cards tell them exactly what action to take, what to say, and how to handle each milestone with empathy.
Output: Guidance constants, action card component, integrated into case detail page.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@constants/milestone-defaults.ts
@components/case-timeline/index.tsx
@components/sickness-case-detail/index.tsx
@app/(authenticated)/sickness/[id]/page.tsx
@providers/services/milestone.service.ts
@types/database.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create milestone guidance constants and action card component</name>
  <files>constants/milestone-guidance.ts, components/milestone-action-cards/index.tsx</files>
  <action>
**1. Create `constants/milestone-guidance.ts`:**

Define a `MILESTONE_GUIDANCE` record keyed by milestone key (DAY_1, DAY_3, DAY_7, etc.) with this structure per entry:

```ts
export interface MilestoneGuidance {
  actionTitle: string;        // e.g. "Contact your employee"
  managerGuidance: string;    // What the manager should do (2-3 sentences, empathetic tone)
  suggestedText: string;      // Example message/script the manager can use or adapt
  instructions: string[];     // Step-by-step bullet points
  employeeView: string;       // What the employee sees/experiences at this stage (for view-as-employee)
}
```

Populate guidance for ALL milestone keys from `milestone-defaults.ts`. Use empathetic, HR-professional language. Examples:

- **DAY_1**: actionTitle: "Contact your employee", managerGuidance: "Reach out to your employee to acknowledge their absence and express concern for their wellbeing. Keep the conversation supportive, not investigative.", suggestedText: "Hi [name], I hope you're feeling okay. Just wanted to let you know we've noted your absence and hope you recover soon. Please don't worry about work -- just focus on getting better. Let me know if there's anything I can do to help.", instructions: ["Send a brief, supportive message via phone/email", "Do not ask for medical details at this stage", "Record the absence start date", "Ensure the employee knows who to contact if they need anything"], employeeView: "Your manager has been notified of your absence. You should receive a supportive message from them. No action is required from you at this stage -- focus on your recovery."

- **DAY_3**: actionTitle: "Remind about GP visit", suggestedText about fit note requirements after 7 days, employeeView about what to expect.

- **DAY_7**: actionTitle: "Request fit note", guidance about long-term transition, suggestedText asking for fit note, employeeView explaining fit note requirement.

- **WEEK_2** through **WEEK_6**: Check-in, renewal reminders, OH report request, plan of action -- each with appropriate guidance.

- **WEEK_10+** evaluation milestones: actionTitle: "Conduct evaluation meeting", guidance about structured review, suggestedText for meeting invite, employeeView about what to expect.

- **WEEK_52**: actionTitle: "Initiate capability review", serious but fair guidance about formal process.

For the repeating evaluation milestones (WEEK_10 through WEEK_50), use similar content but adjust the tone to reflect the duration (earlier ones more hopeful about return, later ones more about long-term planning).

**2. Create `components/milestone-action-cards/index.tsx`:**

Props interface:
```ts
interface Props {
  timeline: CaseTimelineEntry[];
  employeeName?: string;  // For personalising suggested text
}
```

Component behaviour:
- Filter timeline to only OVERDUE and DUE_TODAY entries
- If no actionable milestones, render nothing (return null)
- Show a section header: "Actions Required" with a count badge
- For each actionable milestone, render a card (use shadcn Card component or a styled div with border):
  - Left colour accent: red for OVERDUE, amber for DUE_TODAY
  - Status badge (reuse the existing StatusBadge pattern from case-timeline)
  - `actionTitle` as card heading
  - `managerGuidance` as the main guidance paragraph
  - Expandable "Suggested text" section (use shadcn Collapsible or a simple useState toggle with ChevronDown/ChevronUp icon) showing `suggestedText`. Replace `[name]` with employeeName if provided.
  - `instructions` as a numbered/bulleted checklist
- Add a "View as Employee" toggle button (Eye/EyeOff icon from lucide-react) at the section level (not per-card):
  - When toggled ON, each card shows the `employeeView` text in a distinct blue-tinted panel below the manager guidance
  - Toggle state managed with useState
- Use Tailwind classes consistent with the existing case-timeline styling
- Named export: `MilestoneActionCards`
  </action>
  <verify>
TypeScript compiles: `npx tsc --noEmit --pretty 2>&1 | head -30`. Lint passes: `npx eslint constants/milestone-guidance.ts components/milestone-action-cards/index.tsx --no-error-on-unmatched-pattern`.
  </verify>
  <done>
Milestone guidance constants exist for all milestone keys. MilestoneActionCards component renders action cards for OVERDUE/DUE_TODAY milestones with guidance text, suggested text (expandable), instructions, and a view-as-employee toggle showing the employee perspective.
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate action cards into the sickness case detail page</name>
  <files>components/case-timeline/index.tsx, app/(authenticated)/sickness/[id]/page.tsx</files>
  <action>
**1. Update `components/case-timeline/index.tsx`:**

Export the timeline data so the parent page can pass it to MilestoneActionCards. Change the component to accept an optional `onTimelineLoaded` callback prop:

```ts
interface Props {
  caseId: string;
  onTimelineLoaded?: (timeline: CaseTimelineEntry[]) => void;
}
```

In the useEffect after `setTimeline(res.timeline)`, call `onTimelineLoaded?.(res.timeline)`.

Also re-export `CaseTimelineEntry` from this file for convenience (it's already imported from milestone.service).

**2. Update `app/(authenticated)/sickness/[id]/page.tsx`:**

- Import `MilestoneActionCards` from `@/components/milestone-action-cards`
- Import `CaseTimelineEntry` from `@/providers/services/milestone.service`
- Add state: `const [timeline, setTimeline] = useState<CaseTimelineEntry[]>([])`
- Pass `onTimelineLoaded={setTimeline}` to the CaseTimeline component
- Render `<MilestoneActionCards timeline={timeline} employeeName={...} />` between the SicknessCaseDetail component and the Absence Timeline section (so action cards appear prominently before the full timeline)
- For employeeName: the `data` object has `data.sicknessCase` -- check if it has employee name fields. If not available directly, pass undefined (the component handles missing names gracefully by leaving `[name]` as-is). Check the SicknessCase type or the API response to see if employee name is available.
- Remove the placeholder text "Manager guidance prompts will be available in a future update." from `components/sickness-case-detail/index.tsx` (line 212)
  </action>
  <verify>
TypeScript compiles: `npx tsc --noEmit --pretty 2>&1 | head -30`. Lint passes on modified files. The sickness case detail page renders action cards above the timeline for active cases.
  </verify>
  <done>
MilestoneActionCards renders on the sickness case detail page between case details and the timeline. Action cards appear for any OVERDUE or DUE_TODAY milestones with full guidance. The placeholder guidance text is removed. View-as-employee toggle works.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npx eslint . --ext .ts,.tsx --no-error-on-unmatched-pattern 2>&1 | tail -5` shows no errors in modified files
- All milestone keys from milestone-defaults.ts have corresponding entries in MILESTONE_GUIDANCE
- MilestoneActionCards renders null when no actionable milestones exist
- View-as-employee toggle shows/hides employee perspective panel
</verification>

<success_criteria>
- Guidance content exists for all 19 milestone keys with actionTitle, managerGuidance, suggestedText, instructions, and employeeView
- Action cards appear on sickness case detail page for OVERDUE and DUE_TODAY milestones
- Each card shows the action needed, guidance, expandable suggested text, and step-by-step instructions
- View-as-employee toggle reveals the employee perspective for each milestone
- No TypeScript or lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-milestone-action-cards-with-guidance-tex/3-SUMMARY.md`
</output>
