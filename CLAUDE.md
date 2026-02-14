
  Core Framework

  - Next.js 16 (App Router) with React 19
  - TypeScript 5.9 (strict: false, path alias @/* maps to project root)
  - Yarn package manager
  - Deployed on Vercel

  Database

  - PostgreSQL hosted on Supabase
  - Direct connection via pg (connection pool) — not the Supabase client SDK for queries
  - Knex for migrations only (not used as a query builder at runtime)
  - Migrations run one-at-a-time (migrate:up / migrate:down) with environment safety checks

  Data Layer — Service/Repository Pattern

  - Repositories (providers/repositories/) — static class methods, raw SQL via pool.query() with parameterised queries. Each entity gets its own repository file. SQL uses snake_case columns
  aliased to "camelCase" with AS.
  - Services (providers/services/) — business logic layer that orchestrates repositories
  - Actions (actions/) — client-side fetch wrappers (functions prefixed fetch*) that call API routes and return typed responses
  - API Routes (app/api/) — Next.js route handlers (the primary API layer, not tRPC)
  - tRPC is installed but mostly unused — API routes are the standard pattern

  Authentication & Authorisation

  - Auth0 (@auth0/nextjs-auth0 v4) for authentication
  - middleware.ts protects routes and manages sessions
  - Super admin role determined by hardcoded email list via UserService.isSuperAdmin()
  - tRPC procedures exist for publicProcedure, authenticatedProcedure, superAdminProcedure, companyAdminProcedure, companyMemberProcedure

  State Management

  - Zustand (v5) with auto-zustand-selectors-hook for stores (app/stores/)
  - React Query (@tanstack/react-query v5) for server state / data fetching caching
  - nuqs for URL state management

  UI

  - Tailwind CSS 3 with tailwind-merge and class-variance-authority
  - shadcn/ui components (Radix UI primitives underneath)
  - lucide-react for icons
  - Prettier: 120 char width, 2 space indent, trailing commas
  - ESLint 9 with Airbnb config + Prettier integration
  - Husky + lint-staged for pre-commit hooks

  Component Conventions

  - Directory structure: components/component-name/index.tsx
  - Props interface always named Props
  - Named exports for components
  - Favour Server Components, minimise 'use client'
  - Event handlers: handle*, loading states: isLoading, hasError

  Forms & Validation

  - React Hook Form (v7) with @hookform/resolvers
  - Zod for schema validation (schemas in schemas/)

  Tables

  - @tanstack/react-table (v8) for data tables with pagination

  Email

  - React Email for templates (emails/ directory)
  - SendGrid (@sendgrid/mail) for delivery

  Testing

  - Vitest (v3) for unit tests — jsdom environment, v8 coverage
  - Playwright for E2E tests (single worker)
  - Test files in tests/ directory (.test.ts for unit, .e2e.ts for E2E)

  Error Tracking

  - Sentry (@sentry/nextjs v10)

  External Integrations

  - Pipedrive — CRM for leads/deals
  - Supabase Storage — file uploads
  - Credit Safe — credit report API with caching

  Project Structure

  app/                    # Next.js App Router (pages, API routes, stores)
  actions/                # Client-side API action functions (fetch*)
  components/             # React components (component-name/index.tsx)
  providers/
    ├── repositories/     # Data access (raw SQL via pg pool)
    └── services/         # Business logic
  database/
    └── migrations/       # Knex migrations (timestamped)
  trpc/                   # tRPC setup (mostly unused, API routes preferred)
  schemas/                # Zod validation schemas
  types/                  # TypeScript type definitions
  interfaces/             # TypeScript interfaces
  constants/              # Shared constants
  hooks/                  # Custom React hooks
  utils/                  # Utility functions
  emails/                 # React Email templates
  tests/                  # Unit + E2E tests



