# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step.
**Current focus:** Milestone v1.2 -- Absence Timeline Engine, Phase 4

## Current Position

Phase: 4 of 6 (Timeline Engine & GP Details)
Plan: 1 of 3 in current phase
Status: Executing
Last activity: 2026-02-19 -- Completed 04-01 schema foundation

Progress: [█████████████░░░░░░░] 64% (14/~18 plans across all milestones)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 8min
- Total execution time: 2.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-access | 5/5 | 33min | 7min |
| 02-sickness-lifecycle | 5/5 | 76min | 15min |
| 03-monitoring-and-intelligence | 3/3 | 26min | 9min |
| 04-timeline-engine-and-gp-details | 1/3 | 2min | 2min |

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
- Single consent record per employee with upsert pattern

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Smart column mapping UI for CSV/Excel import | 2026-02-16 | 10138d5 | quick/1-smart-column-mapping-ui-for-csv-excel-im/ |
| 2 | Landing page with hero, features, social proof, CTA | 2026-02-16 | 5d42cba | quick/2-build-the-landing-page-homepage/ |

### Blockers/Concerns

- DATABASE_URL: Supabase project in .env (rbejmrydmkdybbvscwth) does not exist. User must provide valid DATABASE_URL and run migrations

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 04-01-PLAN.md -- schema foundation for milestones and GP details
