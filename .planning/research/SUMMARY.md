# Project Research Summary

**Project:** SalusBridge - Workplace Health Coordination Platform
**Domain:** Multi-tenant B2B SaaS for UK workplace health and absence management
**Researched:** 2026-02-14
**Confidence:** MEDIUM

## Executive Summary

SalusBridge is a UK-focused workplace health coordination platform handling special category health data under UK GDPR. The research reveals that this is fundamentally a **compliance-first architecture** problem, not a standard SaaS build. The core technical challenge is not the absence tracking or workflows — those are well-documented patterns — but rather the requirement to treat health information as special category data requiring elevated legal basis, field-level encryption, granular consent management, and immutable audit logging.

The recommended approach is a layered monolith on the existing Next.js 16/PostgreSQL/Supabase stack with row-level tenancy, PostgreSQL RLS as defence-in-depth, and a strict service/repository pattern where every tenant-scoped query mandates organisation_id. The architecture must enforce field-level access control (managers see dates/actions, not diagnoses), implement a finite state machine for sickness case workflows, and maintain an append-only audit trail for every health data access. Critical infrastructure includes built-in Node.js crypto for field-level encryption, immutable audit_logs table, and Supabase Storage with short-lived signed URLs for fit notes.

Key risks centre on GDPR compliance failure (ICO enforcement action), cross-tenant data leakage (reportable breach), and over-exposing health details to managers (violates data minimisation). Mitigation requires: (1) DPIA before writing code, (2) PostgreSQL RLS + repository-level org_id scoping from day one, (3) role-specific API responses with health data only for HR/employee roles, (4) audit logging built into the service layer as foundational infrastructure. The manager guidance system is the product differentiator, but health data compliance is the existential requirement.

## Key Findings

### Recommended Stack

The core stack (Next.js 16, React 19, TypeScript, PostgreSQL/Supabase, Auth0, Tailwind/shadcn, Vercel) is decided. Research focused on complementary libraries for UK GDPR-compliant health data handling. Critical additions are minimal — Node.js built-in crypto for field-level AES-256-GCM encryption, papaparse for CSV imports, date-fns for working day calculations, and recharts for analytics. Notable exclusions: no Prisma/Drizzle (project uses raw SQL via pg pool), no Supabase JS SDK (direct connection only), no helmet (Next.js config handles security headers), no CASL/Casbin (5 static roles don't warrant permission DSL overhead).

**Core complementary technologies:**
- **Node.js crypto (built-in)**: Field-level AES-256-GCM encryption for fit note content, GP details, medical conditions — zero dependencies, FIPS-compliant, superior to crypto-js
- **Custom audit_logs table**: Immutable append-only trail via PostgreSQL with INSERT-only permissions, no library needed — most reliable approach for UK GDPR Article 30 compliance
- **papaparse ^5.4**: CSV parsing for employee imports with streaming, error handling per row, handles BOM/line-ending edge cases
- **date-fns ^3.6**: Working day calculations (differenceInBusinessDays) with UK bank holiday support — tree-shakeable, immutable, no moment.js bloat
- **recharts ^2.12**: React charting for absence analytics dashboards — declarative, responsive, good TypeScript support
- **@react-pdf/renderer ^3.4**: PDF generation for exports using React components (server-side only, bundle size caution)
- **@supabase/storage-js ^2.x**: Signed URLs (5-minute max expiry) for fit notes and health documents
- **@upstash/ratelimit**: API rate limiting, serverless-compatible, essential for health data endpoints
- **Vercel Cron Jobs**: Scheduled tasks (fit note expiry checks, data retention cleanup) — native to platform, zero infrastructure for MVP

**Phase mapping:**
- Phase 1 (Foundation): encryption service, audit logging table, RBAC middleware, security headers
- Phase 2 (Core Features): papaparse for CSV import, date-fns for absence calculations, Supabase Storage for fit notes
- Phase 3 (Analytics/Reports): recharts for dashboards, @react-pdf/renderer for exports
- Phase 4 (Compliance): data retention cron jobs, SAR export tooling

### Expected Features

**Must have (table stakes) — users expect from any workplace health platform:**
- Sickness reporting (dual-path: employee self-report AND manager-initiated) — absence management 101
- Absence calendar view with team/org visibility — visual coordination essential
- Fit note upload, storage, expiry tracking with alerts — UK legal requirement to track
- Return-to-work meeting scheduling and form capture — UK best practice standard
- Manager dashboard (team absence overview) with permission scoping (own reports only)
- Multi-tenant organisation containers with row-level isolation — B2B SaaS foundation
- Employee CSV import with preview, duplicate detection, error reporting — onboarding blocker
- Absence rates and Bradford Factor calculation — core analytics for any UK platform
- UK GDPR special category data handling (consent, minimisation, lawful basis) — regulatory compliance
- Audit logging for all health data access — ICO expects this on audit

**Should have (competitive differentiators):**
- **Manager guidance system (core differentiator)**: Scripted conversation workflows for difficult health conversations, step-by-step guidance varying by scenario (mental health vs physical injury), builds manager confidence
- Occupational health provider portal with referral workflows and report tracking — integration rare in competitors
- Trigger point configuration and pattern detection (e.g., Monday absences) — intelligent monitoring
- Employee wellbeing check-ins during long-term absence — duty-of-care positioning
- Workplace adjustment tracking with review dates — Equality Act 2010 best practice

**Defer (v2+) — scope creep risks:**
- Full HRIS features (holidays, expenses) — different problem domain
- Annual leave booking — dilutes health/wellbeing focus
- Payroll integration — massive scope for minimal MVP value
- Performance management — conflates health with performance, destroys trust
- Direct GP/NHS integration — multi-year project on its own

**Anti-features (deliberately exclude):**
- Medical diagnosis storage (liability risk, creates informal medical records)
- Time & attendance surveillance (toxic to product values, contradicts dignity/privacy)
- Benefits administration (scope creep)

### Architecture Approach

**Layered monolith with row-level multi-tenancy.** Not microservices. The system enforces tenant isolation via organisation_id in every query at the repository layer, with PostgreSQL RLS as defence-in-depth. Architecture centres on a strict separation: middleware handles auth, Server Components handle read-heavy rendering, API Routes handle all mutations (not Server Actions — clearer audit boundary), Services orchestrate business logic and permission checks, Repositories execute raw SQL with mandatory org_id parameters. Health data lives in a separate health_records table with differentiated access controls — managers see dates and actions, not diagnoses or fit notes.

**Major components:**
1. **Tenant Context Provider** — resolves current organisation from Auth0 session, provides (userId, orgId, role, email) to every request, single source of truth for "who and which org"
2. **RBAC Layer** — Auth0 handles identity (who you are), application database stores roles/permissions (what you can do), 5 roles (PLATFORM_ADMIN, ORG_ADMIN, HR_USER, MANAGER, EMPLOYEE) with granular permissions map, field-level access control prevents managers seeing health details
3. **Health Data Isolation** — separate health_records table with additional permission checks, field-level encryption for sensitive text (fit note content, GP details, diagnoses), access only by roles with health_data:read permission
4. **Audit Trail System** — append-only audit_logs table (INSERT-only PostgreSQL role), logs every read/write/delete of health data with user, action, entity, timestamp, metadata, built as service wrapper called after every sensitive operation
5. **Workflow Engine (State Machine)** — sickness cases follow defined lifecycle (REPORTED → TRACKING → FIT_NOTE_RECEIVED → RTW_SCHEDULED → RTW_COMPLETED → CLOSED), WorkflowService enforces valid transitions with guard conditions, case_transitions table logs every state change immutably
6. **Document Storage** — Supabase Storage buckets organised by org_id/case_id/filename, metadata in PostgreSQL with tenant isolation, access via short-lived signed URLs (5 minutes max) generated server-side after permission check, never served directly to client
7. **Repositories** — static class methods, raw SQL via pool.query() with parameterised queries, every tenant-scoped method requires orgId parameter, SQL uses snake_case aliased to camelCase with AS
8. **Services** — business logic orchestration, permission validation before operations, audit logging after health data access, workflow state transitions, external API calls

**Data flow patterns:**
- **Read (Server Component)**: URL with org slug → Middleware validates → Server Component calls Service → Repository queries with org_id WHERE clause → RSC HTML rendered
- **Write (form)**: Client Component → Action (fetch*) → API Route → extracts session+orgId → Service validates → Repository executes parameterised SQL → Audit Logger records → React Query cache invalidates → UI updates
- **Workflow transition**: Action → API Route → WorkflowService.transition() → validates current state → updates case → creates audit entry → triggers notification → returns new state

**Suggested build order (dependency-driven):**
1. Database foundation (tables, pg pool, RLS policies, Knex migrations)
2. Auth + tenant context (Auth0, middleware, getTenantContext(), roles)
3. Core repositories + services (Organisation, User, Employee with org_id scoping)
4. Audit trail (AuditService + audit_logs — build early so all features use it)
5. Employee management (CRUD, CSV import, manager hierarchy)
6. Sickness case workflow (Case model, WorkflowService state machine, case_transitions)
7. Health records + documents (separate tables, Supabase Storage, signed URLs)
8. Notifications (SendGrid + React Email for workflow events)
9. Analytics/reporting (aggregated dashboards per org)
10. Platform admin (cross-tenant views, org management)

Rationale: Items 1-4 are foundational (everything depends), employees before cases (foreign key dependency), health records after cases (attach to cases), audit trail early so items 5-10 have logging from day one.

### Critical Pitfalls

1. **Treating health data like normal personal data** — UK GDPR Article 9 classifies health information as "special category data" requiring explicit lawful basis (explicit consent or substantial public interest per DPA 2018 Schedule 1), not just legitimate interest. Applying standard GDPR patterns means entire legal basis is wrong. **Prevention:** DPIA before code, explicit consent capture at data entry, classify tables as special category, consult/appoint DPO before launch. **Consequence:** ICO enforcement (up to £17.5M or 4% turnover), contract unenforceability, reputational damage. **Phase:** Must address in Phase 1, cannot retrofit. **Confidence:** HIGH.

2. **Cross-tenant data leakage in health context** — Query exposes Org A's employee health data to Org B = reportable breach to ICO within 72 hours, mandatory individual notification, regulatory action. **Prevention:** PostgreSQL RLS on every table, repository pattern enforcement (org_id in every WHERE clause), API middleware verifies user's org matches resource's org, cache isolation (React Query keys include org_id), integration tests that attempt cross-tenant access and assert failure. **Phase:** Phase 1 (database design, repository pattern). **Confidence:** HIGH.

3. **Over-exposing health details to managers** — Showing managers specific conditions when they only need absence dates/guidance violates GDPR data minimisation (Article 5(1)(c)) and potentially Equality Act 2010. **Prevention:** Field-level access control with visibility tiers (Employee/HR see full data, Manager sees dates+actions only, Platform admin sees aggregates only), separate API response shapes per role (don't filter in frontend), audit every field exposure. **Phase:** Phase 1 (data model) + Phase 2 (API/UI). **Confidence:** HIGH.

4. **Inadequate audit trail for health data access** — Cannot answer "who accessed Employee X's health data and when?" Critical for SARs, ICO investigations, internal disputes. **Prevention:** Build audit logging into service layer from day one, immutable append-only table, separate from application logs, middleware/decorator for automatic logging. **Phase:** Phase 1 (foundation) — must exist before any health data flows. **Confidence:** HIGH.

5. **Consent model without withdrawal mechanism** — Consent as boolean flag with no withdrawal = GDPR violation (Article 7(3) requires consent be as easy to withdraw as to give). **Prevention:** Granular consent records per purpose with timestamps, consent cascade logic (what happens on withdrawal), separation of lawful bases (not everything needs consent), UI for consent management. **Phase:** Phase 1 (consent model design) + Phase 2 (UI). **Confidence:** HIGH.

6. **Fit note data entry creating legal liability** — Free-text transcription creates informal medical records that may be inaccurate and used in employment disputes. **Prevention:** Structured data capture only (dropdowns matching official fit note fields), document upload as primary record (not transcription), no diagnosis codes (use broad absence reason categories), disclaimers that platform is management tool not medical record. **Phase:** Phase 2 (sickness reporting) — design capture approach before building UI. **Confidence:** MEDIUM.

## Implications for Roadmap

Based on research, suggested phase structure emphasizes compliance-first build order and dependency-driven sequencing:

### Phase 1: Compliance Foundation & Multi-Tenant Core
**Rationale:** Health data compliance is existential — must be baked into architecture from day one, not retrofitted. All subsequent features depend on tenant isolation, audit logging, and RBAC working correctly.

**Delivers:** Database schema with RLS policies, pg pool setup with tenant context, Auth0 integration with middleware, role definitions (5 roles), tenant context provider (getTenantContext()), immutable audit_logs table with AuditService wrapper, field-level encryption service (Node.js crypto), organisation and user CRUD with org_id scoping, security headers configuration.

**Addresses (from FEATURES.md):** Multi-tenant organisation containers, audit logging, UK GDPR special category data handling (legal foundation), role management.

**Avoids (from PITFALLS.md):** #1 (treating health data like normal personal data via DPIA + consent design), #2 (cross-tenant leakage via RLS + mandatory org_id), #4 (inadequate audit trail via early AuditService build), #5 (consent without withdrawal via granular consent records).

**Research flag:** SKIP deep research — multi-tenant SaaS patterns and UK GDPR requirements are well-documented. Verify ICO guidance on special category data and DPIA templates during implementation.

### Phase 2: Employee Management & CSV Import
**Rationale:** Employees are the foundation data entity for all workflows — cannot track absences without employee records. CSV import is the onboarding blocker (organisations won't manually enter 50+ employees).

**Delivers:** Employee CRUD (create, read, update, soft delete), manager hierarchy (employees.manager_id), CSV import with papaparse (preview mode, duplicate detection on email+org, schema validation, UTF-8 handling, 500-row limit), employee directory with search/filter, department and manager assignment.

**Addresses (from FEATURES.md):** Employee import (CSV), role assignment, organisation settings (employee-related).

**Uses (from STACK.md):** papaparse ^5.4 for CSV parsing with error handling per row.

**Implements (from ARCHITECTURE.md):** EmployeeRepository with org_id scoping, EmployeeService with permission checks, CSV import service with validation pipeline.

**Avoids (from PITFALLS.md):** #8 (CSV import problems via strict schema validation, duplicate detection, dry-run preview, size limits).

**Research flag:** SKIP — CSV import patterns are standard. Focus on duplicate detection logic and error reporting UX.

### Phase 3: Sickness Case Workflow & State Machine
**Rationale:** Core product loop is report sickness → track absence → capture fit note → schedule RTW → close case. Workflow state machine prevents ad-hoc status updates that skip validation and audit trails.

**Delivers:** Sickness case CRUD (dual-path: employee self-report + manager-initiated), finite state machine (REPORTED → TRACKING → FIT_NOTE_RECEIVED → RTW_SCHEDULED → RTW_COMPLETED → CLOSED), WorkflowService with valid transition enforcement, case_transitions table for immutable history, absence type categorisation (sickness, medical appointment, injury), duration tracking with working days calculation (date-fns + UK bank holidays), absence calendar view (team/org), manager dashboard (own reports only with RBAC scoping).

**Addresses (from FEATURES.md):** Sickness reporting (dual-path), absence calendar view, absence type categorisation, duration tracking, absence history per employee, manager dashboard, permission scoping (own team only).

**Uses (from STACK.md):** date-fns ^3.6 for differenceInBusinessDays and UK bank holiday handling.

**Implements (from ARCHITECTURE.md):** WorkflowService as finite state machine, SicknessCaseRepository with org_id + case_transitions logging, manager dashboard with role-based filtering.

**Avoids (from PITFALLS.md):** #9 (unmaintainable state machine via explicit FSM with defined states/transitions/guards, transition logging), #3 (over-exposing to managers via dashboard showing only dates/status, not health details).

**Research flag:** SKIP — workflow state machines are well-documented patterns. Focus on transition guard conditions and side-effect triggers (notifications).

### Phase 4: Fit Notes & Health Data Handling
**Rationale:** Fit notes are the first special category health data entering the system. This phase exercises the compliance infrastructure built in Phase 1 (encryption, audit logging, field-level access control).

**Delivers:** Fit note upload (Supabase Storage with org_id/case_id/filename structure), document metadata table with tenant isolation, short-lived signed URL generation (5 minutes max) via @supabase/storage-js, fit note status tracking (may be fit / not fit for work per UK GP format), expiry tracking with alerts (Vercel Cron job: daily check at 8am), health_records table for sensitive fit note details, field-level encryption for GP names/addresses and free-text notes, role-based document access (HR/Employee only, not Manager), audit logging for every document access.

**Addresses (from FEATURES.md):** Fit note upload and storage, expiry tracking and alerts, status tracking (UK-specific).

**Uses (from STACK.md):** @supabase/storage-js ^2.x for signed URLs, Node.js crypto for field-level encryption, Vercel Cron Jobs for expiry checks.

**Implements (from ARCHITECTURE.md):** Document Storage component (metadata in PostgreSQL, files in Supabase Storage, access via API routes with permission checks), Health Data Isolation (separate health_records table, field-level encryption, differentiated RBAC).

**Avoids (from PITFALLS.md):** #6 (fit note legal liability via structured capture, document upload as primary record, no diagnosis transcription), #15 (Supabase Storage without access controls via private buckets, short-lived signed URLs, server-side permission checks).

**Research flag:** CONSIDER LIGHT RESEARCH — Supabase Storage access patterns and signed URL security model. Verify sharp compatibility with Next.js 16 on Vercel for image processing (optional).

### Phase 5: Return-to-Work Workflow
**Rationale:** RTW meetings are the closure mechanism for sickness cases and a UK employment law best practice. Phase depends on Phase 3 (cases) and Phase 4 (fit notes) being complete.

**Delivers:** RTW meeting scheduling and tracking, RTW form/questionnaire (structured questions per scenario), RTW record storage (meeting notes, agreed actions, review dates), workplace adjustment tracking with review date alerts, workflow transitions (RTW_SCHEDULED → RTW_COMPLETED), notifications to employee/manager pre-meeting.

**Addresses (from FEATURES.md):** RTW meeting scheduling/tracking, RTW form/questionnaire, RTW record storage, workplace adjustment tracking (differentiator).

**Uses (from STACK.md):** React Hook Form + Zod for RTW form capture, SendGrid + React Email for meeting notifications.

**Implements (from ARCHITECTURE.md):** WorkflowService transitions for RTW states, Notification Service for meeting reminders, RTW record storage with audit logging.

**Avoids (from PITFALLS.md):** #11 (notifications revealing health info via minimal content policy: "Your RTW meeting is scheduled for [date]" with no employee names or conditions).

**Research flag:** SKIP — form capture and meeting scheduling are standard features.

### Phase 6: Manager Guidance System (Core Differentiator)
**Rationale:** This is the product differentiator that sets SalusBridge apart. Built after core workflows are stable so guidance can be contextual to actual case states.

**Delivers:** Scripted conversation workflow templates by scenario (mental health, physical injury, long-term absence), step-by-step guidance embedded in manager dashboard, context-aware prompts ("Employee's fit note expires in 3 days — schedule RTW meeting"), scenario selection based on case metadata, manager confidence scoring (analytics on guidance engagement), notification task prompts ("Employee X requires RTW meeting").

**Addresses (from FEATURES.md):** Scripted conversation workflows (HIGH complexity differentiator), conversation templates by scenario, manager confidence scoring, manager notifications and task prompts.

**Uses (from STACK.md):** React Hook Form for scenario selection, nuqs for workflow step state in URL.

**Implements (from ARCHITECTURE.md):** Workflow Engine with side-effects (trigger guidance prompts on state transitions), manager dashboard with embedded guidance, notification triggers.

**Avoids (from PITFALLS.md):** #3 (over-exposing health details via guidance showing actions/questions, not diagnoses).

**Research flag:** CONSIDER DEEP RESEARCH — Content design for difficult conversation scripts requires domain expertise. Potential legal review of guidance templates. Consider occupational health / HR consultant input.

### Phase 7: Analytics & Reporting
**Rationale:** Analytics require historical data — built after core workflows generate data. Bradford Factor calculation is UK-specific table stakes.

**Delivers:** Absence rates by team/department/org, Bradford Factor calculation (S² × D formula), trend reporting (month-over-month comparisons), cost of absence calculation (working days × configurable daily cost), recharts dashboards (line charts for trends, bar charts for team comparisons), CSV/PDF export (@react-pdf/renderer for summary reports), anonymisation for small cohorts (minimum cohort size: 5-10 people, suppress counts <3).

**Addresses (from FEATURES.md):** Absence rates reporting, Bradford Factor calculation, trend reporting, CSV/PDF export, cost of absence calculation (differentiator).

**Uses (from STACK.md):** recharts ^2.12 for React charting, @react-pdf/renderer ^3.4 for PDF exports, date-fns for date range calculations.

**Implements (from ARCHITECTURE.md):** Aggregation queries in repositories, analytics service layer, export service with permission checks.

**Avoids (from PITFALLS.md):** #12 (analytics re-identification via minimum cohort size enforcement, small count suppression, no drill-down to individuals from aggregates).

**Research flag:** SKIP — recharts patterns are well-documented. Focus on anonymisation rules and Bradford Factor formula verification.

### Phase 8: Occupational Health Provider Integration (Differentiator)
**Rationale:** External provider access requires multi-org RBAC (provider sees multiple client orgs). Built after core workflows proven, as this adds architectural complexity.

**Delivers:** OH provider portal (separate role with cross-org access to assigned cases only), referral workflow (HR initiates referral → provider receives notification → provider accesses case context → provider uploads report → HR reviews), OH report tracking (referral date → report received date → action taken), provider assignment to cases, provider organisation management (platform admin creates provider orgs, assigns to client orgs).

**Addresses (from FEATURES.md):** Occupational health provider portal (HIGH complexity differentiator), referral workflow, OH report tracking.

**Implements (from ARCHITECTURE.md):** Extended RBAC for provider role (OH_PROVIDER), cross-org access scoping (provider sees only assigned cases across assigned client orgs), document storage for OH reports with provider upload permissions.

**Avoids (from PITFALLS.md):** #2 (cross-tenant leakage via explicit provider-to-org assignment table, queries scoped by provider_id AND assigned_org_ids).

**Research flag:** CONSIDER DEEP RESEARCH — Multi-org provider access patterns, case assignment workflows, provider onboarding. Verify data sharing agreements (legal requirement for third-party health data access).

### Phase 9: Data Retention & Compliance Automation
**Rationale:** Legal requirement but not blocking for launch. Built after core features stable so retention rules can be tested against real data lifecycle.

**Delivers:** Configurable retention periods per data type (absence records: 3 years, health records: 6 years per ICO guidance, audit logs: 7 years), soft delete with deleted_at timestamps, hard delete via Vercel Cron (weekly cleanup job), cascade deletion logic (case deleted → health records archived → documents moved to cold storage → audit trail anonymised), employee offboarding triggers retention countdown, retention policy dashboard for org admins, data retention audit report (what was deleted when).

**Addresses (from FEATURES.md):** Data retention policies (compliance requirement), automated cleanup background jobs.

**Uses (from STACK.md):** Vercel Cron Jobs for weekly retention enforcement, archiver for SAR exports (potential).

**Implements (from ARCHITECTURE.md):** Retention service with cascade logic, cron job API routes, soft delete pattern across repositories.

**Avoids (from PITFALLS.md):** #10 (data retention without deletion via automated expiry, soft delete first, anonymised audit trails, cascade deletion logic).

**Research flag:** SKIP — retention patterns are well-documented. Verify UK GDPR and ICO retention period guidance during implementation.

### Phase 10: Platform Admin & Cross-Org Management
**Rationale:** Last phase as it's internal tooling, not customer-facing. Requires all core features working to be useful for support.

**Delivers:** Platform admin dashboard (cross-tenant view), organisation CRUD for platform admins, organisation health metrics (active users, cases tracked, storage usage), user impersonation (with audit logging), platform-level analytics (aggregated across all orgs for product decisions), support tools (search users/cases across orgs, case history viewer).

**Addresses (from FEATURES.md):** Multi-tenant organisation management, platform admin role.

**Implements (from ARCHITECTURE.md):** PLATFORM_ADMIN role with cross-org access, platform-level repositories (no org_id scoping), user impersonation with consent cascade.

**Avoids (from PITFALLS.md):** #2 (cross-tenant leakage via explicit PLATFORM_ADMIN checks, audit logging for every cross-org access, impersonation limits).

**Research flag:** SKIP — admin tooling patterns are standard.

### Phase Ordering Rationale

**Dependencies drive order:**
- Phase 1 (Foundation) before everything — compliance and tenancy cannot be retrofitted
- Phase 2 (Employees) before Phase 3 (Cases) — cases reference employees via foreign key
- Phase 4 (Fit Notes) after Phase 3 (Cases) — fit notes attach to cases
- Phase 5 (RTW) after Phase 3+4 — RTW workflow depends on case states and fit note data
- Phase 6 (Manager Guidance) after Phase 3+5 — guidance is contextual to workflow states
- Phase 7 (Analytics) after Phase 3+4+5 — requires historical data from workflows
- Phase 8 (OH Integration) after core features stable — adds architectural complexity
- Phase 9 (Retention) after features stable — rules tested against real data lifecycle
- Phase 10 (Platform Admin) last — internal tooling, depends on all customer features existing

**Compliance-first grouping:**
- Early phases (1-4) establish and exercise compliance infrastructure (audit logging, encryption, field-level access, health data isolation)
- Middle phases (5-7) build on compliant foundation without adding new compliance patterns
- Late phases (8-10) add complexity (multi-org access, retention automation, platform tooling) after core compliance proven

**Pitfall avoidance:**
- Phase 1 addresses 4 of 6 critical pitfalls (#1, #2, #4, #5) by building compliance foundation early
- Each subsequent phase is designed to avoid specific pitfalls from PITFALLS.md (documented above)
- State machine (Phase 3) prevents ad-hoc status updates that bypass audit trails (#9)
- Field-level access (Phase 4) prevents manager over-exposure (#3)
- Anonymisation rules (Phase 7) prevent re-identification (#12)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 6 (Manager Guidance):** Content design for difficult conversation scripts requires domain expertise and potential legal review. Occupational health/HR consultant input recommended. Research focus: conversation frameworks for mental health vs physical injury, legal boundaries for manager advice, confidence-building pedagogical patterns.
- **Phase 8 (OH Provider Integration):** Multi-org provider access patterns, data sharing agreement requirements (legal), provider onboarding workflows. Research focus: case assignment models, provider role permissions, third-party data access agreements under UK GDPR.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Multi-tenant SaaS architecture and UK GDPR compliance are well-documented. Verify ICO guidance and DPIA templates, but patterns are established.
- **Phase 2:** CSV import validation and employee management are standard features. Focus on implementation, not research.
- **Phase 3:** Finite state machines for workflow engines are textbook patterns. Focus on transition guard conditions.
- **Phase 4:** Supabase Storage patterns well-documented. Light verification of signed URL security model sufficient.
- **Phase 5:** Form capture and meeting scheduling are standard features.
- **Phase 7:** recharts patterns well-documented. Verify Bradford Factor formula and anonymisation rules from ONS guidelines.
- **Phase 9:** Data retention patterns standard. Verify ICO retention period guidance.
- **Phase 10:** Admin tooling patterns standard.

**Light research recommended:**
- **Phase 4:** Verify Supabase Storage access patterns, signed URL expiry best practices, and sharp compatibility with Next.js 16/Vercel for optional image processing.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core stack decided, complementary libraries based on training data (npm package existence/versions not verified live). Node.js crypto and PostgreSQL patterns are HIGH confidence (built-in, well-documented). Third-party library versions (papaparse ^5.4, recharts ^2.12, @react-pdf/renderer ^3.4) should be verified against npm before installing. |
| Features | MEDIUM | Table stakes and differentiators based on domain analysis of workplace health/absence management competitors (training data, not live competitor research). Feature categorisation (must/should/defer) is sound, but specific UI expectations and competitive positioning should be validated with target user interviews. Bradford Factor and UK fit note requirements are HIGH confidence (UK employment law standard). |
| Architecture | MEDIUM | Multi-tenant row-level patterns, service/repository pattern, and workflow state machines are HIGH confidence (well-documented). Health data isolation and field-level access control patterns are MEDIUM confidence (derived from UK GDPR requirements, not verified against live ICO case studies). PostgreSQL RLS and tenant scoping patterns are proven at SME scale. |
| Pitfalls | MEDIUM-HIGH | UK GDPR special category data requirements (Article 9, Schedule 1 DPA 2018) are HIGH confidence (established law). Specific ICO enforcement patterns and DPIA requirements are MEDIUM confidence (based on training data, should verify against current ICO guidance). Cross-tenant leakage and audit trail requirements are HIGH confidence (multi-tenant SaaS standard + health data sensitivity). |

**Overall confidence:** MEDIUM

### Gaps to Address

**During planning/implementation:**
- **DPIA template and ICO guidance verification:** Research cited UK GDPR Articles 9 and 30, DPA 2018 Schedule 1, and ICO guidance on special category data. Before Phase 1 implementation, review current ICO DPIA templates and guidance documents to confirm consent capture requirements, lawful basis documentation, and audit trail expectations. Gap: training data as of Jan 2025, ICO guidance may have updates.

- **Library version verification:** All complementary library versions (papaparse ^5.4, date-fns ^3.6, recharts ^2.12, @react-pdf/renderer ^3.4, @supabase/storage-js ^2.x) based on training data. Before installing, verify current npm versions, Next.js 16 compatibility, and bundle size impacts. Gap: no live npm/GitHub access during research.

- **Supabase Storage signed URL security model:** Research recommends 5-10 minute expiry for health document signed URLs. Verify Supabase Storage documentation for signed URL generation patterns, expiry configuration, and access control best practices. Gap: Supabase docs not accessed during research.

- **Bradford Factor formula confirmation:** Research cites S² × D formula (number of spells squared × total days). Verify against ACAS or UK HR standards guidance to confirm calculation method and interpretation thresholds. Gap: formula is standard but interpretation varies by industry.

- **sharp compatibility with Next.js 16 on Vercel:** Research suggests sharp ^0.33 for image processing (strip EXIF metadata, resize fit note uploads). Verify sharp works within Vercel serverless function size limits and Next.js 16 server component context. Gap: no live testing during research.

- **@react-pdf/renderer bundle size and serverless constraints:** Research flags bundle size caution and recommends server-side use only. Verify @react-pdf/renderer works within Vercel serverless memory/time limits for typical SalusBridge export volumes (10-50 page absence reports). Gap: no performance testing during research.

- **Manager guidance content design:** Phase 6 (Manager Guidance System) identified as needing domain expertise. During planning, engage occupational health consultant or HR legal expert to review conversation script frameworks. Gap: content design outside technical research scope.

- **Data sharing agreements for OH provider access:** Phase 8 (OH Provider Integration) requires legal verification of data sharing agreement requirements under UK GDPR for third-party access to health data. Consult legal before implementing provider portal. Gap: legal requirements outside technical research scope.

**Validation priorities:**
1. **HIGH PRIORITY:** ICO DPIA guidance and special category data lawful basis requirements (Phase 1 blocker)
2. **HIGH PRIORITY:** Verify all library versions against npm and Next.js 16 compatibility (Phase 1-2)
3. **MEDIUM PRIORITY:** Supabase Storage security patterns (Phase 4)
4. **MEDIUM PRIORITY:** Bradford Factor calculation standards (Phase 7)
5. **LOW PRIORITY:** sharp and @react-pdf/renderer performance constraints (Phase 4, 7 — can defer or use alternatives)
6. **DEFER TO PLANNING:** Manager guidance content and OH provider legal requirements (Phases 6, 8 — outside technical scope)

## Sources

### Primary (HIGH confidence)
- UK GDPR (retained EU GDPR via Data Protection Act 2018, Article 9 on special category data)
- Data Protection Act 2018, Schedule 1 (conditions for processing special category data)
- ICO (Information Commissioner's Office) guidance on special category data processing
- ICO guidance on Data Protection Impact Assessments (DPIAs)
- PostgreSQL documentation on Row-Level Security (RLS)
- Node.js crypto module documentation (AES-256-GCM authenticated encryption)
- Next.js 16 App Router documentation (Server Components, API Routes, middleware)
- Auth0 documentation (@auth0/nextjs-auth0 v4 integration patterns)

### Secondary (MEDIUM confidence)
- Multi-tenant SaaS security patterns from OWASP guidance
- UK fit note (Statement of Fitness for Work) regulations and GP format standards
- ACAS guidance on absence management and Bradford Factor
- Statistical disclosure control principles from ONS (Office for National Statistics) guidelines on minimum cohort sizes and small count suppression
- Supabase Storage documentation (signed URL generation, bucket permissions)
- papaparse documentation (CSV parsing with error handling)
- date-fns documentation (business day calculations)
- recharts documentation (React charting patterns)

### Tertiary (LOW confidence — training data, needs validation)
- Competitor landscape analysis for workplace health/absence management platforms (inferred table stakes and differentiators)
- UK employment law best practices on return-to-work meetings and workplace adjustments
- Equality Act 2010 implications for health data access in employment context
- @react-pdf/renderer and sharp compatibility with Next.js 16/Vercel (no live testing)
- Specific npm package versions (papaparse ^5.4, recharts ^2.12, etc.) — verify before install

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*
