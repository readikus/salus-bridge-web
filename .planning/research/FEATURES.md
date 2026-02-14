# Features Research: Workplace Health Coordination

**Domain:** Workplace health coordination / absence management SaaS
**Confidence:** MEDIUM (based on training data analysis of competitor landscape)

## Table Stakes

Features users expect from any workplace health / absence management platform. Missing these = users leave.

### Core Absence Tracking
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Sickness reporting (employee & manager initiated) | Medium | Auth, Org setup | Dual-path is essential — both employee self-report and manager-initiated |
| Absence calendar view | Medium | Absence data | Visual overview of team/org absences |
| Absence type categorisation | Low | Absence reporting | Sickness, medical appointment, injury, etc. |
| Duration tracking (start/end dates) | Low | Absence reporting | Auto-calculate working days lost |
| Absence history per employee | Low | Absence data | Chronological record with search/filter |

### Fit Note Management
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Fit note upload and storage | Medium | Document storage, RBAC | Secure storage with access control |
| Expiry tracking and alerts | Medium | Fit notes, notifications | Alert manager/HR when fit note expires |
| Status tracking (may be fit / not fit for work) | Low | Fit notes | UK-specific statuses per GP fit note format |

### Return-to-Work
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| RTW meeting scheduling/tracking | Medium | Absence, calendar | Track when RTW meeting occurred |
| RTW form/questionnaire | Medium | Forms, workflows | Structured questions for RTW conversation |
| RTW record storage | Low | Document storage | Audit trail of RTW outcomes |

### Manager Tools
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Manager dashboard (team overview) | Medium | RBAC, absence data | See team absence status at a glance |
| Notifications and task prompts | Medium | Events, notifications | "Employee X's fit note expires in 3 days" |
| Permission scoping (own team only) | Medium | RBAC, org hierarchy | Managers only see their direct reports |

### Organisation Admin
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Multi-tenant organisation containers | High | DB architecture | Row-level isolation with org_id |
| Employee import (CSV) | Medium | Validation, provisioning | With preview, duplicate detection, error reporting |
| Organisation settings | Low | Org model | Branding, defaults, preferences |
| Role management | Medium | Auth0, RBAC | Assign/revoke roles within org |
| Audit logging | High | Cross-cutting | Log all access to sensitive health data |

### Reporting & Analytics
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Absence rates (by team/department/org) | Medium | Absence data, analytics | Core metric for any absence platform |
| Bradford Factor calculation | Medium | Absence data | UK standard for monitoring short-term absence patterns |
| Trend reporting (month-over-month) | Medium | Historical data | Absence trends over time |
| CSV/PDF export | Low | Reporting data | Download reports for offline use |

### Compliance
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| UK GDPR special category data handling | High | Architecture-level | Consent, minimisation, lawful basis |
| Data retention policies | Medium | Config, background jobs | Auto-delete after configurable period |
| Consent management | Medium | Auth, user flows | Record and manage consent for health data |
| Secure document storage | Medium | Supabase Storage | Encrypted at rest, access-controlled |

## Differentiators

Features that set SalusBridge apart from competitors.

### Manager Guidance System (SalusBridge Core Differentiator)
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Scripted conversation workflows | High | Workflow engine | Step-by-step guidance for difficult conversations |
| AI-enhanced guidance (future) | High | LLM integration | Context-aware recommendations |
| Conversation templates by scenario | Medium | Content, workflows | Different guidance for mental health vs physical injury |
| Manager confidence scoring | Low | Analytics | Track manager engagement with guidance |

### Healthcare Provider Integration
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Occupational health provider portal | High | Multi-role auth | External provider access to relevant case data |
| Referral workflow | Medium | Workflows, notifications | Structured referral to OH/EAP providers |
| OH report tracking | Medium | Documents, workflows | Track referral → report → action cycle |

### Intelligent Absence Monitoring
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Trigger point configuration | Medium | Config, alerts | Configurable thresholds (e.g., 3 absences in 6 months) |
| Pattern detection | High | Analytics, historical data | Identify concerning patterns (e.g., Monday absences) |
| Predicted return dates | Medium | Absence data, benchmarks | Based on absence type and duration |
| Cost of absence calculation | Low | Absence data, salary config | Financial impact reporting |

### Employee Wellbeing
| Feature | Complexity | Dependencies | Notes |
|---------|-----------|--------------|-------|
| Self-service employee portal | Medium | Auth, RBAC | Employees manage their own absence records |
| Wellbeing check-ins | Medium | Workflows, notifications | Periodic check-ins during long-term absence |
| Workplace adjustment tracking | Medium | Workflows, forms | Track agreed adjustments and review dates |

## Anti-Features

Things to deliberately NOT build. Including these would dilute focus or create risk.

| Anti-Feature | Reason | Risk if Built |
|-------------|--------|---------------|
| Full HRIS (holidays, time-off, expenses) | Scope creep — absence management is the focus | Becomes generic HR tool, loses health focus |
| Annual leave booking | Different problem domain, many competitors | Dilutes the health/wellbeing positioning |
| Payroll integration | High complexity, regulatory burden | Massive scope increase for minimal MVP value |
| Medical diagnosis storage | Liability risk, not needed for workflow | Storing diagnosis codes creates unnecessary legal exposure |
| Performance management | Conflates health with performance | Undermines trust — employees won't use if linked to performance |
| Time & attendance tracking | Surveillance connotation | Contradicts "dignity and privacy" principle |
| Direct GP/NHS integration | Enormous regulatory and technical burden | Multi-year project on its own, defer to much later |
| Benefits administration | Different domain entirely | Scope creep |
| Employee surveillance/monitoring | Toxic to the product's values | Destroys trust, contradicts core mission |

## MVP Phasing Recommendation

### Phase 1: Core Loop
Org setup → absence reporting → calendar → fit notes → RTW workflow → manager dashboard → RBAC → audit logging

### Phase 2: Differentiation
Manager guidance scripts → trigger points → Bradford Factor → wellbeing check-ins → exports

### Phase 3: Scale
OH provider portal → pattern detection → cost reporting → integrations

## Feature Dependencies

```
Org Setup ──→ Employee Import ──→ Role Assignment
                                       │
                    ┌──────────────────┘
                    ▼
            Absence Reporting ──→ Absence Calendar
                    │                    │
                    ▼                    ▼
            Fit Note Tracking    Manager Dashboard
                    │                    │
                    ▼                    ▼
            RTW Workflow ◄────── Manager Guidance
                    │
                    ▼
            Analytics/Reporting
```

---
*Researched: 2026-02-14*
*Confidence: MEDIUM — based on domain analysis, not verified against current competitor product pages*
