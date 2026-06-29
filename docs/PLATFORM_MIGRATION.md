# Platform Migration: Best in Class Rebuild (Strangler Fig)

**Version:** 1.0 (28 June 2026). First draft for review.
**Audience:** Claude Code and the founder, working in
`altogetheragile/altogether-home-base`.
**Status:** Proposed, not started. Read alongside `TOOLS.md` (tool inventory),
`VISION_TO_VALUE.md` (pipeline) and `CLAUDE.md` (conventions).

**Goal in one line:** move the site to a server-rendered framework so that
security, SEO and maintainability stop being things we retrofit and start being
things the architecture guarantees, without ever taking the live site down.

---

## 0. Status at a Glance

| Phase | What it delivers | State |
|---|---|---|
| 0: Harden and Skeleton | Safety on the current app + a Next.js app live alongside | In progress (skeleton built + deployed to preview) |
| 1: Content Surface | Blog, exams, courses, events, home server-rendered in Next.js | In progress (EXAMS, BLOG and COURSES/EVENTS CUT OVER and live; home + marketing remain) |
| 2: Interactive Tools | Tools moved into Next.js (or routed to, if left in place) | Not started |
| 3: Retire the Shell | `prerender.mjs` and the old SPA removed; one stack remains | Not started |

Each phase is shippable on its own. We can pause after any phase with a live,
improved site. Nothing in Phase 1 to 3 begins until Phase 0 has shipped.

---

## 1. Why We Are Doing This

The site began as a client-rendered Vite single page app. SEO was added afterward
by `scripts/prerender.mjs`, which string-injects metadata and (recently) body
content into a static homepage shell. That retrofit is the root cause of the
issues we have been fixing one at a time:

- Every page shipped the homepage hero in its body, so content looked thin and
  duplicate to Google ("Crawled, currently not indexed").
- `/courses` was an orphan URL (in the prerender list and sitemap, but with no
  route in the app), which served a soft 404.
- FAQ copy is mirrored by hand between the React page and the prerender script.
- The fix relies on a fragile regex injecting HTML into a shell.

These are not bad fixes. They are a category of problem that a server-rendered
framework removes entirely. The aim of this plan is to remove the category, not
keep patching instances of it, and to harden the rest of the stack to the same
standard before traffic arrives.

**Non-goals.** This is not a redesign. The visual design, brand, copy, content
model (Supabase) and the tools themselves are kept. This is an architecture and
rendering change, plus security and quality hardening.

---

## 2. Target Architecture

**One framework, two surfaces: Next.js (App Router) on Vercel.**

The app is really two products in one codebase, and each should be rendered as
what it is:

- **Content surface** (home, blog, courses, exams, events): statically generated
  and server-rendered, revalidated when content changes (ISR). Real HTML per
  route. This is where SEO lives.
- **Tools surface** (canvas apps, coaching studios, flow game, backlog, impact
  map and so on): client components, auth aware, no SEO need.

Why Next.js: it is Vercel native (no hosting change), it serves both surfaces in
one app, it has first class SEO primitives (`generateMetadata`, file based
`sitemap` and `robots`, streaming SSR), and it is the most hireable stack if help
is ever brought in. Most of the existing React and shadcn component code ports
with modest changes.

**What stays exactly as it is:**

- Supabase (Postgres, Auth, Row Level Security, Storage, Edge Functions) as the
  backend and content store.
- Claude via Supabase Edge Functions for AI (`callClaudeJSON`), key server side,
  auth gated.
- Vercel hosting and push to deploy.
- TypeScript, shadcn/ui, Tailwind and the CSS variable design tokens.
- The feature flag pattern (`SiteSettingsRouteGuard`).

**What changes:**

- Rendering: client SPA plus `prerender.mjs` becomes framework SSR/SSG.
- Data fetching for content: moves server side (Next server components and route
  handlers using a server Supabase client).
- Metadata, JSON-LD, sitemap and robots: generated from routes and data, colocated
  with each page, replacing `prerender.mjs` and any `Helmet`/`SEOHead` duplication.

---

## 3. Principles Baked Into Every Phase

These are the non-negotiables. Each phase is reviewed against them, not just
against "does it work".

### Security

- Row Level Security on every table. The database is the last line of defense, not
  the client. Audit and document each table's policies.
- Secrets only ever server side. The Supabase service role key and
  `ANTHROPIC_API_KEY` are never reachable from the browser. Public env vars hold
  nothing sensitive.
- Auth with httpOnly cookies via `@supabase/ssr`. Admin and role checks enforced
  on the server (in server components, route handlers and edge functions), not
  only by hiding client routes.
- Input validation with Zod at every server boundary, including all AI inputs.
- Rate limiting on AI and auth endpoints (Vercel or Upstash). This matters most
  when traffic arrives: it caps both abuse and the Claude bill.
- Security headers and a Content Security Policy. Dependency scanning (Renovate
  plus `npm audit`) runs in CI.

### SEO

- Routes are the only source of page truth. An orphan URL like `/courses` is
  impossible by construction.
- Content is server rendered. No shell body, no thin or duplicate content.
- Metadata, JSON-LD, canonical, sitemap and robots are generated from the routes
  and data, colocated per page. No separate prerender script to drift.
- Core Web Vitals come from the framework (image and font optimization, code
  splitting), replacing the hand tuning in the current app.
- Redirects live in config and are tested.

### Maintainability and Robustness

- One source of truth for routes and metadata.
- Typed end to end: TypeScript, generated Supabase types, Zod at the edges.
- A test pyramid that blocks merges in CI: unit (Vitest), end to end (Playwright),
  and a sitemap smoke crawl that fails on any soft 404. The orphan URL guard
  becomes native and permanent.
- A preview deploy per pull request (Vercel provides this). Nothing reaches
  production unreviewed.
- Observability: error tracking (Sentry), uptime monitoring, and structured logs
  in edge functions, so problems are seen before a user reports them.

---

## 4. Phase 0: Harden and Skeleton

**Outcome:** the current app is materially safer and better monitored, and a
Next.js app is live on a subdomain or preview, sharing Supabase and auth. Ships
value on day one and de-risks everything after.

This phase does not move any user facing page yet. It is reversible and additive.

### 4a. Harden the current app (carries into the new one)

1. Route and sitemap guard: a build step that fails if any prerendered or sitemap
   URL has no matching route (the `/courses` class of bug). Plus a Playwright
   smoke crawl of the live sitemap that fails on a soft 404.
2. Row Level Security audit: enumerate every table, confirm policies, document
   gaps, fix them. Write down the intended access model per table.
3. Rate limiting on the AI edge functions and auth.
4. Security headers and a Content Security Policy in `vercel.json` (building on
   the headers already there).
5. Dependency scanning (Renovate or Dependabot) plus `npm audit` in CI, and a CI
   pipeline that runs type check, lint, tests and `tsc -b --force` on every PR.
6. Error tracking (Sentry) and uptime monitoring wired in.

### 4b. Stand up the Next.js skeleton

1. Create the Next.js (App Router) app in the repo (or a sibling), sharing the
   Supabase project, env management and design tokens.
2. Port the shared UI foundation: Tailwind config, design tokens, shadcn
   components, fonts.
3. Set up the server Supabase client (`@supabase/ssr`), typed from the live
   schema.
4. Establish the SEO primitives once: `generateMetadata` helper, file based
   `sitemap.ts` and `robots.ts`, a JSON-LD helper, canonical strategy.
5. Deploy it to a preview URL so it is real and testable, serving nothing public
   yet.

**Exit criteria:** the guard, RLS audit, rate limiting, CSP, CI and monitoring are
live on the current app, and the Next.js skeleton renders a styled placeholder
page from real Supabase data on a preview URL.

---

## 5. Phase 1: Content Surface to SSR/SSG

**Outcome:** the SEO critical pages are served by Next.js, server rendered, with
metadata and structured data generated from data. This is the largest SEO and
security win and the reason the project exists.

Migrate one section at a time. Each section cuts over independently via Vercel
routing, and each is verified live before the next begins.

Suggested order (lowest risk and clearest win first):

1. **Exams** (`/exams`, `/exams/[slug]`): already the focus of recent SEO work,
   self contained, public, clear content. Good first proof.
2. **Blog** (`/blog`, `/blog/[slug]`): full articles, strong SEO value.
3. **Courses and Events** (`/events`, `/courses/[id]`): the catalogue and detail
   pages, with the `/courses` redirect preserved.
4. **Home and remaining marketing pages** (`/about`, `/coaching`,
   `/testimonials`, `/contact`).

**Progress:** both exam routes are built and live on the preview app.
- `/exams` listing: server component, ported shadcn primitives (`cn`/`Button`/
  `Card`), `buildMetadata`, FAQPage + BreadcrumbList + ItemList JSON-LD, FAQ from a
  single source.
- `/exams/[slug]` detail: server component owns SEO (generateMetadata, content
  shell, Quiz + BreadcrumbList JSON-LD; no answers server-rendered). Client
  `ExamPlayer` ports the core flow (timed/revision mode, single+multi answers,
  timer, flag, navigation, scored review, save-attempt). Verified deployed: SSR
  shell correct and questions load client-side with no errors.

**Before the exams cutover:**
1. DONE - Shared chrome ported: layout fetches `site_settings` once and renders a
   client `Navigation` (logo, feature-flag-gated links, Resources dropdown, mobile
   menu, Sign In) and server `Footer` (quick links, contact, social, legal). The
   Next exam pages now match the live site visually.
2. Optional fidelity: Practitioner matching-grid / scenario-tab UI and rich
   markdown scenario (sequential rendering already scores every type correctly).
3. DONE - Cutover (2026-06-29): the live `/exams` and `/exams/:slug*` are rewritten
   to the Next app in the root `vercel.json` (before the SPA catch-all), with
   `/_next/:path*` also rewritten so assets stay same-origin. `/exams*` gets a
   Next-compatible CSP (inline hydration scripts allowed); every other path keeps
   the strict CSP. `prerender.mjs` no longer writes the exam HTML (it would shadow
   the rewrite) but still generates the OG images. Verified live: Next-served,
   hydrates, player works, 0 CSP violations, non-exam pages unaffected.

**Blog cutover (2026-06-29):** `/blog` and `/blog/:path*` rewritten to the Next
app; `/blog` added to the Next-CSP source (`/(exams|blog)(/.*)?`) and excluded from
the strict CSP (`/((?!exams|blog).*)`); `prerender.mjs` no longer writes blog HTML.
`/blog` listing is a server component with a client category filter; `/blog/[slug]`
is server-rendered with `generateMetadata` (og:article + featured image), BlogPosting
+ BreadcrumbList JSON-LD, and content rendered from stored HTML or markdown (scripts/
inline handlers stripped) with ported prose styling. Verified live: Next-served,
listing filter hydrates, articles render full content, 0 CSP violations, all the
legacy `/blog/*` 301 redirects still resolve, non-blog pages unaffected.

**Courses/events cutover (2026-06-29):** `/events` (exact) and `/courses/:path*`
rewritten to the Next app; both added to the Next-CSP source and excluded from the
strict CSP; `prerender.mjs` no longer writes `/events` or `/courses/<id>` HTML.
`/events` is a server listing (teal hero + client filter, Course ItemList JSON-LD,
top approved testimonial per card); `/courses/[id]` is a server course page
(`generateMetadata`, Course + BreadcrumbList JSON-LD, About/outcomes/benefits/
audience/prerequisites, sidebar listing upcoming scheduled dates that link to the SPA
`/events/:id` to register, or an enquire CTA). Scope split: `/events/:id` (auth-gated
registration) and `/events/learn/:slug` (self-paced player) STAY on the SPA - verified
they need no Calendly/Credly/ipify/iframe sources, so the Next CSP covers them safely.
Verified live: Next-served, filter hydrates, course pages render, 0 CSP violations,
home keeps the strict CSP, `/courses` and `/schedule` 301s preserved.

**The cutover mechanism, reusable for the last vine (home + marketing):**
rewrite `/<section>*` + `/_next/*` to the Next app before the SPA catch-all; give
that section a Next-compatible CSP via a path-scoped header rule and add it to the
strict-CSP negative lookahead (now `/((?!exams|blog).*)`); stop prerendering that
section's HTML so the rewrite is reached; keep its sitemap entries (the sitemap is
the `api/sitemap.xml.ts` function). Reversible by removing the rewrites.

For each section:

1. Build the route(s) in Next.js as server components reading from Supabase.
2. Generate metadata, JSON-LD, canonical per page with `generateMetadata`.
3. Add the routes to the Next `sitemap.ts` and remove them from the old
   `prerender.mjs` and sitemap.
4. Route the path(s) to the Next app at the edge (Vercel routing), keeping the old
   app serving everything not yet migrated.
5. Verify live: real HTML, correct metadata and JSON-LD, no soft 404, no
   regression in Core Web Vitals. Request indexing where useful.

**Exit criteria:** every content page is served by Next.js, server rendered, and
the old prerender no longer generates content pages.

---

## 6. Phase 2: Interactive Tools

**Outcome:** the tools live in the new stack (or are cleanly routed to from it),
with shared auth and a single design system.

The tools do not need SEO, so there is no urgency and no rendering change is
forced. Two options, decided per tool:

- **Migrate** the tool into Next.js as client components. Preferred for tools that
  share a lot of UI or data with the content surface, or that we want under one
  stack for maintainability.
- **Leave and route** the tool in the existing app and route to it. Acceptable for
  complex, stable tools where a move is high effort and low benefit, as long as
  auth and design stay consistent.

Auth and session must be shared across both stacks for the routed option to feel
seamless. This is the part of the strangler approach that needs the most care and
is planned explicitly here.

**Exit criteria:** every tool is reachable, auth aware and on brand, whether
migrated or routed, with a documented decision per tool.

---

## 7. Phase 3: Retire the Shell

**Outcome:** one stack. The old Vite SPA and `prerender.mjs` are removed.

1. Confirm nothing public is still served by the old app (or only the tools we
   deliberately left, now formally owned).
2. Delete `prerender.mjs`, the static shell hacks and any `Helmet`/`SEOHead`
   duplication.
3. Consolidate routing so Next.js owns the domain.
4. Final full audit against the Section 3 principles: security, SEO,
   maintainability.

**Exit criteria:** `prerender.mjs` is gone, there is one source of route truth,
and the Section 3 checklist passes end to end.

---

## 8. Cross Cutting Checklists

### Security sign off (run at the end of each phase)

- [ ] RLS on every table touched, policies documented
- [ ] No secret reachable from the browser
- [ ] Server enforced auth and role checks on every protected route and function
- [ ] Zod validation at every server boundary, including AI inputs
- [ ] Rate limiting on AI and auth
- [ ] CSP and security headers present and tested
- [ ] Dependencies scanned, no known high or critical issues

### SEO sign off

- [ ] Server rendered HTML for the page, verified by viewing source
- [ ] Title, description, canonical, OG and JSON-LD correct and unique
- [ ] In the sitemap, not an orphan, no soft 404
- [ ] Core Web Vitals not regressed
- [ ] Redirects for any changed URL, tested

### Maintainability sign off

- [ ] Routes are the source of truth, no second list
- [ ] Typed end to end
- [ ] Unit and end to end tests, including the sitemap smoke crawl, green in CI
- [ ] Preview deploy reviewed before merge

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Two stacks during the transition adds complexity | Edge routing keeps the seam at the URL level; shared Supabase and auth; migrate in small, verified sections |
| Shared auth and session across two apps | Solve and verify this once in Phase 0/2 before any tool depends on it; httpOnly cookies via `@supabase/ssr` |
| A migrated page regresses SEO | Section 8 SEO sign off per page, verify live before cutover, keep the old version one route away until confirmed |
| Scope creep into a redesign | Non-goal stated in Section 2; design and content are carried, not changed |
| Cost growth at scale | Rate limiting on AI and auth; monitor Supabase and Vercel tiers; ISR reduces server work |
| Migration stalls midway | Every phase and section is shippable; pausing leaves a live, improved site |

---

## 10. Open Questions and Decisions Log

**Decided** (the founder has asked that best practice recommendations be taken as
the default, so the open questions below are resolved to the recommended option):

- Approach: strangler fig (incremental), not a big bang rewrite.
- Framework: Next.js (App Router) on Vercel.
- Backend: keep Supabase and the Claude edge function pattern.
- Repo layout: Next.js app in the same repo, sharing tooling and env.
- Phase 1 first section: exams.
- Tool surface (Phase 2): migrate tools that share UI or data with the content
  surface; leave and route complex, stable tools where a move is high effort and
  low benefit, deciding and recording per tool.
- Observability: Sentry for error tracking, plus uptime monitoring.
- Content store: keep Supabase. No headless CMS.

**Still genuinely per case (recorded as each arises), not blocking:**

1. The migrate versus leave and route decision for each individual tool in Phase 2.
2. Any URL that changes, which needs a tested redirect.

---

## 11. Progress Log and Next Step

**Done (Phase 0):**

- 4a.1 Route and sitemap guard: `scripts/check-sitemap-routes.mjs`
  (`npm run check:routes`) loads every built-sitemap URL and fails on a soft 404.
  Wired into CI (`.github/workflows/ci.yml`) as a hard gate, so an orphan URL can
  no longer be merged. Verified: passes on the live sitemap, fails on an orphan.
- 4a.2 RLS audit and fix: probed the live DB with the anon key and found three
  confirmed anon-readable leaks (`course_feedback`, `ai_rate_limits`, `epics` /
  `user_stories`) plus a cross-user read/write IDOR on `backlog_items` /
  `features`. Fixed in `20260628120000_harden_rls_audit_fixes.sql` (owner/role
  scoped). Applied to prod via the SQL Editor and verified the leaks are closed.
  Note: applied by SQL Editor, so Supabase migration tracking still lists it as
  pending; it is idempotent, so a future `db push` re-applies it harmlessly.
  Sensitive tables (contacts, profiles, user_roles, auth_logs, admin_*, etc.)
  were already correctly protected.
- 4a.3 Write-side RLS fixes applied and verified: `admin_audit_log` INSERT and
  `knowledge_item_relationships` writes are now admins-only (anon write attempts
  confirmed BLOCKED). RLS hardening for Phase 0 is complete.
- 4a.4 Security headers in `vercel.json`: HSTS, Permissions-Policy
  (camera/mic/geolocation/payment/usb off), and an enforcing Content-Security-Policy.
  Rolled out via Report-Only first, crawled prod (17 routes incl. all tools) to a
  clean result, then switched to enforcing (verified 0 blocks live). `default-src
  'self'` with scoped allowances (Supabase REST/realtime, fonts, https images,
  ipify fetch, YouTube/Calendly/Credly embeds). Documented Vite-era exceptions:
  `script-src 'unsafe-eval'` (jspdf/html2canvas/page-editor) and `script-src-attr
  'unsafe-inline'` (deferred-CSS `<link onload>`); both go away with the Next.js
  migration (nonces + dep audit). Also stripped inline on*/javascript: from
  prerendered post content. NOTE: authed/admin flows were not exhaustively crawled;
  spot-check admin + a logged-in tool session and allowlist anything blocked.

- 4b Next.js skeleton built in `apps/web/` (Next 14 App Router, TS, Tailwind with
  ported tokens). Server-side Supabase via `@supabase/ssr` (anon, RLS-scoped),
  SEO primitives that replace `prerender.mjs` (`lib/seo.tsx` buildMetadata + JsonLd,
  file-based `sitemap.ts` + `robots.ts`), and a proof page that server-renders live
  exam data. `next build` passes; verified at runtime it SSRs real Supabase data,
  generates the sitemap from the DB, and serves robots. Isolated from the root Vite
  app (own package.json/node_modules; root build and CI untouched). Deployed to its
  own Vercel project (Root Directory `apps/web`, `apps/web/vercel.json` pins
  framework to nextjs) at `altogether-home-base-web-next.vercel.app` - smoke-tested
  live (SSR exam data, sitemap from the DB, robots). On **Next 15.5.19 + React 18**
  (the high-severity Next CVEs from 14.x are patched; the 2 remaining moderate
  audit notes are a non-exploitable build-time PostCSS transitive with no fix path).
  `next/image` remote hosts scoped to the Supabase host (no wildcard).

**Next step:** the remaining Phase 0 items. Code-only items I can take directly:
CSP and security headers (`vercel.json`), and a read-only RLS audit of the
Supabase tables (reported from the migration history; fixes applied as
migrations). Items that need the founder's accounts first: rate limiting
(Upstash), error tracking (Sentry), uptime monitoring, and the Renovate GitHub
app. The Next.js skeleton (4b) comes after the current app is hardened.

**CI note:** the workflow relies on `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` being set as GitHub repository secrets (the Build step
already required these, so they should already be configured).
