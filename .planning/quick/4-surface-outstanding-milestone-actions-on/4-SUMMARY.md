---
phase: quick-4
plan: 01
subsystem: ui, api
tags: [dashboard, milestone-actions, server-component, postgresql]

requires:
  - phase: 05-milestone-actions-and-communication-log
    provides: milestone_actions table and MilestoneActionRepository
provides:
  - Outstanding actions dashboard widget with real data
  - findOutstandingWithDetails repository method for org-wide action queries
affects: [dashboard, milestone-actions]

tech-stack:
  added: []
  patterns:
    - "Server-side data fetch in dashboard page with TenantService.withTenant"
    - "Overdue/due-soon badge pattern with date comparison"

key-files:
  created:
    - components/outstanding-actions/index.tsx
  modified:
    - providers/repositories/milestone-action.repository.ts
    - app/(authenticated)/dashboard/page.tsx

key-decisions:
  - "Server-side rendering only -- no API route or client action needed for dashboard data"
  - "LIMIT 20 on outstanding actions query for dashboard performance"

duration: 5min
completed: 2026-02-20
---

# Quick Task 4: Surface Outstanding Milestone Actions on Dashboard

**Real outstanding action counts and scrollable list with overdue/due-soon badges on manager and org admin dashboards**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-20T09:38:51Z
- **Completed:** 2026-02-20T09:43:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Manager dashboard Pending Actions card shows real count from milestone_actions table instead of hardcoded 0
- Outstanding actions displayed in scrollable list with employee name, milestone label, due date, and overdue/due-soon badges
- Each action item links to `/sickness/{caseId}` for quick navigation
- Org admin/HR dashboard also surfaces outstanding actions when they exist
- Empty state handled gracefully with "No actions required" message

## Task Commits

Each task was committed atomically:

1. **Task 1: Add repository method for outstanding actions with details** - `756a76f` (feat)
2. **Task 2: Create outstanding actions component and wire into dashboard** - `c483332` (feat)

## Files Created/Modified
- `providers/repositories/milestone-action.repository.ts` - Added findOutstandingWithDetails method querying PENDING/IN_PROGRESS actions with employee names and milestone labels
- `components/outstanding-actions/index.tsx` - Server component rendering scrollable list of actions with overdue (red) and due-soon (amber) badges
- `app/(authenticated)/dashboard/page.tsx` - Wired real outstanding action data into manager and org admin/HR dashboards

## Decisions Made
- Server-side rendering only -- dashboard is already a Server Component, no need for API route or client action
- LIMIT 20 on the outstanding actions query to keep dashboard rendering fast
- Overdue threshold: due date strictly before today (date-only comparison)
- Due soon threshold: within 2 days from today

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

---
*Quick Task: 4*
*Completed: 2026-02-20*
