# Roadmap: SalusBridge

## Overview

SalusBridge delivers a compliance-first workplace health coordination platform in three phases. Phase 1 builds the multi-tenant foundation with authentication, RBAC, audit logging, and organisation/employee management. Phase 2 delivers the complete sickness lifecycle -- the core product loop from reporting through fit notes and return-to-work, including manager guidance and notifications. Phase 3 adds the intelligence layer: trigger point monitoring, analytics dashboards, and occupational health provider integration.

## Phases

- [ ] **Phase 1: Foundation & Access** - Multi-tenant platform with auth, RBAC, compliance infrastructure, and organisation/employee management
- [ ] **Phase 2: Sickness Lifecycle** - Complete sickness case flow from reporting through return-to-work, with manager guidance and notifications
- [ ] **Phase 3: Monitoring & Intelligence** - Trigger points, analytics dashboards, and OH provider integration

## Phase Details

### Phase 1: Foundation & Access
**Goal**: Platform admin can create organisations, org admins can onboard employees, and all users can securely access the platform with role-appropriate permissions -- built on a compliance-ready foundation with audit logging and data isolation
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. Platform admin can create an organisation, assign an org admin, and see it in the system-wide list
  2. Org admin can import employees via CSV (with validation preview and duplicate detection) and manually manage employee records
  3. Admin users can log in with email/password; employees can access the platform via single-use magic link
  4. Each role (platform admin, org admin, HR, manager, employee) sees only data appropriate to their permissions, with managers scoped to direct reports only
  5. Every access to health-related data is logged in an immutable audit trail, sensitive fields are encrypted at rest, and employees can view what data is held about them
**Plans**: 5 plans (4 waves)

Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js project, database schema, encryption, and audit logging (Wave 1)
- [ ] 01-02-PLAN.md — Auth0 integration, RBAC, tenant context, notification privacy scaffolding, and employee invitation flow (Wave 2)
- [ ] 01-03-PLAN.md — Organisation CRUD, admin assignment, dashboard, and settings (Wave 3)
- [ ] 01-04-PLAN.md — Employee CRUD, role assignment, and employee management UI (Wave 3)
- [ ] 01-05-PLAN.md — CSV import, SAR data view, and manager reporting chain scope (Wave 4)

### Phase 2: Sickness Lifecycle
**Goal**: An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step
**Depends on**: Phase 1
**Requirements**: SICK-01, SICK-02, SICK-03, SICK-04, SICK-05, SICK-06, WRKF-01, WRKF-02, WRKF-03, WRKF-04, FIT-01, FIT-02, FIT-03, FIT-04, RTW-01, RTW-02, RTW-03, RTW-04, GUID-01, GUID-02, GUID-03, GUID-04, NOTF-01, NOTF-02, NOTF-03, NOTF-04
**Success Criteria** (what must be TRUE):
  1. Employee can report their own sickness (or manager can report on their behalf) with absence type, dates, and notes -- and the case follows a validated state machine from REPORTED through to CLOSED
  2. Fit notes can be uploaded, stored securely with signed URLs, tracked for expiry with alerts, and accessed only by authorised roles (HR/employee, not managers)
  3. Manager or HR can schedule a return-to-work meeting, complete a structured questionnaire, record outcomes and adjustments, and close the sickness case
  4. Manager receives contextual, empathetic conversation guidance appropriate to the absence scenario at key workflow moments (initial contact, check-in, RTW meeting)
  5. Relevant parties receive notifications at each workflow step (sickness reported, fit note expiring, RTW scheduled) without health details being exposed in notification content
**Plans**: TBD

Plans:
- [ ] 02-01: Sickness reporting and workflow state machine
- [ ] 02-02: Fit note management and health data handling
- [ ] 02-03: Return-to-work workflow, manager guidance, and notifications

### Phase 3: Monitoring & Intelligence
**Goal**: Organisations can monitor absence patterns, detect trigger points, access analytics dashboards, and coordinate with external occupational health providers
**Depends on**: Phase 2
**Requirements**: TRIG-01, TRIG-02, TRIG-03, ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, PROV-01, PROV-02, PROV-03, PROV-04
**Success Criteria** (what must be TRUE):
  1. Org admin can configure absence trigger thresholds and the system alerts manager/HR when an employee hits a trigger point, including Bradford Factor visibility
  2. Organisation dashboard shows absence rates by team/department/org with month-over-month trends, enforcing minimum cohort sizes to prevent re-identification
  3. Reports are exportable as CSV and PDF
  4. HR or manager can create an OH referral for a sickness case, track its status, and log provider communication
**Plans**: TBD

Plans:
- [ ] 03-01: Trigger points and Bradford Factor
- [ ] 03-02: Analytics dashboards and reporting
- [ ] 03-03: Occupational health provider integration

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Access | 0/5 | Not started | - |
| 2. Sickness Lifecycle | 0/3 | Not started | - |
| 3. Monitoring & Intelligence | 0/3 | Not started | - |
