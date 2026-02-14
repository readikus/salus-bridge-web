# Phase 1: Foundation & Access - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-tenant platform with authentication, RBAC, compliance infrastructure, and organisation/employee management. Platform admin can create organisations, org admins can onboard employees, and all users can securely access the platform with role-appropriate permissions — built on a compliance-ready foundation with audit logging and data isolation.

</domain>

<decisions>
## Implementation Decisions

### Organisation management
- Organisations can have multiple org admins (not limited to one)
- Org admin assignment and org creation details are at Claude's discretion for MVP

### Employee onboarding & CSV import
- Employee fields (MVP): name, email, job title, department, manager — core only
- CSV duplicate detection: skip duplicate rows and show them in a post-import summary (do not update existing records)
- Manager relationship: select from list when creating manually; manager email column in CSV with automatic linking and flagging of unmatched references
- CSV validation UX: Claude's discretion on preview-first vs import-valid-flag-invalid

### Role experience & permissions
- Shared layout with filtered navigation — all roles use the same shell, menu items show/hide per role
- Multiple roles allowed per user — permissions are additive (e.g. someone can be both manager and HR)
- Manager scope includes full reporting chain — a manager sees their direct reports AND everyone below them in the hierarchy
- Employee Phase 1 experience: dashboard shell with profile access and placeholder sections for future features (sickness workflow, etc.)

### Employee magic link access
- Invitation-based, not passwordless: first access is via magic link invitation, employee sets a password, future logins use email/password
- Admin triggers invitations manually — employees are not auto-invited on creation (supports bulk or individual send)
- First-time flow: click magic link → set password page → straight to dashboard (no profile review step)
- Magic link invitations expire after 7 days; admin can resend if expired

### Claude's Discretion
- Organisation creation form fields and flow (minimal vs structured)
- Org admin assignment flow (during creation vs separate step)
- Organisation list view design (table vs cards, information density)
- CSV validation UX approach (preview-all-errors vs import-valid-flag-invalid)
- Loading states, empty states, and error handling patterns
- Exact navigation structure and sidebar design

</decisions>

<specifics>
## Specific Ideas

- Admin users (platform admin, org admin) authenticate with email/password via Auth0
- Employees authenticate via invitation magic link → password setup → email/password thereafter
- The platform already uses Auth0 (@auth0/nextjs-auth0 v4) — build on existing auth infrastructure
- Dashboard shell for employees should feel like a real product even in Phase 1, not a placeholder page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-access*
*Context gathered: 2026-02-14*
