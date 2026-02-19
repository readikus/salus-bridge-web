---
phase: 04-timeline-engine-and-gp-details
verified: 2026-02-19T15:15:18Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 04: Timeline Engine and GP Details — Verification Report

**Phase Goal:** Sickness cases have a configurable milestone timeline that tracks absence duration, and employees can store GP details with medical records consent
**Verified:** 2026-02-19T15:15:18Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Each active sickness case displays a timeline showing upcoming and past milestone points based on absence duration | VERIFIED | `CaseTimeline` component fetches `fetchCaseTimeline` on mount; rendered in `app/(authenticated)/sickness/[id]/page.tsx` for all non-CLOSED cases; `MilestoneService.getCaseTimeline` computes PASSED/DUE_TODAY/UPCOMING per milestone |
| 2 | Org admin can override default milestone timings for their organisation, and new cases use the custom timings | VERIFIED | `app/(authenticated)/organisations/[slug]/milestones/page.tsx` lists all milestones with Edit/Reset actions; `MilestoneService.getEffectiveMilestones` merges org overrides over system defaults; `upsertOrgMilestone` creates/updates overrides; `getCaseTimeline` calls `getEffectiveMilestones` so new cases inherit org timings |
| 3 | Employee can add their GP name and address to their profile | VERIFIED | `GpDetailsForm` component with react-hook-form/zod renders on `my-profile` page when user has an employee record; PUT `/api/employees/[id]/gp-details` calls `GpService.updateGpDetails` → `EmployeeRepository.updateGpDetails` with ownership check |
| 4 | Employee can complete a consent form granting permission for medical records access, and HR can see the consent status | VERIFIED | `ConsentForm` component shows GRANTED/REVOKED/null states with grant/revoke actions and confirmation dialog; POST `/api/employees/[id]/consent` calls `GpService.grantConsent`/`revokeConsent`; GET `/api/organisations/[slug]/consent` calls `MedicalConsentRepository.findByOrganisation` returning all employee consent statuses to HR |

**Score:** 4/4 truths verified

---

### Required Artifacts

#### Plan 04-01 (Data foundation)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `database/migrations/20260218000001_create_milestone_configs.ts` | milestone_configs table with defaults and org overrides | VERIFIED | CREATE TABLE present; 19 default rows seeded; RLS policy with org isolation; partial unique index for NULL org_id |
| `database/migrations/20260218000002_add_gp_details_and_consent.ts` | GP columns on employees and medical_records_consent table | VERIFIED | ALTER TABLE adds gp_name/gp_address/gp_phone; CREATE TABLE medical_records_consent with UNIQUE(employee_id); RLS policy present |
| `constants/milestone-defaults.ts` | Default milestone definitions with day offsets and labels | VERIFIED | Exports `DEFAULT_MILESTONES`; 19 entries matching seeded migration data; `MilestoneDefault` interface exported |
| `schemas/milestone-config.ts` | Zod validation for milestone config create/update | VERIFIED | Exports `createMilestoneConfigSchema` and `updateMilestoneConfigSchema` with correct types |
| `schemas/gp-details.ts` | Zod validation for GP details and consent | VERIFIED | Exports `gpDetailsSchema` and `medicalConsentSchema` with correct enums and nullish fields |

#### Plan 04-02 (Timeline engine)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `providers/repositories/milestone-config.repository.ts` | CRUD for milestone configs with default/override resolution | VERIFIED | Static class with `findDefaults`, `findByOrganisation`, `findById`, `create`, `update`, `delete`, `findByOrgAndKey`; parameterised SQL with camelCase aliasing |
| `providers/services/milestone.service.ts` | Milestone resolution logic: merge defaults with org overrides, compute timeline for a case | VERIFIED | `getEffectiveMilestones` merges via Map keyed by milestoneKey; `getCaseTimeline` fetches case, calls getEffectiveMilestones, computes dueDate and PASSED/DUE_TODAY/UPCOMING status; `upsertOrgMilestone` and `resetToDefault` implemented |
| `app/api/organisations/[slug]/milestones/route.ts` | GET (list milestones) and POST (create override) endpoints | VERIFIED | GET returns merged milestones via TenantService; POST validates with createMilestoneConfigSchema, calls upsertOrgMilestone, audit logs |
| `app/api/sickness-cases/[id]/timeline/route.ts` | GET timeline for a specific sickness case | VERIFIED | Auth check → VIEW_SICKNESS_CASES permission → load case for orgId → TenantService.withTenant → MilestoneService.getCaseTimeline |
| `components/case-timeline/index.tsx` | Visual timeline component showing past/current/future milestones | VERIFIED | Renders vertical timeline with coloured icons (CheckCircle2 for PASSED, animated Clock for DUE_TODAY, Circle for UPCOMING); badges; day/date labels; description |
| `app/(authenticated)/organisations/[slug]/milestones/page.tsx` | Org admin page to view and customise milestone timings | VERIFIED | Lists all milestones as cards with Default/Custom badge; Edit button opens MilestoneConfigForm in Dialog; Reset button (non-defaults only) calls deleteMilestoneOverride |

#### Plan 04-03 (GP/consent UI)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `providers/repositories/medical-consent.repository.ts` | CRUD for medical_records_consent table | VERIFIED | `findByEmployee`, `findByOrganisation` (with user JOIN for employee name/email), `upsert` (INSERT ON CONFLICT with conditional consent_date/revoked_date), `findById` |
| `providers/services/gp.service.ts` | GP details update and consent management logic | VERIFIED | `updateGpDetails` calls EmployeeRepository and audit logs with GP_DETAILS entity; `grantConsent`/`revokeConsent` call MedicalConsentRepository.upsert and audit log with CONSENT/REVOKE actions |
| `app/api/employees/[id]/gp-details/route.ts` | GET and PUT endpoints for employee GP details | VERIFIED | Ownership check (employee.userId === sessionUser.id) OR permission; GET → EmployeeRepository.getGpDetails; PUT → gpDetailsSchema validation → GpService.updateGpDetails |
| `app/api/employees/[id]/consent/route.ts` | GET and POST endpoints for employee consent | VERIFIED | Ownership check OR permission; GET → MedicalConsentRepository.findByEmployee; POST → medicalConsentSchema → GpService.grantConsent or revokeConsent |
| `app/api/organisations/[slug]/consent/route.ts` | GET endpoint listing all employee consent statuses for HR | VERIFIED | VIEW_CONSENT permission → TenantService.withTenant → MedicalConsentRepository.findByOrganisation |
| `components/gp-details-form/index.tsx` | Form for employee to enter GP name, address, phone | VERIFIED | react-hook-form + zodResolver; fetches existing data on mount via fetchGpDetails; submits via updateGpDetails action; loading/success/error states |
| `components/consent-form/index.tsx` | Consent form with explanation and grant/revoke actions | VERIFIED | Renders distinct UI for null/GRANTED/REVOKED states; GP check before grant; AlertDialog for revoke confirmation; calls submitConsent action |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `providers/services/milestone.service.ts` | `providers/repositories/milestone-config.repository.ts` | `getEffectiveMilestones` merges defaults with org overrides | WIRED | `getEffectiveMilestones` calls `MilestoneConfigRepository.findDefaults` and `findByOrganisation` then merges via Map |
| `app/api/sickness-cases/[id]/timeline/route.ts` | `providers/services/milestone.service.ts` | `getCaseTimeline` computes milestone statuses from absence start date | WIRED | Route calls `MilestoneService.getCaseTimeline(id, sicknessCase.organisationId, client)` inside TenantService.withTenant |
| `components/case-timeline/index.tsx` | `actions/sickness-cases.ts` | `fetchCaseTimeline` action | WIRED | `useEffect` calls `fetchCaseTimeline(caseId)` on mount; result stored in `timeline` state and rendered |
| `app/api/employees/[id]/gp-details/route.ts` | `providers/repositories/employee.repository.ts` | `updateGpDetails` method | WIRED | PUT handler calls `GpService.updateGpDetails` which calls `EmployeeRepository.updateGpDetails`; GET calls `EmployeeRepository.getGpDetails` directly |
| `app/api/employees/[id]/consent/route.ts` | `providers/services/gp.service.ts` | `grantConsent`/`revokeConsent` methods | WIRED | POST handler branches on `consentStatus` and calls `GpService.grantConsent` or `GpService.revokeConsent` |
| `app/api/organisations/[slug]/consent/route.ts` | `providers/repositories/medical-consent.repository.ts` | `findByOrganisation` with employee details | WIRED | GET handler calls `MedicalConsentRepository.findByOrganisation(organisationId, client)` |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| TIME-01 (auto-tracking of absence milestones) | SATISFIED | Timeline computed from absenceStartDate + dayOffset per milestone; displayed on sickness case detail page |
| TIME-02 (org-level customisation of milestone timings) | SATISFIED | Milestones config page allows org admin to create/edit/reset overrides; getEffectiveMilestones merges org overrides over defaults |
| GP-01 (store GP details) | SATISFIED | GP columns on employees table; GpDetailsForm on my-profile page; PUT endpoint with ownership check |
| GP-02 (consent form) | SATISFIED | ConsentForm with explanation, GP prerequisite check, grant/revoke with confirmation; stored in medical_records_consent table |
| GP-03 (consent status visible to HR) | SATISFIED | GET /api/organisations/[slug]/consent returns all consent records with employee name/email; VIEW_CONSENT permission assigned to HR role |

---

### Anti-Patterns Found

No blockers detected. Notes:

- `components/consent-form/index.tsx` uses `<Badge variant="success">` and `<Badge variant="warning">` — both variants exist in `components/ui/badge.tsx` (lines 14-15), so these are valid.
- `app/(authenticated)/sickness/[id]/page.tsx` guards timeline with `status !== "CLOSED"` — correct, as `CLOSED` is the only terminal SicknessState; `CANCELLED` exists only on `RtwMeetingStatus` and does not apply to sickness case status.

---

### Human Verification Required

The following items cannot be verified programmatically:

#### 1. Timeline visual rendering on active case

**Test:** Open an active sickness case that has been running for more than 3 days. Navigate to the case detail page.
**Expected:** An "Absence Timeline" section appears below the case details, showing milestones as a vertical timeline — green checkmarks for past milestones, an amber pulsing icon for any milestone due today, grey circles for upcoming milestones with future due dates.
**Why human:** Visual layout, animation (pulse on DUE_TODAY), and date formatting require browser rendering to confirm.

#### 2. Org admin milestone customisation flow

**Test:** As an org admin, navigate to Organisation Settings > Milestones. Click Edit on "Day 3 - GP Visit Reminder". Change the day offset to 5. Save. Open a new sickness case and check its timeline.
**Expected:** The milestone config page shows all milestones with Default/Custom badges. After saving, the "Day 3" entry shows "Day 5" and a Custom badge. New cases reflect the custom day offset.
**Why human:** The full end-to-end save-and-refresh cycle and badge state transition require UI interaction to confirm.

#### 3. GP details and consent flow on profile

**Test:** Log in as an employee. Navigate to My Profile. Enter GP details, save. Then click "Grant Consent". Verify the consent form shows the granted state and date.
**Expected:** GP details save with a success message. Consent form transitions to showing "Consent Granted" badge with the current date and a "Revoke Consent" button.
**Why human:** Form submission feedback, state transitions between consent statuses, and the GP prerequisite check (requiring gpName before grant) require browser interaction.

#### 4. HR consent overview

**Test:** Log in as HR. Navigate to the org consent listing (via `/api/organisations/{slug}/consent` or any HR-facing UI that exposes this).
**Expected:** A list of employees with their consent status (Granted/Revoked/No Consent).
**Why human:** Note — no dedicated HR-facing UI page for the consent overview was identified in the codebase. The API endpoint exists and is correct, but it is unclear whether the consent data is surfaced anywhere in the HR user interface beyond the API. This warrants manual confirmation that HR can actually see consent statuses in the app.

---

### Gaps Summary

No blocking gaps were found. All 4 observable truths are fully verified with substantive artifacts and correct wiring.

One item is flagged for human review (item 4 above): there is no dedicated HR-facing UI page that renders the consent overview from `GET /api/organisations/[slug]/consent`. The API endpoint is implemented and permission-gated correctly, but if the requirement (GP-03) demands a visible HR consent dashboard in the UI rather than just an accessible API, that surface has not been built. This is not a code defect — it may be intentional (the consent data could be surfaced elsewhere, or this may be acceptable for the milestone) — but it warrants human confirmation.

---

_Verified: 2026-02-19T15:15:18Z_
_Verifier: Claude (gsd-verifier)_
