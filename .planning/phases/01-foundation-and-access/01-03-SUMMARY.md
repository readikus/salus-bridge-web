---
phase: 01-foundation-and-access
plan: 03
subsystem: org-management
tags: [organisation, crud, tanstack-table, react-hook-form, zod, dashboard, rbac, shadcn]

# Dependency graph
requires:
  - phase: 01-01
    provides: "PostgreSQL schema (organisations, departments, employees), pg pool, audit logging"
  - phase: 01-02
    provides: "Auth0 session, RBAC permissions, AuthService, UserService, TenantService"
provides:
  - Organisation CRUD API (create, list, get, update) with audit logging
  - Organisation admin assignment and removal
  - Organisation settings management (absence thresholds, notifications)
  - Organisation dashboard stats (employee count, departments)
  - Department repository with findOrCreate for CSV import
  - Role-aware dashboard routing (platform admin, org admin, HR, manager, employee)
  - OrganisationList component with TanStack Table
  - OrganisationForm component with auto-slug generation
  - shadcn-style UI components (Button, Input, Label, Badge, Card, Table)
  - Client fetch action wrappers for all organisation endpoints
affects: [01-04-employee-management, 01-05-csv-import]

# Tech tracking
tech-stack:
  added: ["@tanstack/react-table", "@tanstack/react-query", "react-hook-form", "@hookform/resolvers", "@radix-ui/react-label", "@radix-ui/react-slot", "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-separator", "clsx"]
  patterns: [shadcn-style UI components with CVA variants, TanStack Table with sorting/pagination, React Hook Form with Zod resolver, auto-slug generation from name, role-aware server-side dashboard routing]

key-files:
  created:
    - providers/repositories/organisation.repository.ts
    - providers/repositories/department.repository.ts
    - providers/services/organisation.service.ts
    - schemas/organisation.ts
    - actions/organisations.ts
    - app/api/organisations/route.ts
    - app/api/organisations/[slug]/route.ts
    - app/api/organisations/[slug]/admins/route.ts
    - app/api/organisations/[slug]/settings/route.ts
    - app/(authenticated)/organisations/page.tsx
    - app/(authenticated)/organisations/new/page.tsx
    - app/(authenticated)/organisations/[slug]/page.tsx
    - app/(authenticated)/organisations/[slug]/admin-management.tsx
    - app/(authenticated)/organisations/[slug]/settings/page.tsx
    - components/organisation-list/index.tsx
    - components/organisation-form/index.tsx
    - components/ui/button.tsx
    - components/ui/input.tsx
    - components/ui/label.tsx
    - components/ui/badge.tsx
    - components/ui/card.tsx
    - components/ui/table.tsx
    - utils/cn.ts
  modified:
    - app/(authenticated)/dashboard/page.tsx
    - package.json

key-decisions:
  - "Organisation list uses server-side data fetching with client TanStack Table for sorting/pagination"
  - "Platform admin dashboard redirects to /organisations rather than rendering inline"
  - "Employee dashboard shows 4 cards (Profile, Absences, Documents, Wellbeing) to feel like a real product"
  - "Admin management uses inline form with router.refresh() for server component revalidation"

patterns-established:
  - "shadcn-style UI components: CVA for variants, cn() utility for class merging, forwardRef pattern"
  - "TanStack Table pattern: column helper, sorting state, pagination model"
  - "Organisation form: auto-slug from name, React Hook Form + Zod resolver"
  - "API route pattern: Auth0 session check -> AuthService permission validation -> service call -> audit log"

# Metrics
duration: 8min
completed: 2026-02-14
---

# Phase 1 Plan 3: Organisation Management Summary

**Organisation CRUD with admin assignment, TanStack Table list, settings page, and role-aware dashboards for all 5 user roles**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-14T12:15:00Z
- **Completed:** 2026-02-14T12:23:15Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Full organisation CRUD API with Zod validation, audit logging, and slug uniqueness checks (PLAT-01, PLAT-03)
- Organisation admin assignment/removal with find-or-create user by email (PLAT-02)
- Organisation settings page with absence trigger thresholds and notification preferences (ORG-05)
- Role-aware dashboard: platform admin redirects to orgs, org admin/HR sees stats, manager sees team summary, employee sees profile/absences/docs/wellbeing cards (ORG-04)
- TanStack Table organisation list with sortable columns, status badges, employee counts, and pagination
- shadcn-style UI component library (Button, Input, Label, Badge, Card, Table) with CVA variants

## Task Commits

Each task was committed atomically:

1. **Task 1: Organisation repositories, services, schemas, and API routes** - `3da4dba` (feat)
2. **Task 2: Organisation UI pages, dashboard, and components** - `2e4b7e2` (feat)

## Files Created/Modified
- `providers/repositories/organisation.repository.ts` - Organisation CRUD with findAll, findBySlug, getStats
- `providers/repositories/department.repository.ts` - Department queries with findOrCreate for CSV import
- `providers/services/organisation.service.ts` - Business logic: CRUD, admin assignment, dashboard stats, settings
- `schemas/organisation.ts` - Zod schemas for create/update org, settings, assign admin
- `actions/organisations.ts` - Client fetch wrappers for all organisation API endpoints
- `app/api/organisations/route.ts` - GET (list) and POST (create) with platform admin auth
- `app/api/organisations/[slug]/route.ts` - GET (detail) and PATCH (update) with permission checks
- `app/api/organisations/[slug]/admins/route.ts` - GET/POST/DELETE for admin management
- `app/api/organisations/[slug]/settings/route.ts` - GET/PATCH for org settings
- `app/(authenticated)/organisations/page.tsx` - Server component listing orgs with stats
- `app/(authenticated)/organisations/new/page.tsx` - Client form for creating organisations
- `app/(authenticated)/organisations/[slug]/page.tsx` - Org detail with stats cards and admin list
- `app/(authenticated)/organisations/[slug]/admin-management.tsx` - Client component for admin CRUD
- `app/(authenticated)/organisations/[slug]/settings/page.tsx` - Settings form with threshold/notification config
- `app/(authenticated)/dashboard/page.tsx` - Role-aware dashboard routing for all 5 user types
- `components/organisation-list/index.tsx` - TanStack Table with sorting, pagination, status badges
- `components/organisation-form/index.tsx` - React Hook Form with auto-slug generation
- `components/ui/button.tsx` - shadcn Button with CVA variants
- `components/ui/badge.tsx` - shadcn Badge with success/warning/destructive variants
- `components/ui/card.tsx` - shadcn Card with Header/Title/Description/Content/Footer
- `components/ui/table.tsx` - shadcn Table primitives
- `utils/cn.ts` - clsx + tailwind-merge utility

## Decisions Made
- Organisation list uses server-side data fetching (Server Component) with a client wrapper for TanStack Table interactivity
- Platform admin dashboard redirects to /organisations rather than rendering a separate dashboard view
- Employee dashboard shows 4 polished cards (My Profile, My Absences, My Documents, My Wellbeing) to feel like a real product even before Phase 2 features exist
- Admin management uses inline form with router.refresh() to revalidate the server component after mutations
- Settings page uses client-side form with useEffect fetch rather than server component to allow optimistic saves

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing shadcn UI components and dependencies**
- **Found during:** Task 2 (UI component creation)
- **Issue:** No shadcn components existed in the project. Missing clsx, @radix-ui/react-label, @radix-ui/react-slot, and other Radix primitives needed for Button/Input/Label/Badge/Card/Table
- **Fix:** Installed all required Radix UI and utility packages. Created shadcn-style UI components (Button, Input, Label, Badge, Card, Table) with CVA variants and cn() utility
- **Files modified:** package.json, yarn.lock, components/ui/*, utils/cn.ts
- **Verification:** TypeScript compiles cleanly, all components properly typed

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dependency installation and UI component scaffolding. These components are required by the plan's specified UI pages.

## Issues Encountered
None beyond the deviation listed above.

## User Setup Required
None - this plan builds on existing Auth0 and database infrastructure from Plans 01 and 02.

## Next Phase Readiness
- Organisation CRUD is complete, ready for employee management (Plan 04) to build on org context
- DepartmentRepository.findOrCreate() is ready for CSV import (Plan 05)
- Dashboard routing is extensible for future role-specific content
- shadcn UI components are available for reuse across all future UI work
- **Blocker:** Database migrations and Auth0 credentials must be configured (from Plans 01/02) before testing

## Self-Check: PASSED

All 23 key files verified present. All 2 task commits (3da4dba, 2e4b7e2) verified in git history.

---
*Phase: 01-foundation-and-access*
*Completed: 2026-02-14*
