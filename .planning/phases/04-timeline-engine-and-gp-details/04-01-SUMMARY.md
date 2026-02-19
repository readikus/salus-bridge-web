---
phase: 04-timeline-engine-and-gp-details
plan: 01
subsystem: database
tags: [postgres, knex, migrations, rls, zod, typescript]

requires:
  - phase: 03-monitoring-and-intelligence
    provides: "Trigger configs pattern, RLS org isolation, audit entity/action enums"
provides:
  - "milestone_configs table with 19 default milestones and org-level override support"
  - "GP detail columns on employees table"
  - "medical_records_consent table with org isolation RLS"
  - "MilestoneConfig, MedicalRecordsConsent TypeScript interfaces"
  - "DEFAULT_MILESTONES constant array (19 entries)"
  - "Zod schemas for milestone config CRUD and GP details/consent"
  - "6 new RBAC permissions for milestones, GP details, and consent"
affects: [04-02, 04-03]

tech-stack:
  added: []
  patterns: ["nullable organisation_id for system defaults vs org overrides", "partial unique index for NULL org defaults"]

key-files:
  created:
    - database/migrations/20260218000001_create_milestone_configs.ts
    - database/migrations/20260218000002_add_gp_details_and_consent.ts
    - constants/milestone-defaults.ts
    - schemas/milestone-config.ts
    - schemas/gp-details.ts
  modified:
    - types/database.ts
    - types/enums.ts
    - constants/permissions.ts

key-decisions:
  - "Nullable organisation_id pattern for system defaults vs org overrides in milestone_configs"
  - "Partial unique index on milestone_key WHERE organisation_id IS NULL to enforce unique defaults"
  - "Single consent record per employee (UNIQUE on employee_id) with upsert pattern"

patterns-established:
  - "System defaults with org overrides: NULL org_id = system default, non-NULL = org override"
  - "Partial unique index for NULL-scoped uniqueness constraints"

duration: 2min
completed: 2026-02-19
---

# Phase 4 Plan 1: Schema Foundation Summary

**Milestone configs table with 19 default milestones, GP detail columns on employees, medical consent table, and Zod validation schemas**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T15:01:47Z
- **Completed:** 2026-02-19T15:03:44Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created milestone_configs table with RLS, indexes, partial unique index for defaults, and 19 seeded milestones
- Added GP details columns (gp_name, gp_address, gp_phone) to employees table
- Created medical_records_consent table with org isolation RLS and unique employee constraint
- Added MilestoneConfig, MedicalRecordsConsent, MedicalRecordsConsentWithEmployee interfaces
- Extended Employee interface with GP fields
- Added 3 audit entities (MILESTONE_CONFIG, MEDICAL_CONSENT, GP_DETAILS) and 2 audit actions (CONSENT, REVOKE)
- Added 6 new RBAC permissions with role mappings across all 5 roles
- Created DEFAULT_MILESTONES constant with 19 milestone definitions
- Created Zod validation schemas for milestone config CRUD and GP details/consent

## Task Commits

Each task was committed atomically:

1. **Task 1: Create milestone configs migration and GP details/consent migration** - `ced06ce` (feat)
2. **Task 2: Add types, enums, permissions, constants, and Zod schemas** - `aa199a6` (feat)

## Files Created/Modified
- `database/migrations/20260218000001_create_milestone_configs.ts` - Milestone configs table with RLS, indexes, and 19 default seeds
- `database/migrations/20260218000002_add_gp_details_and_consent.ts` - GP columns on employees, medical_records_consent table
- `types/database.ts` - MilestoneConfig, MedicalRecordsConsent interfaces + GP fields on Employee
- `types/enums.ts` - MILESTONE_CONFIG, MEDICAL_CONSENT, GP_DETAILS entities; CONSENT, REVOKE actions
- `constants/permissions.ts` - 6 new permissions with role mappings
- `constants/milestone-defaults.ts` - DEFAULT_MILESTONES array (19 entries)
- `schemas/milestone-config.ts` - Zod schemas for create/update milestone config
- `schemas/gp-details.ts` - Zod schemas for GP details and medical consent

## Decisions Made
- Nullable organisation_id pattern: system defaults have NULL org_id, org overrides have non-NULL. Allows single table with simple override logic.
- Partial unique index on milestone_key WHERE organisation_id IS NULL enforces unique system defaults without conflicting with the standard UNIQUE(organisation_id, milestone_key) constraint.
- Single consent record per employee (UNIQUE constraint on employee_id) supports upsert pattern rather than audit-trail pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete for Plan 02 (timeline engine service/repository) and Plan 03 (GP details/consent UI)
- All types, enums, permissions, and schemas ready for consumption
- Migrations ready to run against database

## Self-Check: PASSED

All 9 files verified present. Both task commits (ced06ce, aa199a6) verified in git log.

---
*Phase: 04-timeline-engine-and-gp-details*
*Completed: 2026-02-19*
