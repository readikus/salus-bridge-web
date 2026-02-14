---
phase: 01-foundation-and-access
plan: 02
subsystem: auth
tags: [auth0, rbac, rls, middleware, invitation, magic-link, zustand, next.js]

# Dependency graph
requires:
  - phase: 01-01
    provides: "PostgreSQL schema (users, user_roles, employees), pg pool, audit logging, RLS policies"
provides:
  - Auth0 SDK v4 middleware for session management and route protection
  - User and UserRole repositories with parameterised SQL
  - AuthService for login callback orchestration and session hydration
  - TenantService.withTenant() for RLS session variable setting
  - 5-tier RBAC with role-to-permission mapping and hasPermission utility
  - Employee invitation flow with 7-day expiry single-use tokens
  - Set password page with Auth0 Management API user creation
  - Notification privacy utilities for COMP-03 scaffolding
  - Client-side useAuth hook with role-aware permission checks
  - useTenant hook with Zustand store for org switching
  - Authenticated layout with role-filtered sidebar navigation
affects: [01-03-org-management, 01-04-employee-management, 01-05-rbac]

# Tech tracking
tech-stack:
  added: ["@auth0/nextjs-auth0 v4.15.0", zustand v5.0.11]
  patterns: [Auth0 SDK v4 middleware pattern, role-filtered navigation, TenantService.withTenant() for RLS context, static service classes for auth orchestration]

key-files:
  created:
    - middleware.ts
    - app/api/auth/[auth0]/route.ts
    - app/api/auth/me/route.ts
    - app/api/auth/invite/route.ts
    - app/api/auth/set-password/route.ts
    - app/invite/[token]/page.tsx
    - app/invite/[token]/set-password/page.tsx
    - app/(authenticated)/layout.tsx
    - app/(authenticated)/dashboard/page.tsx
    - providers/repositories/user.repository.ts
    - providers/repositories/user-role.repository.ts
    - providers/repositories/employee.repository.ts
    - providers/services/user.service.ts
    - providers/services/auth.service.ts
    - providers/services/tenant.service.ts
    - providers/services/invitation.service.ts
    - hooks/use-auth.ts
    - hooks/use-tenant.ts
    - app/stores/tenant-store.ts
    - types/auth.ts
    - constants/roles.ts
    - constants/permissions.ts
    - constants/notification-privacy.ts
    - schemas/auth.ts
    - components/sidebar/index.tsx
    - components/sidebar/nav-items.ts
  modified:
    - app/layout.tsx
    - package.json

key-decisions:
  - "Auth0 SDK v4 uses middleware-based route handling (not handleAuth from v3)"
  - "Auth routes at /auth/* (Auth0 v4 default) not /api/auth/* for login/logout/callback"
  - "Custom /api/auth/me endpoint for client-side session hydration with roles"
  - "Auth0 Management API used directly for password setup (not SDK helper)"
  - "Zustand installed for tenant state management"

patterns-established:
  - "Auth0 v4 middleware pattern: auth0.middleware(request) in middleware.ts handles all auth routes"
  - "TenantService.withTenant() wraps all org-scoped queries with RLS context"
  - "useAuth hook: client-side auth state combining Auth0 session with local role data"
  - "Role-filtered navigation: shared layout with NAV_ITEMS filtered by user roles"
  - "API permission checks: AuthService.validateAccess() before data operations"

# Metrics
duration: 7min
completed: 2026-02-14
---

# Phase 1 Plan 2: Auth & RBAC Summary

**Auth0 v4 authentication with 5-tier RBAC, tenant RLS context, magic link invitation flow, and role-filtered navigation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-14T12:04:07Z
- **Completed:** 2026-02-14T12:11:48Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments
- Auth0 SDK v4 integration with middleware-based session management and route protection
- Complete RBAC system: 5-tier role hierarchy, permission mapping, hasPermission utility, and API-level enforcement
- TenantService.withTenant() bridges application code to PostgreSQL RLS policies via session variables
- Full employee invitation flow: token generation, validation, password setup via Auth0 Management API, and invitation acceptance
- Branded set-password page with real-time validation as employee's first platform impression
- Authenticated layout with sidebar navigation filtered by user roles
- Notification privacy scaffolding (COMP-03): sanitization, validation, and safe subject builder utilities
- Client-side useAuth and useTenant hooks for role-aware state management

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth0 integration with user sync and tenant context** - `58a9c56` (feat)
2. **Task 2: RBAC enforcement, role permission checks, and employee invitation flow** - `741fbbc` (feat)

## Files Created/Modified
- `middleware.ts` - Auth0 v4 middleware for session and route protection
- `app/api/auth/[auth0]/route.ts` - Catch-all fallback for Auth0 routes
- `app/api/auth/me/route.ts` - GET endpoint returning SessionUser with roles
- `app/api/auth/invite/route.ts` - POST endpoint for bulk employee invitations
- `app/api/auth/set-password/route.ts` - POST endpoint for invitation password setup
- `app/invite/[token]/page.tsx` - Server component validating invitation tokens
- `app/invite/[token]/set-password/page.tsx` - Branded password setup form
- `app/(authenticated)/layout.tsx` - Authenticated layout with role-filtered sidebar
- `app/(authenticated)/dashboard/page.tsx` - Dashboard landing page
- `app/layout.tsx` - Root layout wrapped with Auth0Provider
- `providers/repositories/user.repository.ts` - User CRUD with parameterised SQL
- `providers/repositories/user-role.repository.ts` - User role queries with org JOIN
- `providers/repositories/employee.repository.ts` - Invitation-related employee queries
- `providers/services/user.service.ts` - findOrCreateFromAuth0, isSuperAdmin, assignRole
- `providers/services/auth.service.ts` - Login callback, session hydration, permission validation
- `providers/services/tenant.service.ts` - RLS session variable management
- `providers/services/invitation.service.ts` - Token generation, validation, acceptance
- `hooks/use-auth.ts` - Client auth hook with permission checks
- `hooks/use-tenant.ts` - Client tenant context hook
- `app/stores/tenant-store.ts` - Zustand store for org switching
- `types/auth.ts` - SessionUser, UserRoleWithOrg, Auth0Profile interfaces
- `constants/roles.ts` - Role hierarchy and super admin email list
- `constants/permissions.ts` - Permission constants and hasPermission utility
- `constants/notification-privacy.ts` - COMP-03 sanitization/validation utilities
- `schemas/auth.ts` - Zod schemas for password and invitation validation
- `components/sidebar/index.tsx` - Sidebar navigation component
- `components/sidebar/nav-items.ts` - Role-to-navigation-item mapping

## Decisions Made
- Auth0 SDK v4 uses middleware-based route handling at `/auth/*` paths (v4 default), not the v3 `handleAuth()` pattern at `/api/auth/*`
- Custom `/api/auth/me` endpoint created for client-side auth state hydration (Auth0 v4 profile endpoint only returns Auth0 data, not local roles)
- Auth0 Management API called directly via fetch for user creation during password setup (no SDK helper for this in v4)
- Zustand added for tenant state management (per CLAUDE.md tech stack)
- Case-insensitive email matching in UserRepository.findByEmail using LOWER()

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Auth0 SDK v4 API differs from plan assumptions**
- **Found during:** Task 1 (Auth0 route handler creation)
- **Issue:** Plan specified `auth0.handleAuth()` which was the v3 API. Auth0 v4 uses `auth0.middleware()` and handles routes at `/auth/*` not `/api/auth/*`
- **Fix:** Updated to v4 middleware pattern. Auth routes handled by middleware at `/auth/*`. The `[auth0]` catch-all route kept as a fallback but middleware handles actual auth flows.
- **Files modified:** `middleware.ts`, `app/api/auth/[auth0]/route.ts`
- **Verification:** TypeScript compiles, middleware correctly intercepts auth routes

**2. [Rule 3 - Blocking] Zustand not installed**
- **Found during:** Task 2 (tenant store creation)
- **Issue:** CLAUDE.md lists Zustand as a dependency but it was not in package.json
- **Fix:** Installed zustand v5.0.11
- **Files modified:** `package.json`, `yarn.lock`
- **Verification:** TypeScript compiles, store module resolves correctly

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correct SDK usage and dependency resolution. No scope creep.

## Issues Encountered
None beyond the deviations listed above.

## User Setup Required

Before Auth0 authentication will work, the user needs to:

1. **Create an Auth0 application** (Regular Web Application type)
2. **Update `.env.local`** with Auth0 credentials:
   ```
   AUTH0_SECRET=<random 32+ char string>
   AUTH0_DOMAIN=<your-tenant>.auth0.com
   AUTH0_CLIENT_ID=<application client id>
   AUTH0_CLIENT_SECRET=<application client secret>
   APP_BASE_URL=http://localhost:3000
   ```
3. **For invitation flow** — configure Auth0 Management API:
   ```
   AUTH0_MANAGEMENT_CLIENT_ID=<management api client id>
   AUTH0_MANAGEMENT_CLIENT_SECRET=<management api client secret>
   ```
4. **Configure Auth0 Application settings:**
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
5. **Run database migrations** (if not already done from Plan 01)

## Next Phase Readiness
- Auth infrastructure complete: login, logout, session persistence, role loading
- RBAC system ready for enforcement in Plan 03 (org management) and Plan 04 (employee management)
- TenantService.withTenant() ready for all org-scoped data queries
- Invitation flow ready: token generation, validation, password setup, acceptance
- Client-side hooks ready for UI consumption
- **Blocker:** Auth0 credentials and database migrations must be configured before testing

## Self-Check: PASSED

All 27 key files verified present. All 2 task commits (58a9c56, 741fbbc) verified in git history.

---
*Phase: 01-foundation-and-access*
*Completed: 2026-02-14*
