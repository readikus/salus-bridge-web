# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step.
**Current focus:** Milestone v1.1 — Landing & Waitlist

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-16 - Completed quick task 2: Build the landing page homepage

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 9min
- Total execution time: 1.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-access | 5/5 | 33min | 7min |
| 02-sickness-lifecycle | 5/5 | 76min | 15min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Supabase Auth replaced Auth0 for authentication
- Invite-only access model (no public sign up)
- Waitlist form for prospect capture (database table)
- Evolved purple brand identity for landing page
- Phase 3 (trigger points, analytics, OH providers) deferred from v1.0 to v1.2+
- Compliance-first build order: audit logging, encryption, and RBAC must exist before any health data flows
- Trigger-based audit log immutability (instead of REVOKE) for Supabase superuser connections
- RLS via session variables (app.current_organisation_id) set per-request
- TenantService.withTenant() wraps all org-scoped queries with RLS context
- Client-side file parsing (PapaParse for CSV, SheetJS for Excel) before sending to server
- Two-pass fuzzy matching for column aliases: exact match first, then substring
- Dual API path for employee import: JSON body (new wizard) and FormData (backward compat)

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Smart column mapping UI for CSV/Excel import with fuzzy matching and confirmation screen | 2026-02-16 | 10138d5 | [1-smart-column-mapping-ui-for-csv-excel-im](./quick/1-smart-column-mapping-ui-for-csv-excel-im/) |
| 2 | Landing page with hero, features, how-it-works, social proof, CTA, and waitlist form | 2026-02-16 | 5d42cba | [2-build-the-landing-page-homepage](./quick/2-build-the-landing-page-homepage/) |

### Blockers/Concerns

- DATABASE_URL: Supabase project in .env (rbejmrydmkdybbvscwth) does not exist. User must provide valid DATABASE_URL and run migrations
- Library versions from research need verification against npm before install (recharts, etc.) -- date-fns@4.1.0 installed

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed quick-2 (landing page)
