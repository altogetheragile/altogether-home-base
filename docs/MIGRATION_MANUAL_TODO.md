# Migration — Manual To-Do (tasks only you can do)

Things the code/deploys cannot do for you, as the strangler-fig migration
proceeds. Grouped by priority. Last updated after the **blog** cutover
(2026-06-29). Exams and blog are now served by the Next.js app.

## A. Google Search Console (do soon)

1. **Confirm the sitemap is submitted.** GSC > Sitemaps > submit
   `https://altogetheragile.com/sitemap.xml` if it is not already listed. It now
   contains all exam and blog URLs (39 total). This is the main signal Google
   needs; everything below is acceleration, not a requirement.
2. **Request indexing for the migrated pages** (URL Inspection > Request Indexing).
   The URLs did not change, but the underlying rendering did, so a nudge helps
   Google recrawl the new server-rendered HTML sooner:
   - `https://altogetheragile.com/exams`
   - `https://altogetheragile.com/blog`
   - The 2-3 highest-value exam and blog posts (e.g. the AgilePM Foundation exam,
     your best-performing articles from the Top Queries report).
   You do not need to do all of them; the sitemap covers the long tail.
3. **Use the URL Inspection "Test Live URL" / "View Crawled Page"** on one exam and
   one blog URL to confirm Google sees real rendered HTML with the title, meta and
   JSON-LD (not the old empty SPA shell). This is the direct check that the SEO fix
   landed.
4. **Watch the Pages (Indexing) report over the next 1-2 weeks** for the migrated
   sections: the "Crawled - currently not indexed" and "Discovered - not indexed"
   buckets should not grow for `/exams*` or `/blog*`. If they do, inspect a sample
   URL and tell me.
5. **Check the Page Experience / Core Web Vitals report** after Google has recrawled
   (a couple of weeks). The Next pages should be at least as good as the old SPA;
   flag any regression.

## B. Social / rich result validation (optional, quick)

6. Run an exam URL and a blog URL through the
   [Rich Results Test](https://search.google.com/test/rich-results) to confirm the
   Quiz / BlogPosting / FAQ structured data is valid.
7. Paste an exam URL into the
   [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) (or share
   privately on X) to confirm the OG image renders. Exam OG cards are generated to
   `/og/exams/<slug>.png`; blog uses each post's featured image.

## C. Phase 0 accounts to set up (operational hardening)

These were deferred in the migration plan because they need accounts you own:

8. **Error monitoring (Sentry or similar)** for the Next.js app. Create the project,
   then tell me the DSN and I will wire it into `apps/web`.
9. **Uptime monitoring** (UptimeRobot, Better Uptime, or Pingdom) on
   `https://altogetheragile.com/` and `/exams` and `/blog`. Free tiers are fine.
10. **Rate limiting store (Upstash Redis)** if/when we add rate limiting to the
    Supabase edge functions. Create the database, then share the REST URL/token as
    Supabase secrets (I will set them with you, never the service-role key in the
    Next project).

## D. Vercel / infrastructure (verify once)

11. **Next project deployment protection:** the production deployment of
    `altogether-home-base-web-next` must stay publicly reachable (it is served via
    rewrite from the main domain). It currently works, so leave Production
    unprotected; Preview deployments can keep SSO protection.
12. **Environment variables** on the Next project: only
    `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable) are
    needed. Do **not** add the service-role key there.

## E. Supabase (housekeeping)

13. The RLS hardening was applied via the SQL Editor, not the migration history.
    No action needed now; just be aware that
    `supabase/migrations/20260628120000_harden_rls_audit_fixes.sql` documents what
    was applied if you ever rebuild the database from migrations.

---

### Not yet migrated (no action needed from you yet)

Courses/events and home + marketing pages are still served by the old Vite app and
will be cut over the same way. The Vite trunk and `prerender.mjs` are retired only
in Phase 3, once every content section is on Next.
