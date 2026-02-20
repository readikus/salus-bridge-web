---
phase: quick-3
plan: 1
subsystem: ui
tags: [react, tailwind, milestone-guidance, action-cards]

requires:
  - phase: 04-timeline-engine-and-gp-details
    provides: CaseTimeline component and CaseTimelineEntry type
provides:
  - MILESTONE_GUIDANCE constants with empathetic HR guidance for all 19 milestone keys
  - MilestoneActionCards component rendering actionable cards for OVERDUE/DUE_TODAY milestones
  - View-as-employee toggle showing employee perspective
affects: [sickness-case-detail, case-timeline, milestone-actions]

tech-stack:
  added: []
  patterns: [callback prop for child-to-parent data sharing, expandable card sections]

key-files:
  created:
    - constants/milestone-guidance.ts
    - components/milestone-action-cards/index.tsx
  modified:
    - components/case-timeline/index.tsx
    - components/sickness-case-detail/index.tsx
    - app/(authenticated)/sickness/[id]/page.tsx

key-decisions:
  - "onTimelineLoaded callback pattern to share CaseTimeline data with parent page"
  - "Employee name left as [name] placeholder when not available from API response"

patterns-established:
  - "Callback prop pattern: child component exposes data via onXLoaded callback"
  - "Expandable card sections: useState toggle with ChevronDown/ChevronUp icons"

duration: 3min
completed: 2026-02-20
---

# Quick Task 3: Milestone Action Cards with Guidance Text Summary

**Empathetic HR guidance cards for 19 milestone keys with expandable suggested text, step-by-step instructions, and view-as-employee toggle on sickness case detail page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T08:06:28Z
- **Completed:** 2026-02-20T08:10:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created MILESTONE_GUIDANCE constants covering all 19 milestone keys (DAY_1 through WEEK_52) with actionTitle, managerGuidance, suggestedText, instructions, and employeeView
- Built MilestoneActionCards component that filters timeline to OVERDUE/DUE_TODAY entries and renders action cards with colour-coded accents, expandable suggested text, and numbered instructions
- Integrated action cards into sickness case detail page between case details and the full timeline
- Added view-as-employee toggle showing the employee perspective in a blue-tinted panel
- Removed placeholder guidance text from SicknessCaseDetail component

## Task Commits

Each task was committed atomically:

1. **Task 1: Create milestone guidance constants and action card component** - `e0869aa` (feat)
2. **Task 2: Integrate action cards into the sickness case detail page** - `a73056c` (feat)

## Files Created/Modified
- `constants/milestone-guidance.ts` - MilestoneGuidance interface and MILESTONE_GUIDANCE record for all 19 milestone keys
- `components/milestone-action-cards/index.tsx` - MilestoneActionCards component with action cards, expandable text, and employee view toggle
- `components/case-timeline/index.tsx` - Added onTimelineLoaded callback prop and re-exported CaseTimelineEntry type
- `components/sickness-case-detail/index.tsx` - Removed placeholder guidance text
- `app/(authenticated)/sickness/[id]/page.tsx` - Added MilestoneActionCards integration with timeline state

## Decisions Made
- Used onTimelineLoaded callback pattern rather than lifting timeline fetch to parent, keeping CaseTimeline's existing data fetching intact
- Employee name passed as undefined since SicknessCase type does not include employee name fields; suggestedText shows [name] placeholder which managers can mentally substitute

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

---
*Quick Task: 3*
*Completed: 2026-02-20*
