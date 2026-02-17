---
phase: 03-monitoring-and-intelligence
plan: 02
subsystem: analytics
tags: [analytics, charts, csv-export, pdf-export, cohort-privacy, bradford-factor]

requires:
  - phase: 03-monitoring-and-intelligence/03-01
    provides: "BradfordFactorService.calculateForTeam for team Bradford aggregation"
provides:
  - "Analytics dashboard with absence rates, trends, and Bradford scores"
  - "CSV and PDF export for compliance reporting"
  - "Cohort privacy enforcement (minimum 5 employees per group)"
affects: []

tech-stack:
  added: []
  patterns: ["cohort-guard privacy suppression", "CSS-only bar charts", "print-ready HTML for PDF"]

key-files:
  created:
    - providers/repositories/analytics.repository.ts
    - providers/services/analytics.service.ts
    - schemas/analytics.ts
    - actions/analytics.ts
    - app/api/organisations/[slug]/analytics/route.ts
    - app/api/organisations/[slug]/analytics/export/route.ts
    - components/analytics-dashboard/index.tsx
    - components/analytics-dashboard/absence-rate-chart.tsx
    - components/analytics-dashboard/trend-chart.tsx
    - components/analytics-dashboard/bradford-table.tsx
    - components/analytics-dashboard/cohort-guard.tsx
    - app/(authenticated)/organisations/[slug]/analytics/page.tsx
  modified:
    - constants/permissions.ts
    - types/enums.ts
    - components/sidebar/nav-items.ts

key-decisions:
  - "CSS-only bar charts instead of charting library (Tailwind divs with percentage widths)"
  - "PDF via print-ready HTML with @media print styles instead of server-side PDF library"
  - "MINIMUM_COHORT_SIZE=5 constant for privacy enforcement"

patterns-established:
  - "CohortGuard wrapper: suppresses data display for groups under minimum size"
  - "Analytics export pattern: CSV via string concatenation, PDF via print-ready HTML"

duration: 10min
completed: 2026-02-17
---

# Plan 03-02: Analytics Dashboard Summary

**Absence analytics dashboard with rate charts, trend visualization, Bradford scores, cohort privacy enforcement, and CSV/PDF export**

## Performance

- **Duration:** 10 min
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Analytics repository with aggregation SQL for absence rates by team/department/org and monthly trends
- Analytics service with MINIMUM_COHORT_SIZE=5 enforcement suppressing small group data
- Horizontal bar chart visualization with green/amber/red absence rate coloring
- Monthly trend sparkline bars with data table
- Sortable Bradford Factor table with risk-level badges from 03-01
- CSV download and print-ready HTML export with audit logging
- MANAGER role scoped to direct reports only

## Task Commits

Each task was committed atomically:

1. **Task 1: Analytics repository, service, and API routes** - `40a1088` (feat)
2. **Task 2: Analytics dashboard UI with charts and export** - `a3e18bf` (feat)

## Files Created/Modified
- `providers/repositories/analytics.repository.ts` - Aggregation SQL for rates, trends, department counts
- `providers/services/analytics.service.ts` - Orchestration with cohort enforcement and export formatting
- `schemas/analytics.ts` - Zod schema for period/departmentId/groupBy query params
- `actions/analytics.ts` - Client fetch wrappers for analytics and export
- `app/api/organisations/[slug]/analytics/route.ts` - GET with VIEW_ANALYTICS permission
- `app/api/organisations/[slug]/analytics/export/route.ts` - GET with EXPORT_ANALYTICS + audit
- `components/analytics-dashboard/index.tsx` - Main dashboard layout with filters and export buttons
- `components/analytics-dashboard/absence-rate-chart.tsx` - Horizontal bar chart by group
- `components/analytics-dashboard/trend-chart.tsx` - Sparkline bars + monthly data table
- `components/analytics-dashboard/bradford-table.tsx` - Sortable Bradford Factor table
- `components/analytics-dashboard/cohort-guard.tsx` - Privacy suppression for small groups
- `app/(authenticated)/organisations/[slug]/analytics/page.tsx` - Server component page wrapper

## Decisions Made
- CSS-only bar charts (Tailwind divs) instead of adding a charting library — keeps dependencies minimal
- PDF export via print-ready HTML with @media print styles — client-side window.print() instead of server-side PDF generation
- Cohort size constant set at 5 per ANAL-04 requirement

## Deviations from Plan
None - plan executed as written (files from partial previous attempt were incorporated).

## Issues Encountered
- Previous agent attempt was blocked by Bash permissions — orchestrator completed commits manually

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 plans complete — ready for phase verification
- Analytics dashboard depends on sickness case data existing in the database

---
*Phase: 03-monitoring-and-intelligence*
*Completed: 2026-02-17*
