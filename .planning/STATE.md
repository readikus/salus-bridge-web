# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step.
**Current focus:** Milestone v1.2 -- Absence Timeline Engine, Phase 5

## Current Position

Phase: 5 of 6 (Milestone Actions & Communication Log)
Plan: 1 of 3 in current phase
Status: Executing
Last activity: 2026-02-20 -- Completed quick task 3: Milestone action cards with guidance text and view-as-employee mode

Progress: [█████████████████░░░] 86% (19/~22 plans across all milestones)

## Performance Metrics

**Velocity:**
- Total plans completed: 19
- Average duration: 8min
- Total execution time: 2.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-access | 5/5 | 33min | 7min |
| 02-sickness-lifecycle | 5/5 | 76min | 15min |
| 03-monitoring-and-intelligence | 3/3 | 26min | 9min |
| 04-timeline-engine-and-gp-details | 3/3 | 11min | 4min |
| 05-milestone-actions-and-communication-log | 1/3 | 2min | 2min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Supabase Auth replaced Auth0 for authentication
- Invite-only access model (no public sign up)
- RLS via session variables (app.current_organisation_id) set per-request
- TenantService.withTenant() wraps all org-scoped queries with RLS context
- Trigger-based audit log immutability for Supabase superuser connections
- Bradford Factor uses simple weekday count for ongoing cases
- Alert deduplication by trigger_config_id + sickness_case_id pair
- Nullable organisation_id pattern for system defaults vs org overrides in milestone_configs
- Partial unique index for NULL-scoped uniqueness on milestone defaults
- Fallback to hardcoded DEFAULT_MILESTONES when DB not seeded for milestone timeline
- Upsert pattern for org milestone overrides keyed by milestoneKey
- Single consent record per employee with upsert pattern
- Ownership-based access control for GP details (employee.userId === sessionUser.id)
- Employee ID resolved via fetchMyData on profile page
- [Phase 05]: Immutability enforced at both DB level (no UPDATE/DELETE grants) and code level (no update/delete methods)
- [Phase 05]: Bulk insert method on MilestoneActionRepository for efficient timeline generation

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Smart column mapping UI for CSV/Excel import | 2026-02-16 | 10138d5 | quick/1-smart-column-mapping-ui-for-csv-excel-im/ |
| 2 | Landing page with hero, features, social proof, CTA | 2026-02-16 | 5d42cba | quick/2-build-the-landing-page-homepage/ |
| 3 | Milestone action cards with empathetic guidance text | 2026-02-20 | a73056c | quick/3-milestone-action-cards-with-guidance-tex/ |

### Blockers/Concerns

- DATABASE_URL: Supabase project in .env (rbejmrydmkdybbvscwth) does not exist. User must provide valid DATABASE_URL and run migrations

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed quick-3 (Milestone Action Cards with Guidance Text)
