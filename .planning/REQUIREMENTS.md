# Requirements: SalusBridge

**Defined:** 2026-02-14
**Core Value:** An employee can report sickness and be guided through a complete return-to-work cycle — with their manager receiving structured, empathetic guidance at every step.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Platform & Organisation

- [ ] **PLAT-01**: Platform admin can create a new organisation with name, slug, and settings
- [ ] **PLAT-02**: Platform admin can assign an organisation administrator
- [ ] **PLAT-03**: Platform admin can view system-wide organisation list and status
- [ ] **ORG-01**: Organisation admin can import employees via CSV with validation preview, duplicate detection, and error reporting
- [ ] **ORG-02**: Organisation admin can manually add, edit, and deactivate employee records
- [ ] **ORG-03**: Organisation admin can assign roles (manager, HR, employee) to users within their organisation
- [ ] **ORG-04**: Organisation admin can view organisation dashboard with employee count, active absences, and key metrics
- [ ] **ORG-05**: Organisation admin can configure organisation settings (absence trigger thresholds, notification preferences)

### Authentication & Access

- [ ] **AUTH-01**: Admin users (platform admin, org admin, HR, manager) can log in with email and password via Auth0
- [ ] **AUTH-02**: Employees receive magic link emails to access the platform without passwords
- [ ] **AUTH-03**: Magic links are single-use with short expiry (15 minutes max)
- [ ] **AUTH-04**: User sessions persist across browser refresh
- [ ] **AUTH-05**: Role-based access control enforces 5-tier permissions (platform admin, org admin, HR, manager, employee)
- [ ] **AUTH-06**: Managers can only view data for their direct reports
- [ ] **AUTH-07**: All tenant-scoped data is isolated by organisation (row-level with RLS)

### Sickness Reporting

- [ ] **SICK-01**: Employee can report their own sickness with absence type, start date, and optional notes
- [ ] **SICK-02**: Manager can report sickness on behalf of a direct report
- [ ] **SICK-03**: Sickness report captures absence type from broad categories (musculoskeletal, mental health, respiratory, surgical, other)
- [ ] **SICK-04**: System tracks absence duration with start/end dates and auto-calculates working days lost (excluding weekends and UK bank holidays)
- [ ] **SICK-05**: Employee and manager can view chronological absence history with search and filter
- [ ] **SICK-06**: Manager can view absence calendar showing team absences at a glance

### Fit Note Management

- [ ] **FIT-01**: Employee or HR user can upload fit note document (PDF/image) with secure storage
- [ ] **FIT-02**: System captures structured fit note data: status (not fit / may be fit), duration, functional effects categories
- [ ] **FIT-03**: System tracks fit note expiry dates and sends alerts to manager/HR before expiry
- [ ] **FIT-04**: Fit note documents are accessible only to authorised roles (HR, org admin) via short-lived signed URLs

### Return-to-Work

- [ ] **RTW-01**: Manager or HR can schedule a return-to-work meeting linked to a sickness case
- [ ] **RTW-02**: System provides structured RTW questionnaire/form for the meeting
- [ ] **RTW-03**: RTW meeting outcomes and agreed adjustments are recorded and stored
- [ ] **RTW-04**: Completed RTW meeting closes the sickness case (or transitions to monitoring)

### Workflow Engine

- [ ] **WRKF-01**: Sickness cases follow a defined state machine (REPORTED → TRACKING → FIT_NOTE_RECEIVED → RTW_SCHEDULED → RTW_COMPLETED → CLOSED)
- [ ] **WRKF-02**: All state transitions are validated (only allowed transitions succeed)
- [ ] **WRKF-03**: Every state transition is logged with timestamp, actor, from-state, to-state, and notes
- [ ] **WRKF-04**: Long-term absences (configurable threshold) trigger escalation path

### Manager Guidance

- [ ] **GUID-01**: Manager receives scripted conversation guidance appropriate to the absence scenario (e.g., mental health vs physical injury)
- [ ] **GUID-02**: Guidance is presented as step-by-step prompts during key workflow moments (initial contact, check-in, RTW meeting)
- [ ] **GUID-03**: Guidance content is empathetic, action-oriented, and compliant with UK employment best practice
- [ ] **GUID-04**: System tracks which guidance a manager has engaged with

### Trigger Points & Monitoring

- [ ] **TRIG-01**: Organisation admin can configure absence trigger thresholds (e.g., 3 absences in 6 months, Bradford Factor score)
- [ ] **TRIG-02**: System alerts manager/HR when an employee hits a configured trigger point
- [ ] **TRIG-03**: Bradford Factor is calculated per employee and visible to managers and HR

### OH Provider Integration

- [ ] **PROV-01**: Organisation admin can link external occupational health providers to their organisation
- [ ] **PROV-02**: HR or manager can create an OH referral for a sickness case
- [ ] **PROV-03**: Referral status is tracked (submitted → in progress → report received)
- [ ] **PROV-04**: Communication between organisation and provider is logged

### Analytics & Reporting

- [ ] **ANAL-01**: Organisation dashboard shows absence rates by team, department, and whole organisation
- [ ] **ANAL-02**: Trend reporting shows month-over-month absence patterns
- [ ] **ANAL-03**: Bradford Factor scores displayed per employee and aggregated by team
- [ ] **ANAL-04**: Analytics enforce minimum cohort size (5+ people) to prevent re-identification
- [ ] **ANAL-05**: Reports exportable as CSV and PDF

### Compliance & Audit

- [ ] **COMP-01**: All access to health data is logged in an immutable audit trail (who, what, when, action)
- [ ] **COMP-02**: Health data fields are encrypted at rest using AES-256-GCM
- [ ] **COMP-03**: Notifications never reveal health details, employee names, or conditions in subject/body
- [ ] **COMP-04**: Data visibility is role-appropriate: managers see dates + actions, HR sees health details, employees see their own records
- [ ] **COMP-05**: Employees can view what data is held about them (SAR readiness)

### Notifications

- [ ] **NOTF-01**: Manager receives notification when a direct report reports sick
- [ ] **NOTF-02**: Manager/HR receives notification when a fit note is approaching expiry
- [ ] **NOTF-03**: Employee receives notification when a RTW meeting is scheduled
- [ ] **NOTF-04**: Notifications link to authenticated context without revealing health details

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Employee Wellbeing
- **WELL-01**: Periodic wellbeing check-ins during long-term absence
- **WELL-02**: Workplace adjustment tracking and review dates
- **WELL-03**: Employee self-service portal with entitlement guidance

### Advanced Analytics
- **ADVN-01**: Cost of absence calculation per employee/team/org
- **ADVN-02**: Predicted return dates based on absence type and duration
- **ADVN-03**: Pattern detection (e.g., Monday absences, seasonal trends)

### Consent Management
- **CONS-01**: Granular consent records per processing purpose
- **CONS-02**: Consent withdrawal UI with cascade logic
- **CONS-03**: Data retention policies with automated cleanup

### Advanced Provider
- **APROV-01**: Provider portal with direct case access
- **APROV-02**: OH report upload and tracking workflow

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full HRIS (holidays, expenses, timesheets) | Scope creep — absence management is the focus |
| Annual leave booking | Different domain, many competitors |
| Payroll integration | High complexity, regulatory burden |
| Medical diagnosis storage (ICD-10 codes) | Liability risk, broad categories sufficient |
| Performance management | Conflates health with performance, destroys trust |
| Time & attendance tracking | Surveillance connotation, contradicts values |
| Direct GP/NHS integration | Enormous regulatory burden, future phase |
| Mobile native app | Web-first, responsive design sufficient |
| Real-time chat | Not core to health workflow value |
| AI-powered guidance (LLM) | Architecture ready, but scripted templates for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| ORG-01 | Phase 1 | Pending |
| ORG-02 | Phase 1 | Pending |
| ORG-03 | Phase 1 | Pending |
| ORG-04 | Phase 1 | Pending |
| ORG-05 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| COMP-01 | Phase 1 | Pending |
| COMP-02 | Phase 1 | Pending |
| COMP-03 | Phase 1 | Pending |
| COMP-04 | Phase 1 | Pending |
| COMP-05 | Phase 1 | Pending |
| SICK-01 | Phase 2 | Pending |
| SICK-02 | Phase 2 | Pending |
| SICK-03 | Phase 2 | Pending |
| SICK-04 | Phase 2 | Pending |
| SICK-05 | Phase 2 | Pending |
| SICK-06 | Phase 2 | Pending |
| WRKF-01 | Phase 2 | Pending |
| WRKF-02 | Phase 2 | Pending |
| WRKF-03 | Phase 2 | Pending |
| WRKF-04 | Phase 2 | Pending |
| FIT-01 | Phase 2 | Pending |
| FIT-02 | Phase 2 | Pending |
| FIT-03 | Phase 2 | Pending |
| FIT-04 | Phase 2 | Pending |
| RTW-01 | Phase 2 | Pending |
| RTW-02 | Phase 2 | Pending |
| RTW-03 | Phase 2 | Pending |
| RTW-04 | Phase 2 | Pending |
| GUID-01 | Phase 2 | Pending |
| GUID-02 | Phase 2 | Pending |
| GUID-03 | Phase 2 | Pending |
| GUID-04 | Phase 2 | Pending |
| NOTF-01 | Phase 2 | Pending |
| NOTF-02 | Phase 2 | Pending |
| NOTF-03 | Phase 2 | Pending |
| NOTF-04 | Phase 2 | Pending |
| TRIG-01 | Phase 3 | Pending |
| TRIG-02 | Phase 3 | Pending |
| TRIG-03 | Phase 3 | Pending |
| ANAL-01 | Phase 3 | Pending |
| ANAL-02 | Phase 3 | Pending |
| ANAL-03 | Phase 3 | Pending |
| ANAL-04 | Phase 3 | Pending |
| ANAL-05 | Phase 3 | Pending |
| PROV-01 | Phase 3 | Pending |
| PROV-02 | Phase 3 | Pending |
| PROV-03 | Phase 3 | Pending |
| PROV-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
