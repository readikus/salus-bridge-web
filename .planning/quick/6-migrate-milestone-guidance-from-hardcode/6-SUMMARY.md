---
phase: quick-6
plan: 01
subsystem: database, api
tags: [postgres, rls, repository-pattern, milestone-guidance]

requires:
  - phase: quick-3
    provides: "MILESTONE_GUIDANCE constant and MilestoneGuidance interface"
  - phase: 04-timeline-engine-and-gp-details
    provides: "milestone_configs table pattern, MilestoneService, case-timeline component"
provides:
  - "milestone_guidance DB table with 19 seeded default entries"
  - "MilestoneGuidanceRepository for DB access"
  - "MilestoneService.getGuidanceForMilestone and getGuidanceMap methods"
  - "GET /api/sickness-cases/[id]/milestone-guidance API route"
  - "MilestoneGuidanceContent type for UI components"
affects: [milestone-guidance, case-timeline, future-org-customisation]

tech-stack:
  added: []
  patterns:
    - "DB-first guidance with hardcoded fallback (same pattern as milestone_configs)"
    - "MilestoneGuidanceContent pick type for UI props"

key-files:
  created:
    - "database/migrations/20260220100001_create_milestone_guidance.ts"
    - "providers/repositories/milestone-guidance.repository.ts"
    - "app/api/sickness-cases/[id]/milestone-guidance/route.ts"
  modified:
    - "providers/services/milestone.service.ts"
    - "types/database.ts"
    - "actions/milestone-actions.ts"
    - "components/case-timeline/index.tsx"

key-decisions:
  - "Named DB type MilestoneGuidanceRecord to avoid collision with existing MilestoneGuidance interface in constants"
  - "Created MilestoneGuidanceContent pick type for UI prop usage (5 content fields only)"
  - "Preserved constants/milestone-guidance.ts as fallback source in MilestoneService"

patterns-established:
  - "DB-first with hardcoded fallback: same pattern used for both milestone_configs and milestone_guidance"

duration: 10min
completed: 2026-02-20
---

# Quick Task 6: Migrate Milestone Guidance from Hardcode Summary

**milestone_guidance DB table with 19 seeded entries, repository, service methods, and API route replacing hardcoded constant in case-timeline**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-20T09:56:22Z
- **Completed:** 2026-02-20T10:06:31Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created milestone_guidance table with schema, indexes, RLS, and all 19 seeded default entries
- Built MilestoneGuidanceRepository with findDefaults, findByOrganisation, findByMilestoneKey methods
- Added MilestoneService.getGuidanceForMilestone and getGuidanceMap with DB-first + hardcoded fallback
- Created API route and fetch action for case-timeline to consume guidance from DB
- Updated case-timeline component to fetch guidance via API instead of importing hardcoded constant

## Task Commits

Each task was committed atomically:

1. **Task 1: Create milestone_guidance table, repository, and service method** - `69518c7` (feat)
2. **Task 2: Update case-timeline component to fetch guidance from DB via API** - `8bd19c4` (feat)

## Files Created/Modified
- `database/migrations/20260220100001_create_milestone_guidance.ts` - Migration with table schema, indexes, RLS, and 19 seeded entries
- `providers/repositories/milestone-guidance.repository.ts` - Repository with findDefaults, findByOrganisation, findByMilestoneKey
- `providers/services/milestone.service.ts` - Added getGuidanceForMilestone and getGuidanceMap methods
- `types/database.ts` - Added MilestoneGuidanceRecord and MilestoneGuidanceContent interfaces
- `app/api/sickness-cases/[id]/milestone-guidance/route.ts` - GET endpoint returning guidance map
- `actions/milestone-actions.ts` - Added fetchMilestoneGuidance action
- `components/case-timeline/index.tsx` - Replaced hardcoded MILESTONE_GUIDANCE with API-fetched guidanceMap

## Decisions Made
- Named the DB interface `MilestoneGuidanceRecord` to avoid collision with the existing `MilestoneGuidance` interface in constants/milestone-guidance.ts
- Created `MilestoneGuidanceContent` as a content-only type (5 fields) for UI component props, keeping the DB record type separate
- Preserved constants/milestone-guidance.ts untouched -- it remains the fallback source used by MilestoneService.getGuidanceMap

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Database migration must be run: `npx knex migrate:up --knexfile knexfile.ts` to create the milestone_guidance table and seed the 19 default entries.

## Next Phase Readiness
- milestone_guidance table enables future per-organisation guidance customisation
- The outstanding-actions dashboard component still uses hardcoded MILESTONE_GUIDANCE directly (not migrated in this task, could be a follow-up)
- constants/milestone-guidance.ts preserved as fallback for environments where migration has not yet been run

## Self-Check: PASSED

- All 7 key files verified present on disk
- Both task commits verified in git log (69518c7, 8bd19c4)
- Migration contains exactly 19 seed entries
- TypeScript compiles without errors

---
*Quick Task: 6-migrate-milestone-guidance-from-hardcode*
*Completed: 2026-02-20*
