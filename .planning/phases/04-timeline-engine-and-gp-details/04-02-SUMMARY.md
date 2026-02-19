---
phase: 04-timeline-engine-and-gp-details
plan: 02
subsystem: api, ui
tags: [milestones, timeline, sickness-case, org-config, react-hook-form, zod]

# Dependency graph
requires:
  - phase: 04-01
    provides: "milestone_configs table, milestone-config schema, milestone-defaults constants, MilestoneConfig type"
provides:
  - "MilestoneConfigRepository with CRUD and default/override resolution"
  - "MilestoneService with effective milestone merge and case timeline computation"
  - "Milestone config API routes (GET/POST milestones, PUT/DELETE milestones/[id])"
  - "Case timeline API route (GET sickness-cases/[id]/timeline)"
  - "Milestone config admin page for org admins"
  - "CaseTimeline component for sickness case detail"
  - "Client-side actions for milestones and case timeline"
affects: [04-03, notifications, case-management]

# Tech tracking
tech-stack:
  added: []
  patterns: ["default/override merge pattern for org-scoped configs", "vertical timeline component with status states"]

key-files:
  created:
    - providers/repositories/milestone-config.repository.ts
    - providers/services/milestone.service.ts
    - app/api/organisations/[slug]/milestones/route.ts
    - app/api/organisations/[slug]/milestones/[id]/route.ts
    - app/api/sickness-cases/[id]/timeline/route.ts
    - actions/milestones.ts
    - components/milestone-config-form/index.tsx
    - components/case-timeline/index.tsx
    - app/(authenticated)/organisations/[slug]/milestones/page.tsx
  modified:
    - actions/sickness-cases.ts
    - app/(authenticated)/sickness/[id]/page.tsx
    - components/sidebar/nav-items.ts

key-decisions:
  - "Fallback to hardcoded DEFAULT_MILESTONES if DB not seeded, ensuring timeline works before migration seed"
  - "Upsert pattern for org milestone overrides keyed by milestoneKey"

patterns-established:
  - "Default/override merge: system defaults + org overrides merged by key, active-only filter, sorted by dayOffset"
  - "CaseTimelineEntry with PASSED/DUE_TODAY/UPCOMING status computation from absenceStartDate + dayOffset vs today"

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 04 Plan 02: Milestone Timeline Engine Summary

**Milestone config CRUD with default/override merge logic, case timeline API with PASSED/DUE_TODAY/UPCOMING statuses, and org admin config UI with vertical timeline component**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T15:06:03Z
- **Completed:** 2026-02-19T15:10:48Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- MilestoneConfigRepository with full CRUD, default queries, and org-key lookup
- MilestoneService merges system defaults with org overrides and computes case timeline with correct date-based statuses
- API routes following established auth/permission/tenant/audit pattern for both milestone config and case timeline
- Org admin milestones page with card layout, edit dialog, and reset-to-default functionality
- Vertical CaseTimeline component showing past/current/future milestones with colour-coded status icons
- Sidebar nav item for Milestones visible to PLATFORM_ADMIN and ORG_ADMIN

## Task Commits

Each task was committed atomically:

1. **Task 1: Create milestone config repository, service, and API routes** - `0da98c0` (feat)
2. **Task 2: Create milestone config UI page and case timeline component** - `9a02883` (feat)

## Files Created/Modified
- `providers/repositories/milestone-config.repository.ts` - CRUD with default/override queries, parameterised SQL
- `providers/services/milestone.service.ts` - Effective milestone merge, case timeline computation, upsert logic
- `app/api/organisations/[slug]/milestones/route.ts` - GET effective milestones, POST upsert override
- `app/api/organisations/[slug]/milestones/[id]/route.ts` - PUT update override, DELETE reset to default
- `app/api/sickness-cases/[id]/timeline/route.ts` - GET timeline for a sickness case
- `actions/milestones.ts` - Client-side fetch wrappers for milestone CRUD
- `actions/sickness-cases.ts` - Added fetchCaseTimeline action
- `components/milestone-config-form/index.tsx` - React Hook Form with Zod for editing milestone overrides
- `components/case-timeline/index.tsx` - Vertical timeline with PASSED/DUE_TODAY/UPCOMING states
- `app/(authenticated)/organisations/[slug]/milestones/page.tsx` - Org admin milestone config page
- `app/(authenticated)/sickness/[id]/page.tsx` - Added Absence Timeline section for active cases
- `components/sidebar/nav-items.ts` - Added Milestones nav item with Timer icon

## Decisions Made
- Fallback to hardcoded DEFAULT_MILESTONES when DB has no seeded defaults, so the timeline works even before migration seed data is applied
- Upsert pattern for org milestone overrides: if org already has config for a milestoneKey, update it; otherwise create new override row
- Timeline only shown for active cases (status !== CLOSED)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed CANCELLED status check from sickness case page**
- **Found during:** Task 2 (case detail page modification)
- **Issue:** Plan specified filtering by "RESOLVED or CANCELLED" but SicknessState enum only has CLOSED, not CANCELLED
- **Fix:** Changed condition to only check for CLOSED status
- **Files modified:** app/(authenticated)/sickness/[id]/page.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 9a02883

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor correction to match actual enum values. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Milestone timeline engine fully operational for plan 04-03 (GP details and medical consent)
- API endpoints ready for future notification integration (milestone due alerts)

---
*Phase: 04-timeline-engine-and-gp-details*
*Completed: 2026-02-19*
