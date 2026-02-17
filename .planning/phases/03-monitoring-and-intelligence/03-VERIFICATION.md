---
phase: 03-monitoring-and-intelligence
verified: 2026-02-17T15:30:00Z
status: passed
score: 16/16 must-haves verified
---

# Phase 03: Monitoring & Intelligence Verification Report

**Phase Goal:** Organisations can monitor absence patterns, detect trigger points, access analytics dashboards, and coordinate with external occupational health providers

**Verified:** 2026-02-17T15:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Org admin can configure absence trigger thresholds (frequency, Bradford Factor, duration) | ✓ VERIFIED | TriggerConfigForm component with all 3 types, CRUD API routes with MANAGE_TRIGGERS permission, UI at /organisations/[slug]/triggers with tabbed interface |
| 2 | System alerts manager/HR when employee hits trigger point | ✓ VERIFIED | TriggerService.evaluate called from sickness-case.service.ts (line 96) and workflow.service.ts (line 98), fireAlert sends NotificationService.send (line 156), deduplication check via existsForTriggerAndCase |
| 3 | Bradford Factor calculated per employee and visible to managers/HR | ✓ VERIFIED | BradfordFactorService.calculate implements S*S*D formula (lines 41-57), 52-week lookback via BRADFORD_LOOKBACK_WEEKS constant, BradfordFactorBadge component renders color-coded risk levels, displayed in triggers alerts tab and analytics dashboard |
| 4 | Organisation dashboard shows absence rates by team/department/org | ✓ VERIFIED | AnalyticsRepository.getAbsenceRates with groupBy parameter (team/department/organisation), AnalyticsDashboard component at /organisations/[slug]/analytics, absence-rate-chart.tsx renders horizontal bars with green/amber/red coloring |
| 5 | Month-over-month absence trends visible | ✓ VERIFIED | AnalyticsRepository.getMonthlyTrends returns monthly aggregations with absenceCount, uniqueEmployees, totalDaysLost, trend-chart.tsx renders sparkline bars + data table, period selector (3m/6m/12m) via analyticsQuerySchema |
| 6 | Minimum cohort size (5+) enforced to prevent re-identification | ✓ VERIFIED | MINIMUM_COHORT_SIZE = 5 constant in analytics.service.ts (line 12), enforceCohortSize private method (lines 137-159) suppresses data for groups < 5 employees, CohortGuard component renders lock icon and suppression message, organisation-level never suppressed |
| 7 | Reports exportable as CSV and PDF | ✓ VERIFIED | AnalyticsService.exportCSV (lines 165-208) and exportHTML (lines 214-289), CSV via string concatenation with csvEscape for commas, PDF via print-ready HTML with @media print styles, export API route with EXPORT_ANALYTICS permission and audit logging (AuditAction.EXPORT, AuditEntity.ANALYTICS) |
| 8 | Org admin can link OH providers to organisation | ✓ VERIFIED | oh_providers table with RLS (migration 20260216000003), OhProviderForm component, CRUD API routes at /api/organisations/[slug]/oh-providers with MANAGE_OH_PROVIDERS permission, card grid UI at /organisations/[slug]/oh-providers with add/edit/delete actions |
| 9 | HR or manager can create OH referral for sickness case | ✓ VERIFIED | OhReferralForm with sicknessCaseId and providerId selects, OhReferralService.create validates case belongs to org and derives employeeId (lines 21-64), POST /api/organisations/[slug]/oh-referrals with CREATE_REFERRAL permission, dialog-based form in referrals list page |
| 10 | Referral status tracked through lifecycle stages | ✓ VERIFIED | ReferralStatus enum (SUBMITTED, IN_PROGRESS, REPORT_RECEIVED, CLOSED) in referral-statuses.ts, VALID_REFERRAL_TRANSITIONS map enforces valid state machine transitions (lines 177-182), OhReferralService.updateStatus validates transitions (lines 84-90), detail page shows status badges and transition buttons for valid next states |
| 11 | Provider communication logged bidirectionally | ✓ VERIFIED | oh_referral_communications table with direction field (INBOUND/OUTBOUND), CommunicationLog component with timeline display and add form, OhReferralService.addCommunication creates records (lines 117-153), POST /api/organisations/[slug]/oh-referrals/[id]/communications API route |

**Score:** 11/11 truths verified (100%)

### Required Artifacts

**Plan 03-01 (Trigger Points & Bradford Factor):**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `providers/services/bradford-factor.service.ts` | Bradford Factor calculation from sickness case history | ✓ VERIFIED | Exports BradfordFactorService with calculate() (S*S*D formula, 52-week lookback, countWeekdays for ongoing cases) and calculateForTeam() for aggregation. Lines 27-67, 73-85. Returns { score, spells, totalDays, riskLevel }. |
| `providers/services/trigger.service.ts` | Trigger evaluation and alert dispatch | ✓ VERIFIED | Exports TriggerService with evaluate() method (lines 25-77) that checks FREQUENCY, BRADFORD_FACTOR, and DURATION types. fireAlert() creates alerts with dedup check and sends notifications (lines 83-171). |
| `database/migrations/20260216000001_create_trigger_configs.ts` | trigger_configs table for org-level threshold configuration | ✓ VERIFIED | CREATE TABLE trigger_configs with organisation_id, trigger_type, threshold_value, period_days, is_active. Indexes on org_id and (org_id, is_active). RLS policy org_isolation + platform_admin_bypass. |
| `database/migrations/20260216000002_create_trigger_alerts.ts` | trigger_alerts table for tracking fired alerts | ✓ VERIFIED | CREATE TABLE trigger_alerts with trigger_config_id, employee_id, sickness_case_id, triggered_value, acknowledged_by, acknowledged_at. Indexes on org_id, employee_id, (org_id, acknowledged_at). RLS policy org_isolation. |
| `app/api/organisations/[slug]/triggers/route.ts` | CRUD API for trigger configurations | ✓ VERIFIED | GET returns configs or alerts based on ?view param with VIEW_TRIGGERS permission. POST creates config with MANAGE_TRIGGERS permission and Zod validation. Lines 17-66, 73-136. |
| `app/(authenticated)/organisations/[slug]/triggers/page.tsx` | Trigger configuration UI for org admins | ✓ VERIFIED | Tabbed interface (Trigger Rules + Alerts) using shadcn Tabs. TriggerConfigForm in Dialog for create/edit. TanStack Query with fetchTriggerConfigs, createTriggerConfig, updateTriggerConfig, deleteTriggerConfig, acknowledgeTriggerAlert. BradfordFactorBadge displayed in alerts table. Lines 1-334. |

**Plan 03-02 (Analytics):**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `providers/repositories/analytics.repository.ts` | Aggregation SQL queries for absence rates, trends, and Bradford scores | ✓ VERIFIED | AnalyticsRepository with getAbsenceRates (groupBy: team/department/organisation, parameterised SQL with CTE, lines 35-105), getMonthlyTrends (monthly aggregations, lines 111-134), getDepartmentEmployeeCounts (cohort size checking, lines 139-160). |
| `providers/services/analytics.service.ts` | Analytics business logic with cohort size enforcement | ✓ VERIFIED | AnalyticsService.getAnalytics orchestrates repository + BradfordFactorService.calculateForTeam (line 92), enforceCohortSize suppresses groups < 5 employees (lines 137-159), MANAGER scoping via EmployeeRepository.findByManagerChain. exportCSV (lines 165-208) and exportHTML (lines 214-289) with escape helpers. |
| `app/api/organisations/[slug]/analytics/route.ts` | Analytics data API endpoint | ✓ VERIFIED | GET with analyticsQuerySchema validation, VIEW_ANALYTICS permission, TenantService.withTenant wrapping, returns { absenceRates, trends, bradfordScores, generatedAt }. Lines 15-60. |
| `app/api/organisations/[slug]/analytics/export/route.ts` | CSV and PDF export endpoint | ✓ VERIFIED | GET with analyticsExportSchema, EXPORT_ANALYTICS permission, audit logging with AuditAction.EXPORT + AuditEntity.ANALYTICS. CSV returns text/csv with Content-Disposition attachment. PDF returns text/html for print. Lines 16-98. |
| `app/(authenticated)/organisations/[slug]/analytics/page.tsx` | Analytics dashboard page | ✓ VERIFIED | Server component wrapper rendering AnalyticsDashboard with slug param. Lines 1-23. |
| `components/analytics-dashboard/cohort-guard.tsx` | Minimum cohort size enforcement UI component | ✓ VERIFIED | CohortGuard renders Lock icon + "Data suppressed: {reason}" for suppressed groups, otherwise renders children. Lines 1-27. |

**Plan 03-03 (OH Providers):**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `database/migrations/20260216000003_create_oh_providers.ts` | oh_providers table for linked external providers | ✓ VERIFIED | CREATE TABLE oh_providers with organisation_id, name, contact_email, contact_phone, address, notes, is_active. Index on org_id. RLS policy org_isolation + platform_admin_bypass. Lines 4-40. |
| `database/migrations/20260216000004_create_oh_referrals.ts` | oh_referrals and oh_referral_communications tables | ✓ VERIFIED | CREATE TABLE oh_referrals (with sickness_case_id, employee_id, provider_id, status, reason, urgency, report_notes_encrypted) and oh_referral_communications (with referral_id, author_id, direction, message). Indexes on all FKs + status. RLS policies with EXISTS join for communications. Lines 4-81. |
| `providers/services/oh-referral.service.ts` | Referral lifecycle management with status transitions and communication logging | ✓ VERIFIED | OhReferralService with create() deriving employee_id from sickness case (lines 21-64), updateStatus() with VALID_REFERRAL_TRANSITIONS validation + EncryptionService for report notes (lines 70-112), addCommunication() (lines 117-153), getById() with decryption (lines 158-188). |
| `app/(authenticated)/organisations/[slug]/oh-referrals/[id]/page.tsx` | Referral detail page with status tracking and communication log | ✓ VERIFIED | Client component with referral info card, status transition buttons (validNextStates from VALID_REFERRAL_TRANSITIONS), report notes textarea on REPORT_RECEIVED transition, CommunicationLog component with handleAddCommunication. Lines 1-249. |

**Score:** 16/16 artifacts pass all 3 levels (exists, substantive, wired)

### Key Link Verification

**Plan 03-01:**

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| providers/services/trigger.service.ts | providers/services/bradford-factor.service.ts | BradfordFactorService.calculate() call during trigger evaluation | ✓ WIRED | Line 50: `const result = await BradfordFactorService.calculate(employeeId, client);` in BRADFORD_FACTOR case block |
| providers/services/trigger.service.ts | providers/services/notification.service.ts | Fire-and-forget notification on trigger breach | ✓ WIRED | Line 156: `await NotificationService.send({ to: managerInfo.email, ... })` within fireAlert try/catch |
| providers/services/sickness-case.service.ts | providers/services/trigger.service.ts | TriggerService.evaluate() called after case creation/transition | ✓ WIRED | sickness-case.service.ts line 96 + workflow.service.ts line 98 both call `await TriggerService.evaluate(...)` in fire-and-forget pattern |

**Plan 03-02:**

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| providers/services/analytics.service.ts | providers/services/bradford-factor.service.ts | BradfordFactorService.calculateForTeam for team Bradford aggregation | ✓ WIRED | Line 92: `const bradfordMap = await BradfordFactorService.calculateForTeam(employeeIds, client);` |
| providers/services/analytics.service.ts | providers/repositories/analytics.repository.ts | Repository queries for absence rate and trend data | ✓ WIRED | Lines 66, 74: `await AnalyticsRepository.getAbsenceRates(...)` and `await AnalyticsRepository.getMonthlyTrends(...)` |
| components/analytics-dashboard/index.tsx | actions/analytics.ts | TanStack Query fetching analytics data | ✓ WIRED | Lines 5, 29: import fetchAnalytics, exportAnalyticsCSV, exportAnalyticsPDF; queryFn calls fetchAnalytics(slug, { period, groupBy }) |

**Plan 03-03:**

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| providers/services/oh-referral.service.ts | providers/repositories/oh-referral.repository.ts | Repository for referral CRUD and status transitions | ✓ WIRED | Lines 35, 78, 98, 126, 131, 163, 168, 198: all call OhReferralRepository methods (create, findById, updateStatus, addCommunication, getCommunications, findByOrganisation) |
| app/api/organisations/[slug]/oh-referrals/[id]/communications/route.ts | providers/services/oh-referral.service.ts | OhReferralService.addCommunication for logging messages | ✓ WIRED | Line 80: `const communication = await OhReferralService.addCommunication(...)` |

**Score:** 8/8 key links wired (100%)

### Requirements Coverage

All Phase 03 requirements (TRIG-01, TRIG-02, TRIG-03, ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, PROV-01, PROV-02, PROV-03, PROV-04) are satisfied:

| Requirement | Status | Supporting Truth(s) |
|-------------|--------|---------------------|
| TRIG-01: Org admin can configure absence trigger thresholds | ✓ SATISFIED | Truth #1 (trigger config UI with 3 types) |
| TRIG-02: System alerts manager/HR when employee hits trigger | ✓ SATISFIED | Truth #2 (TriggerService.evaluate integration) |
| TRIG-03: Bradford Factor calculated and visible | ✓ SATISFIED | Truth #3 (BradfordFactorService + badge component) |
| ANAL-01: Dashboard shows absence rates by team/department/org | ✓ SATISFIED | Truth #4 (AnalyticsRepository.getAbsenceRates) |
| ANAL-02: Month-over-month absence trends | ✓ SATISFIED | Truth #5 (monthly trend data + sparkline chart) |
| ANAL-03: Bradford Factor per employee and aggregated by team | ✓ SATISFIED | Truth #3 + #4 (bradford-table.tsx sortable, team aggregation) |
| ANAL-04: Minimum cohort size enforcement (5+ people) | ✓ SATISFIED | Truth #6 (MINIMUM_COHORT_SIZE, enforceCohortSize, CohortGuard) |
| ANAL-05: Reports exportable as CSV and PDF | ✓ SATISFIED | Truth #7 (exportCSV, exportHTML with audit logging) |
| PROV-01: Org admin can link OH providers | ✓ SATISFIED | Truth #8 (OH provider CRUD with MANAGE_OH_PROVIDERS) |
| PROV-02: HR/manager can create OH referral | ✓ SATISFIED | Truth #9 (OhReferralForm + CREATE_REFERRAL permission) |
| PROV-03: Referral status tracked through stages | ✓ SATISFIED | Truth #10 (ReferralStatus enum + VALID_REFERRAL_TRANSITIONS) |
| PROV-04: Communication logged | ✓ SATISFIED | Truth #11 (oh_referral_communications table + CommunicationLog) |

**Score:** 12/12 requirements satisfied (100%)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | - |

**Summary:** No TODOs, FIXMEs, placeholders, empty implementations, or console-log-only handlers found in any of the 26 created files across the 3 subphases. All services have substantive implementations. All components render real data from API calls.

### Navigation Integration

| Nav Item | Path | Permission | Status |
|----------|------|------------|--------|
| Triggers | /organisations/[slug]/triggers | VIEW_TRIGGERS | ✓ ADDED |
| Analytics | /organisations/[slug]/analytics | VIEW_ANALYTICS | ✓ ADDED |
| OH Providers | /organisations/[slug]/oh-providers | VIEW_OH_PROVIDERS | ✓ ADDED |
| Referrals | /organisations/[slug]/oh-referrals | VIEW_REFERRALS | ✓ ADDED |

All 4 nav items confirmed in components/sidebar/nav-items.ts (lines 93, 99, 105, 111).

All permissions defined in constants/permissions.ts with correct role mappings:
- MANAGE_TRIGGERS, VIEW_TRIGGERS (lines 26-27)
- MANAGE_OH_PROVIDERS, VIEW_OH_PROVIDERS, CREATE_REFERRAL, VIEW_REFERRALS (lines 28-31)
- VIEW_ANALYTICS, EXPORT_ANALYTICS (lines 32-33)

### Commit Verification

All 7 task commits from the 3 subphases verified present in git log:

**03-01 (Trigger Points):**
- 11749f2: Task 1 - Database schema, types, constants, Bradford Factor service
- 0cd1fde: Task 2 - Trigger evaluation service, alert notifications, API routes
- cfe66d9: Task 3 - Trigger configuration UI and Bradford Factor display

**03-02 (Analytics):**
- 40a1088: Task 1 - Analytics repository, service, API routes with cohort enforcement
- a3e18bf: Task 2 - Analytics dashboard UI with charts, Bradford table, export

**03-03 (OH Providers):**
- 50526ff: Task 1 - OH provider and referral schema, types, repositories, service
- e975c92: Task 2 - OH provider management UI and referral tracking UI

All commits follow conventional commit format (feat) and are atomic per task.

---

## Overall Status: PASSED

**Phase 03 has achieved its goal.** All 4 success criteria from ROADMAP.md are satisfied:

1. ✓ **Org admin can configure absence trigger thresholds and the system alerts manager/HR when an employee hits a trigger point, including Bradford Factor visibility** — MANAGE_TRIGGERS permission UI with 3 trigger types (frequency, Bradford Factor, duration), TriggerService.evaluate integration fires alerts with dedup check and privacy-safe email notifications, BradfordFactorService calculates S*S*D with 52-week lookback, risk-level badges displayed throughout UI

2. ✓ **Organisation dashboard shows absence rates by team/department/org with month-over-month trends, enforcing minimum cohort sizes to prevent re-identification** — AnalyticsDashboard at /organisations/[slug]/analytics with groupBy selector (team/department/organisation), horizontal bar charts with green/amber/red absence rate coloring, monthly sparkline + data table, MINIMUM_COHORT_SIZE = 5 enforcement with CohortGuard component suppressing small groups (Lock icon + reason message)

3. ✓ **Reports are exportable as CSV and PDF** — Export buttons trigger AnalyticsService.exportCSV (string concatenation with csvEscape) and exportHTML (print-ready HTML with @media print styles), CSV returns with Content-Disposition attachment, PDF opens in new window for printing, both audit-logged with AuditAction.EXPORT + AuditEntity.ANALYTICS

4. ✓ **HR or manager can create an OH referral for a sickness case, track its status, and log provider communication** — OH provider CRUD at /organisations/[slug]/oh-providers with card grid + dialog forms, referral creation at /organisations/[slug]/oh-referrals links sickness case to provider, ReferralStatus state machine (SUBMITTED → IN_PROGRESS → REPORT_RECEIVED → CLOSED) with VALID_REFERRAL_TRANSITIONS validation, referral detail page shows status progression buttons + report notes textarea on REPORT_RECEIVED transition, CommunicationLog component with timeline (INBOUND/OUTBOUND arrows) and add form

**Quality:**
- All migrations have RLS policies (org_isolation + platform_admin_bypass pattern)
- All API routes enforce RBAC permissions via AuthService.validateAccess
- All state transitions validated (trigger status, referral status)
- All health data encrypted (report notes via EncryptionService)
- All actions audit-logged (AuditAction.CREATE/REFER/TRANSITION/EXPORT/ACKNOWLEDGE)
- All UI components wired to actions and repositories
- No anti-patterns (TODOs, stubs, placeholders)
- Fire-and-forget patterns used correctly (trigger evaluation, notifications)

**Privacy & Compliance:**
- Bradford Factor uses simple weekday count (bank holidays not relevant)
- Alert emails are privacy-safe (first name + last initial only, no health details)
- Cohort enforcement prevents re-identification (minimum 5 employees per group)
- Report notes encrypted at rest via EncryptionService
- All exports audit-logged

---

**Verified:** 2026-02-17T15:30:00Z
**Verifier:** Claude (gsd-verifier)
**Next Step:** Phase complete — ready for production deployment
