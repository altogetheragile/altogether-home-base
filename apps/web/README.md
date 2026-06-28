# Altogether Agile - Next.js target (strangler-fig)

This is the Next.js (App Router) app that the site is migrating to, per
[`docs/PLATFORM_MIGRATION.md`](../../docs/PLATFORM_MIGRATION.md). It lives
alongside the existing Vite SPA (repo root), which stays the production site until
Phase 1 cuts content routes over to here. **This app is not the live site yet.**

## What is in the skeleton (Phase 0, 4b)

- App Router + TypeScript + Tailwind, with the design tokens ported from the Vite
  app (`src/app/globals.css`, `tailwind.config.ts`) so components port on-brand.
- Server-side Supabase via `@supabase/ssr` (`src/lib/supabase/server.ts`,
  `client.ts`) - anon key, RLS-scoped, never the service-role key.
- SEO primitives that replace `scripts/prerender.mjs`: `src/lib/seo.tsx`
  (`buildMetadata`, `JsonLd`), file-based `src/app/sitemap.ts` and
  `src/app/robots.ts`, generated from routes + data (no second list to drift).
- A proof page (`src/app/page.tsx`) that server-renders a list of published exams
  to prove the SSR data path.

## Local dev

```bash
cd apps/web
cp .env.example .env.local   # then fill in NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Deploy (a separate Vercel project, so it never touches the live site)

1. In Vercel, **Add New > Project** from this same Git repo.
2. Set **Root Directory** to `apps/web`.
3. Framework preset auto-detects **Next.js**.
4. Add env vars **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   (same values as the existing app).
5. Deploy. It gets its own preview URL (e.g. `altogether-web-next.vercel.app`).
   The main domain stays on the Vite app until Phase 1 cutover.

## Next (Phase 1)

Migrate content routes one section at a time (exams first), porting shadcn
components and using `generateMetadata` per route. See the migration plan.
