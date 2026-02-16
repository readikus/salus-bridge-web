---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/page.tsx
  - components/landing/hero-section.tsx
  - components/landing/features-section.tsx
  - components/landing/how-it-works-section.tsx
  - components/landing/social-proof-section.tsx
  - components/landing/cta-section.tsx
  - components/landing/footer.tsx
  - components/landing/navbar.tsx
  - components/landing/waitlist-form.tsx
  - app/api/waitlist/route.ts
  - database/migrations/20260216000001_create_waitlist.ts
autonomous: true
must_haves:
  truths:
    - "Visiting / shows a polished landing page with hero, features, how-it-works, social proof, and CTA sections"
    - "User can submit their name and email to join the waitlist"
    - "Waitlist submissions are stored in the database"
    - "Login link navigates to /login"
    - "Page is responsive across mobile, tablet, and desktop"
  artifacts:
    - path: "app/page.tsx"
      provides: "Landing page composition (Server Component)"
    - path: "components/landing/waitlist-form.tsx"
      provides: "Client-side waitlist form with validation"
    - path: "app/api/waitlist/route.ts"
      provides: "POST endpoint for waitlist signups"
    - path: "database/migrations/20260216000001_create_waitlist.ts"
      provides: "waitlist table schema"
  key_links:
    - from: "components/landing/waitlist-form.tsx"
      to: "app/api/waitlist/route.ts"
      via: "fetch POST /api/waitlist"
    - from: "app/api/waitlist/route.ts"
      to: "database"
      via: "pool.query INSERT into waitlist"
---

<objective>
Build a complete marketing landing page at `/` for SalusBridge — replacing the Next.js boilerplate with a polished, conversion-focused page featuring hero, features, how-it-works, social proof, CTA sections, and a working waitlist form backed by a database table.

Purpose: This is the front door for app.salusbridge.com. It needs to communicate what SalusBridge does, build trust, and capture prospect interest via waitlist signups.
Output: Full landing page with working waitlist functionality.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/layout.tsx (root layout with Geist font)
@app/globals.css (current styles)
@middleware.ts (/ is already public)
@app/login/page.tsx (existing login page for reference)
@components/ui/button.tsx (shadcn Button)
@components/ui/input.tsx (shadcn Input)
@components/ui/label.tsx (shadcn Label)
@components/ui/card.tsx (shadcn Card)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create waitlist database migration and API endpoint</name>
  <files>
    database/migrations/20260216000001_create_waitlist.ts
    app/api/waitlist/route.ts
  </files>
  <action>
    1. Create Knex migration `database/migrations/20260216000001_create_waitlist.ts`:
       - Table: `waitlist`
       - Columns: `id` (uuid, PK, default gen_random_uuid()), `name` (varchar 255, not null), `email` (varchar 255, not null, unique), `created_at` (timestamp, default now())
       - Follow existing migration patterns in `database/migrations/`

    2. Run the migration:
       ```
       yarn knex migrate:up --knexfile database/knexfile.ts
       ```

    3. Create `app/api/waitlist/route.ts`:
       - POST handler accepting JSON `{ name: string, email: string }`
       - Validate name (non-empty, max 255) and email (valid format) using Zod
       - Insert into waitlist table using `pool.query()` with parameterised query (follow repository pattern from `providers/repositories/`)
       - Handle duplicate email gracefully: catch unique constraint violation (Postgres error code 23505), return 409 with friendly message "You're already on the waitlist!"
       - Return 201 on success with `{ message: "You've been added to the waitlist!" }`
       - Return 400 on validation failure, 500 on unexpected error
  </action>
  <verify>
    Run migration successfully. Test with:
    ```
    curl -X POST http://localhost:3000/api/waitlist -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com"}'
    ```
    Should return 201. Duplicate email should return 409.
  </verify>
  <done>Waitlist table exists in database. POST /api/waitlist accepts name+email, stores in DB, handles duplicates gracefully.</done>
</task>

<task type="auto">
  <name>Task 2: Build landing page sections and waitlist form</name>
  <files>
    app/page.tsx
    components/landing/navbar.tsx
    components/landing/hero-section.tsx
    components/landing/features-section.tsx
    components/landing/how-it-works-section.tsx
    components/landing/social-proof-section.tsx
    components/landing/cta-section.tsx
    components/landing/footer.tsx
    components/landing/waitlist-form.tsx
  </files>
  <action>
    **Brand palette** (evolved purple identity, soft and modern):
    - Primary purple: `#7C3AED` (violet-600) with lighter tints for backgrounds (`#F5F3FF` violet-50, `#EDE9FE` violet-100)
    - Accent: `#6D28D9` (violet-700) for hover states
    - Neutral text: slate-700/800/900
    - White backgrounds with subtle violet tint sections for visual rhythm
    - Rounded corners, generous whitespace, soft shadows

    **Product copy context** — SalusBridge is a UK-first B2B workplace health coordination platform that:
    - Streamlines sickness absence reporting and tracking
    - Automates return-to-work workflows
    - Enables early intervention support for employee wellbeing
    - Reduces HR admin burden and ensures compliance
    - Target audience: UK HR teams, People leads, Operations managers at SMEs and mid-market companies

    **Tone:** Friendly, reassuring, non-clinical. Modern SaaS. Focus on reducing anxiety and stigma around workplace health. Empathetic but professional.

    1. **`components/landing/navbar.tsx`** (Server Component):
       - Sticky top nav with white/blur background
       - SalusBridge logo text (bold, purple) on left
       - Right side: "Login" link (to /login) and "Join Waitlist" button (scrolls to #waitlist anchor)
       - Mobile: hamburger not needed for MVP, just show both buttons

    2. **`components/landing/hero-section.tsx`** (Server Component):
       - Large headline: "Workplace health, handled with care" or similar empathetic headline
       - Subheadline: 1-2 sentences explaining what SalusBridge does (coordination platform for sickness absence, return-to-work, early intervention)
       - Two CTAs: "Join the Waitlist" (primary, scrolls to #waitlist) and "Learn More" (secondary, scrolls to #features)
       - Optional: subtle decorative gradient or abstract shape in purple tones (CSS only, no images)
       - Generous vertical padding (py-24 lg:py-32)

    3. **`components/landing/features-section.tsx`** (Server Component, id="features"):
       - Section title: "Everything you need for employee wellbeing"
       - 3-column grid (1 col mobile) with 4-6 feature cards
       - Features to highlight:
         * Sickness absence tracking — simple reporting, real-time dashboards
         * Return-to-work workflows — automated processes, compliance-ready
         * Early intervention — spot patterns, trigger support before issues escalate
         * Employee self-service — reduce stigma with private, accessible tools
         * HR analytics — insights into trends, not just data
         * Compliance & audit — GDPR-ready, documented processes
       - Each card: lucide-react icon, title, 1-2 sentence description
       - Use Card component from shadcn or styled divs with subtle borders/shadows

    4. **`components/landing/how-it-works-section.tsx`** (Server Component):
       - Section title: "Simple to set up, powerful to use"
       - 3-step horizontal layout (stacked on mobile):
         * Step 1: "Connect your team" — Invite employees and managers to the platform
         * Step 2: "Streamline processes" — Automate absence reporting and return-to-work flows
         * Step 3: "Support your people" — Early intervention alerts and wellbeing insights
       - Numbered steps with subtle connecting line or arrow between them
       - Light violet background (`bg-violet-50`) to break visual rhythm

    5. **`components/landing/social-proof-section.tsx`** (Server Component):
       - Since this is pre-launch, use placeholder social proof:
         * "Trusted by forward-thinking HR teams across the UK" heading
         * 3 placeholder testimonial-style quotes (can be aspirational/example quotes clearly marked or stats like "Built for UK compliance", "GDPR-ready", "Launching 2026")
         * Or: "Built for" badges — UK businesses, GDPR compliant, NHS-aligned
       - Keep it honest — no fake testimonials. Use trust signals and product attributes instead.

    6. **`components/landing/cta-section.tsx`** (Server Component wrapper with client WaitlistForm):
       - id="waitlist" for anchor scrolling
       - Section with purple gradient background (`bg-gradient-to-br from-violet-600 to-purple-700`)
       - White text: "Be the first to know" heading
       - Subtext: "Join the waitlist for early access to SalusBridge"
       - Embeds the WaitlistForm component

    7. **`components/landing/waitlist-form.tsx`** ("use client"):
       - Uses React Hook Form + Zod (matching login page pattern)
       - Schema: name (string, min 1, max 255), email (string, email)
       - Two inputs (Name, Email) + Submit button, inline on desktop (flex-row), stacked on mobile
       - Styled for dark background context (white/light inputs, white text labels)
       - States: idle, submitting ("Joining..."), success ("You're on the list!"), error (show API error message)
       - On success: hide form, show success message with checkmark
       - On 409: show "You're already on the waitlist!" as a friendly message (not an error style)
       - Submits to POST /api/waitlist

    8. **`components/landing/footer.tsx`** (Server Component):
       - Simple footer: "© 2026 SalusBridge. All rights reserved."
       - Links: Privacy Policy (href="#"), Terms (href="#"), Contact (mailto:hello@salusbridge.com)
       - Subtle border-top, muted text colours

    9. **`app/page.tsx`** — Replace entirely:
       - Server Component that composes all sections in order: Navbar, Hero, Features, HowItWorks, SocialProof, CTA (with waitlist), Footer
       - Clean, minimal — just imports and renders sections
       - No "use client" on this file

    **Styling notes:**
    - Use Tailwind utility classes throughout (no custom CSS files)
    - All sections: max-w-7xl mx-auto for content containment with full-width backgrounds
    - Responsive: mobile-first, test at sm/md/lg breakpoints
    - Smooth scroll behaviour: add `scroll-smooth` to the page wrapper or html
    - Use lucide-react icons: Shield, HeartPulse, BarChart3, Users, ArrowRight, CheckCircle, Clock, FileCheck, Activity, etc.
  </action>
  <verify>
    Run `yarn dev` and visit http://localhost:3000. Verify:
    1. Full landing page renders with all 7 sections visible
    2. Page scrolls smoothly between sections
    3. "Join Waitlist" buttons scroll to the waitlist form
    4. "Login" link goes to /login
    5. Waitlist form submits successfully, shows success state
    6. Duplicate email submission shows friendly "already on waitlist" message
    7. Page looks good on mobile (Chrome DevTools responsive mode)
    8. No console errors, no TypeScript errors (`yarn tsc --noEmit`)
  </verify>
  <done>
    Landing page at / shows a polished, responsive marketing page with hero, features, how-it-works, social proof, CTA sections, and a working waitlist form. All purple brand identity. Login link works. Waitlist submissions stored in database.
  </done>
</task>

</tasks>

<verification>
1. `yarn tsc --noEmit` — no TypeScript errors
2. `yarn dev` — page loads at / without errors
3. Full visual check: all sections render, responsive at mobile/tablet/desktop
4. Waitlist form: submit name+email, verify 201 response and DB insertion
5. Duplicate email: verify 409 and friendly message
6. Navigation: Login link goes to /login, anchor scrolls work
</verification>

<success_criteria>
- Landing page at / is fully replaced with polished marketing content
- All 7 sections visible and styled with purple brand identity
- Waitlist form captures name + email to database
- Duplicate submissions handled gracefully
- Page is responsive across breakpoints
- No TypeScript or runtime errors
</success_criteria>

<output>
After completion, create `.planning/quick/2-build-the-landing-page-homepage/2-SUMMARY.md`
</output>
