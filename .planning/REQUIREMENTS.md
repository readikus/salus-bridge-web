# Requirements: SalusBridge

**Defined:** 2026-02-14
**Core Value:** An employee can report sickness and be guided through a complete return-to-work cycle — with their manager receiving structured, empathetic guidance at every step.

## v1.0 Requirements (Complete)

All shipped and verified across Phases 1-3.

### Platform & Organisation

- [x] **PLAT-01**: Platform admin can create a new organisation with name, slug, and settings
- [x] **PLAT-02**: Platform admin can assign an organisation administrator
- [x] **PLAT-03**: Platform admin can view system-wide organisation list and status
- [x] **ORG-01**: Organisation admin can import employees via CSV with validation preview, duplicate detection, and error reporting
- [x] **ORG-02**: Organisation admin can manually add, edit, and deactivate employee records
- [x] **ORG-03**: Organisation admin can assign roles (manager, HR, employee) to users within their organisation
- [x] **ORG-04**: Organisation admin can view organisation dashboard with employee count, active absences, and key metrics
- [x] **ORG-05**: Organisation admin can configure organisation settings (absence trigger thresholds, notification preferences)

### Authentication & Access

- [x] **AUTH-01**: Admin users (platform admin, org admin, HR, manager) can log in with email and password
- [x] **AUTH-02**: Employees receive magic link emails to access the platform without passwords
- [x] **AUTH-03**: Magic links are single-use with short expiry (15 minutes max)
- [x] **AUTH-04**: User sessions persist across browser refresh
- [x] **AUTH-05**: Role-based access control enforces 5-tier permissions (platform admin, org admin, HR, manager, employee)
- [x] **AUTH-06**: Managers can only view data for their direct reports
- [x] **AUTH-07**: All tenant-scoped data is isolated by organisation (row-level with RLS)

### Sickness Reporting

- [x] **SICK-01**: Employee can report their own sickness with absence type, start date, and optional notes
- [x] **SICK-02**: Manager can report sickness on behalf of a direct report
- [x] **SICK-03**: Sickness report captures absence type from broad categories (musculoskeletal, mental health, respiratory, surgical, other)
- [x] **SICK-04**: System tracks absence duration with start/end dates and auto-calculates working days lost (excluding weekends and UK bank holidays)
- [x] **SICK-05**: Employee and manager can view chronological absence history with search and filter
- [x] **SICK-06**: Manager can view absence calendar showing team absences at a glance

### Fit Note Management

- [x] **FIT-01**: Employee or HR user can upload fit note document (PDF/image) with secure storage
- [x] **FIT-02**: System captures structured fit note data: status (not fit / may be fit), duration, functional effects categories
- [x] **FIT-03**: System tracks fit note expiry dates and sends alerts to manager/HR before expiry
- [x] **FIT-04**: Fit note documents are accessible only to authorised roles (HR, org admin) via short-lived signed URLs

### Return-to-Work

- [x] **RTW-01**: Manager or HR can schedule a return-to-work meeting linked to a sickness case
- [x] **RTW-02**: System provides structured RTW questionnaire/form for the meeting
- [x] **RTW-03**: RTW meeting outcomes and agreed adjustments are recorded and stored
- [x] **RTW-04**: Completed RTW meeting closes the sickness case (or transitions to monitoring)

### Workflow Engine

- [x] **WRKF-01**: Sickness cases follow a defined state machine (REPORTED → TRACKING → FIT_NOTE_RECEIVED → RTW_SCHEDULED → RTW_COMPLETED → CLOSED)
- [x] **WRKF-02**: All state transitions are validated (only allowed transitions succeed)
- [x] **WRKF-03**: Every state transition is logged with timestamp, actor, from-state, to-state, and notes
- [x] **WRKF-04**: Long-term absences (configurable threshold) trigger escalation path

### Manager Guidance

- [x] **GUID-01**: Manager receives scripted conversation guidance appropriate to the absence scenario
- [x] **GUID-02**: Guidance is presented as step-by-step prompts during key workflow moments
- [x] **GUID-03**: Guidance content is empathetic, action-oriented, and compliant with UK employment best practice
- [x] **GUID-04**: System tracks which guidance a manager has engaged with

### Trigger Points & Monitoring

- [x] **TRIG-01**: Organisation admin can configure absence trigger thresholds (frequency, Bradford Factor, duration)
- [x] **TRIG-02**: System alerts manager/HR when an employee hits a configured trigger point
- [x] **TRIG-03**: Bradford Factor is calculated per employee and visible to managers and HR

### OH Provider Integration

- [x] **PROV-01**: Organisation admin can link external occupational health providers to their organisation
- [x] **PROV-02**: HR or manager can create an OH referral for a sickness case
- [x] **PROV-03**: Referral status is tracked (submitted → in progress → report received)
- [x] **PROV-04**: Communication between organisation and provider is logged

### Analytics & Reporting

- [x] **ANAL-01**: Organisation dashboard shows absence rates by team, department, and whole organisation
- [x] **ANAL-02**: Trend reporting shows month-over-month absence patterns
- [x] **ANAL-03**: Bradford Factor scores displayed per employee and aggregated by team
- [x] **ANAL-04**: Analytics enforce minimum cohort size (5+ people) to prevent re-identification
- [x] **ANAL-05**: Reports exportable as CSV and PDF

### Compliance & Audit

- [x] **COMP-01**: All access to health data is logged in an immutable audit trail (who, what, when, action)
- [x] **COMP-02**: Health data fields are encrypted at rest using AES-256-GCM
- [x] **COMP-03**: Notifications never reveal health details, employee names, or conditions in subject/body
- [x] **COMP-04**: Data visibility is role-appropriate: managers see dates + actions, HR sees health details, employees see their own records
- [x] **COMP-05**: Employees can view what data is held about them (SAR readiness)

### Notifications

- [x] **NOTF-01**: Manager receives notification when a direct report reports sick
- [x] **NOTF-02**: Manager/HR receives notification when a fit note is approaching expiry
- [x] **NOTF-03**: Employee receives notification when a RTW meeting is scheduled
- [x] **NOTF-04**: Notifications link to authenticated context without revealing health details

## v1.2 Requirements — Absence Timeline Engine

### Absence Timeline

- [ ] **TIME-01**: System tracks absence duration from start date and auto-triggers actions at configurable milestone points (default: Day 1, 3, 7, Week 2, 3, 4, 6, every 4 weeks, Week 52)
- [ ] **TIME-02**: Org admin can override default milestone timings for their organisation
- [ ] **TIME-03**: At Day 1, system sends responsibility notification to employee, manager, and assigned HR representative
- [ ] **TIME-04**: At Day 3, system notifies employee about GP visit and fit note requirements for absences over 7 days
- [ ] **TIME-05**: At Day 7, system transitions case to long-term absence, prompts fit note upload and expected return date
- [ ] **TIME-06**: At Weeks 2-3, system initiates check-in between manager/HR and employee, prompts fit note renewal if expired
- [ ] **TIME-07**: At Week 4, system prompts HR/manager to initiate GP or OH report request
- [ ] **TIME-08**: At Week 6, system prompts creation of Plan of Action
- [ ] **TIME-09**: Every 4 weeks from Week 10, system schedules mandatory evaluation meetings (Weeks 10, 14, 18, 22...)
- [ ] **TIME-10**: At Week 52, system triggers formal capability review process

### Communication

- [ ] **COMM-01**: Each sickness case has a communication log where manager/HR can record all contact with the employee (date, type, notes)
- [ ] **COMM-02**: Communication log entries are immutable and timestamped for audit purposes

### Compliance Dashboard

- [ ] **COMP-06**: Compliance dashboard shows red/yellow/green risk indicators per active case based on overdue milestone actions
- [ ] **COMP-07**: Dashboard shows escalating deadline alerts for upcoming milestones
- [ ] **COMP-08**: Manager/HR can view all active cases with compliance status at a glance

### GP Details & Consent

- [ ] **GP-01**: Employee can store their GP name and address
- [ ] **GP-02**: System provides a consent form for employee to grant permission for medical records access
- [ ] **GP-03**: Consent status is tracked and visible to HR

## v1.3 Requirements — Documents, Plans & Reviews

### Document Templates

- [ ] **DOC-01**: System provides standard document templates: GP report request, Plan of Action, meeting form, back-to-work report
- [ ] **DOC-02**: Templates auto-populate with case data (employee name, dates, absence details)
- [ ] **DOC-03**: Completed documents are stored against the sickness case

### Plan of Action

- [ ] **PLAN-01**: Manager and employee can collaboratively create a Plan of Action using the template
- [ ] **PLAN-02**: Both parties sign off with simple acknowledgement (timestamped "I agree")
- [ ] **PLAN-03**: Plan is versioned when updated at evaluation meetings

### Scheduling

- [ ] **SCHED-01**: System auto-schedules 4-weekly evaluation meetings from Week 10 onwards
- [ ] **SCHED-02**: Meeting participants receive notifications with agenda and preparation prompts

### Reports

- [ ] **REPORT-01**: HR can generate a one-click reintegration report aggregating timeline, fit notes, plans, meetings, and outcomes
- [ ] **REPORT-02**: Report is exportable as PDF

### Capability Review

- [ ] **CAP-01**: At Week 52, system initiates capability review with structured assessment form
- [ ] **CAP-02**: Outcome options: extend RTW plan, capability meeting and exit, or return with/without adjustments

## Future Requirements

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
| HRIS integration API | Explicitly out of scope per founder discussion |
| Annual leave booking | Different domain, many competitors |
| Payroll integration | High complexity, regulatory burden |
| Medical diagnosis storage (ICD-10 codes) | Liability risk, broad categories sufficient |
| Performance management | Conflates health with performance, destroys trust |
| Time & attendance tracking | Surveillance connotation, contradicts values |
| Direct GP/NHS integration | Enormous regulatory burden, future phase |
| Mobile native app | Web-first, responsive design sufficient |
| Real-time chat | Not core to health workflow value |
| AI-powered guidance (LLM) | Architecture ready, but scripted templates for now |
| Org-customisable document templates | Standard templates only for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| PLAT-02 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| ORG-01 | Phase 1 | Complete |
| ORG-02 | Phase 1 | Complete |
| ORG-03 | Phase 1 | Complete |
| ORG-04 | Phase 1 | Complete |
| ORG-05 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| AUTH-07 | Phase 1 | Complete |
| COMP-01 | Phase 1 | Complete |
| COMP-02 | Phase 1 | Complete |
| COMP-03 | Phase 1 | Complete |
| COMP-04 | Phase 1 | Complete |
| COMP-05 | Phase 1 | Complete |
| SICK-01 | Phase 2 | Complete |
| SICK-02 | Phase 2 | Complete |
| SICK-03 | Phase 2 | Complete |
| SICK-04 | Phase 2 | Complete |
| SICK-05 | Phase 2 | Complete |
| SICK-06 | Phase 2 | Complete |
| WRKF-01 | Phase 2 | Complete |
| WRKF-02 | Phase 2 | Complete |
| WRKF-03 | Phase 2 | Complete |
| WRKF-04 | Phase 2 | Complete |
| FIT-01 | Phase 2 | Complete |
| FIT-02 | Phase 2 | Complete |
| FIT-03 | Phase 2 | Complete |
| FIT-04 | Phase 2 | Complete |
| RTW-01 | Phase 2 | Complete |
| RTW-02 | Phase 2 | Complete |
| RTW-03 | Phase 2 | Complete |
| RTW-04 | Phase 2 | Complete |
| GUID-01 | Phase 2 | Complete |
| GUID-02 | Phase 2 | Complete |
| GUID-03 | Phase 2 | Complete |
| GUID-04 | Phase 2 | Complete |
| NOTF-01 | Phase 2 | Complete |
| NOTF-02 | Phase 2 | Complete |
| NOTF-03 | Phase 2 | Complete |
| NOTF-04 | Phase 2 | Complete |
| TRIG-01 | Phase 3 | Complete |
| TRIG-02 | Phase 3 | Complete |
| TRIG-03 | Phase 3 | Complete |
| ANAL-01 | Phase 3 | Complete |
| ANAL-02 | Phase 3 | Complete |
| ANAL-03 | Phase 3 | Complete |
| ANAL-04 | Phase 3 | Complete |
| ANAL-05 | Phase 3 | Complete |
| PROV-01 | Phase 3 | Complete |
| PROV-02 | Phase 3 | Complete |
| PROV-03 | Phase 3 | Complete |
| PROV-04 | Phase 3 | Complete |
| TIME-01 | Phase 4 | Pending |
| TIME-02 | Phase 4 | Pending |
| TIME-03 | Phase 5 | Pending |
| TIME-04 | Phase 5 | Pending |
| TIME-05 | Phase 5 | Pending |
| TIME-06 | Phase 5 | Pending |
| TIME-07 | Phase 5 | Pending |
| TIME-08 | Phase 5 | Pending |
| TIME-09 | Phase 5 | Pending |
| TIME-10 | Phase 5 | Pending |
| COMM-01 | Phase 5 | Pending |
| COMM-02 | Phase 5 | Pending |
| COMP-06 | Phase 6 | Pending |
| COMP-07 | Phase 6 | Pending |
| COMP-08 | Phase 6 | Pending |
| GP-01 | Phase 4 | Pending |
| GP-02 | Phase 4 | Pending |
| GP-03 | Phase 4 | Pending |

**Coverage:**
- v1.0 requirements: 58 total -- all complete
- v1.2 requirements: 18 total -- all mapped to Phases 4-6
- v1.3 requirements: 12 total -- pending future milestone
- Unmapped v1.2: 0

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-18 after v1.2 roadmap created*
