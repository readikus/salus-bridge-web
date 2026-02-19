# Roadmap: SalusBridge

## Milestones

- ✅ **v1.0 Foundation & Sickness Lifecycle** - Phases 1-3 (shipped 2026-02-15)
- ✅ **v1.1 Landing & Waitlist** - Quick tasks (shipped 2026-02-16)
- 🚧 **v1.2 Absence Timeline Engine** - Phases 4-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation & Sickness Lifecycle (Phases 1-3) - SHIPPED 2026-02-15</summary>

### Phase 1: Foundation & Access
**Goal**: Multi-tenant platform with auth, RBAC, compliance infrastructure, and organisation/employee management
**Requirements**: PLAT-01, PLAT-02, PLAT-03, ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Plans**: 5/5 complete

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js project, database schema, encryption, and audit logging
- [x] 01-02-PLAN.md — Auth0 integration, RBAC, tenant context, notification privacy scaffolding, and employee invitation flow
- [x] 01-03-PLAN.md — Organisation CRUD, admin assignment, dashboard, and settings
- [x] 01-04-PLAN.md — Employee CRUD, role assignment, and employee management UI
- [x] 01-05-PLAN.md — CSV import, SAR data view, and manager reporting chain scope

### Phase 2: Sickness Lifecycle
**Goal**: Complete sickness case flow from reporting through return-to-work, with manager guidance and notifications
**Requirements**: SICK-01 through SICK-06, WRKF-01 through WRKF-04, FIT-01 through FIT-04, RTW-01 through RTW-04, GUID-01 through GUID-04, NOTF-01 through NOTF-04
**Plans**: 5/5 complete

Plans:
- [x] 02-01-PLAN.md — Database schema, RLS policies, constants, types, permissions, and Zod schemas
- [x] 02-02-PLAN.md — Sickness case reporting, workflow state machine, working days, and absence history UI
- [x] 02-03-PLAN.md — Fit note upload, secure storage, access control, and expiry tracking
- [x] 02-04-PLAN.md — Return-to-work meetings, structured questionnaire, and manager guidance system
- [x] 02-05-PLAN.md — Notification service, email templates, absence calendar, and dashboard integration

### Phase 3: Monitoring & Intelligence
**Goal**: Trigger point monitoring, analytics dashboards, and OH provider integration
**Requirements**: TRIG-01 through TRIG-03, ANAL-01 through ANAL-05, PROV-01 through PROV-04
**Plans**: 3/3 complete

Plans:
- [x] 03-01-PLAN.md — Trigger points, Bradford Factor calculation, threshold configuration, and alert notifications
- [x] 03-02-PLAN.md — Analytics dashboard with absence rates, trends, cohort enforcement, and CSV/PDF export
- [x] 03-03-PLAN.md — Occupational health provider linking, referral lifecycle, and communication logging

</details>

### 🚧 v1.2 Absence Timeline Engine (In Progress)

**Milestone Goal:** A configurable milestone-based workflow engine that automatically drives absence management -- from Day 1 notifications through Week 52 capability review -- with a compliance dashboard showing real-time risk status across all active cases.

#### Phase 4: Timeline Engine & GP Details
**Goal**: Sickness cases have a configurable milestone timeline that tracks absence duration, and employees can store GP details with medical records consent
**Depends on**: Phase 3 (existing sickness cases, notifications, org settings)
**Requirements**: TIME-01, TIME-02, GP-01, GP-02, GP-03
**Success Criteria** (what must be TRUE):
  1. Each active sickness case displays a timeline showing upcoming and past milestone points based on absence duration
  2. Org admin can override default milestone timings (e.g. change "Day 3" to "Day 5") for their organisation, and new cases use the custom timings
  3. Employee can add their GP name and address to their profile
  4. Employee can complete a consent form granting permission for medical records access, and HR can see the consent status
**Plans**: 3/3 complete

Plans:
- [x] 04-01-PLAN.md — Database schema, types, enums, permissions, constants, and Zod schemas for milestones and GP/consent
- [x] 04-02-PLAN.md — Milestone timeline engine: repository, service, API routes, org admin config UI, and case timeline component
- [x] 04-03-PLAN.md — GP details and medical records consent: repository, service, API routes, forms, and profile integration

#### Phase 5: Milestone Actions & Communication Log
**Goal**: The timeline engine automatically triggers the right notifications, prompts, and escalations at each milestone -- and all employer-employee contact is recorded in an auditable communication log
**Depends on**: Phase 4 (timeline engine, milestone configuration)
**Requirements**: TIME-03, TIME-04, TIME-05, TIME-06, TIME-07, TIME-08, TIME-09, TIME-10, COMM-01, COMM-02
**Success Criteria** (what must be TRUE):
  1. At Day 1, employee, manager, and HR each receive a responsibility notification for a new sickness case
  2. At Day 3, employee receives a notification about GP visit and fit note requirements; at Day 7 the case transitions to long-term with prompts for fit note upload and expected return date
  3. At Weeks 2-3, the system initiates check-in prompts and fit note renewal reminders; at Week 4, HR/manager is prompted to request a GP or OH report; at Week 6, system prompts creation of a Plan of Action
  4. From Week 10 onward, evaluation meetings are scheduled every 4 weeks; at Week 52, a formal capability review is triggered
  5. Manager or HR can record a communication log entry (date, type, notes) against a sickness case, and all entries are immutable and timestamped
**Plans**: TBD

Plans:
- [ ] 05-01-PLAN.md — TBD
- [ ] 05-02-PLAN.md — TBD

#### Phase 6: Compliance Dashboard
**Goal**: HR and managers can see real-time compliance risk across all active cases at a glance, with colour-coded indicators and deadline alerts
**Depends on**: Phase 5 (milestone actions must be firing to generate compliance data)
**Requirements**: COMP-06, COMP-07, COMP-08
**Success Criteria** (what must be TRUE):
  1. Each active sickness case shows a red/yellow/green risk indicator based on whether milestone actions are overdue, upcoming, or completed
  2. Dashboard shows escalating deadline alerts for milestones approaching their due date
  3. Manager or HR can view a single page showing all active cases with their compliance status, sortable and filterable
**Plans**: TBD

Plans:
- [ ] 06-01-PLAN.md — TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Access | v1.0 | 5/5 | Complete | 2026-02-14 |
| 2. Sickness Lifecycle | v1.0 | 5/5 | Complete | 2026-02-15 |
| 3. Monitoring & Intelligence | v1.0 | 3/3 | Complete | 2026-02-17 |
| 4. Timeline Engine & GP Details | v1.2 | 3/3 | Complete | 2026-02-19 |
| 5. Milestone Actions & Communication Log | v1.2 | 0/? | Not started | - |
| 6. Compliance Dashboard | v1.2 | 0/? | Not started | - |
