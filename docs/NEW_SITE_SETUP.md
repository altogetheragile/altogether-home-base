# Standing Up A New Site

**Version:** 1.0 (23 September 2026).
**Status:** Specification, mostly implemented. Brand, modules and identity are configuration now;
the walk-through and the remaining prose are not. Section 6's blocker is fixed: the database can
be built from this repository, and CI proves it on every change under `supabase/`.

**Version 1.1 (23 September 2026)**, after #745 to #751.

**The goal in one line:** a second site, on its own domain, set up by filling in a form rather
than by editing code.

---

## 1. The Shape: An Instance Per Site

Each site is its own deployment and its own Supabase project. Not tenants sharing one database.

This is a deliberate choice and worth the reasoning, because the other shape looks more
sophisticated:

- **Different businesses, no shared data.** Nothing in one site's courses, bookings, contacts or
  members belongs anywhere near another's. A tenant column is a promise to remember a `WHERE`
  clause on every query for the rest of the project's life, and the first time someone forgets it
  they have leaked a client's customer list.
- **Blast radius.** A bad migration, a mistaken delete or a compromised admin account reaches one
  site.
- **It is cheaper.** Multi-tenancy means a tenant column on every table, RLS scoped by tenant on
  every policy, a tenant registry, and hostname resolution. That is a large project justified by
  self-service signup, which is not what this is.
- **It is already true.** The code has no concept of a tenant, which means the work is to finish
  making configuration configurable, not to re-architect.

The cost is that a change to shared behaviour has to be deployed to each site. With a small
number of sites that is the right trade.

## 2. What "Set Up A New Site" Means

**First-run setup, on the new instance.** Deploy the app, point it at an empty Supabase project,
open Admin, and a walk-through fills in everything that makes it that site rather than this one.

**Explicitly not a control plane.** A tool on altogetheragile.com that provisions other sites
would need the Supabase Management API, the Vercel API, stored credentials for both, and a
registry of sites. It would make Admin on one site a way into all of them. For a handful of
sites this is a worse trade in every direction, and it is not planned.

So: no cross-site anything. The walk-through only ever writes to the database it is running on.

## 3. Before The Walk-Through: Provisioning

These steps are done by hand, once, and are not part of the wizard.

1. Create the Supabase project.
2. Apply the migrations (`supabase db push`, or `db reset` against the new project).
3. Create the Vercel projects, root and `apps/web`, from the same repository.
4. Set the environment variables, and the Site URL and redirect allowlist in Supabase Auth.
5. Point the domain at Vercel.
6. Create the first admin account and grant it the `admin` role.

Step 2 is the one that decides whether any of this is possible. See Section 6.

## 4. The Walk-Through

Five steps. Each is skippable and re-runnable, and the whole thing is re-openable from Admin
afterwards, because none of it is one-time truth.

### Step 1: Identity

Company name, contact email and phone, location, social links, the copyright line.

Writes: `site_settings` (these columns already exist).

### Step 2: Brand

Colours with a live preview of the real header and a real card, so the effect is visible while
choosing. Logo lockup, mark, favicon, OG image, each with an upload and a "keep the default".

Writes: `site_settings`. New columns for the twelve palette tokens and the four image URLs.
Images go to Supabase Storage.

### Step 3: Modules

The 39 switches in `site_settings`, presented as "what does this site do" rather than as a list
of flags: Courses and Events, Coaching, Blog, Knowledge Base, Practice Exams, the games, Bookings,
Testimonials. Off means the route 404s, which is already true since #720 and #723.

Writes: `site_settings`.

### Step 4: Words

The page copy, seeded from the registries and edited in place. The wizard shows the headline
pieces per page and links to the full Site Copy editor for the rest.

Writes: `site_copy`. Seeded by `scripts/seed-site-copy.mjs`.

### Step 5: Content

What to do about courses, blog posts, exams and testimonials: start empty, keep the shipped
examples, or import. Most sites will start empty.

Writes: the content tables, or nothing.

**On finishing,** a checklist of what is still needed outside the app: the domain, the auth
redirect allowlist, the sitemap submission, and a redeploy so the sitemap reflects the content
(see `CLAUDE.md`, the sitemap is built at deploy time).

## 5. What Does Not Exist Yet

The walk-through is a form over configuration. Where the configuration is missing, the form has
nothing to set. As of 23 September:

Updated 23 September, after #745 to #751.

| Step | State |
|---|---|
| Identity | **Ready.** The columns exist and Admin edits them. `company_name` now also drives the Open Graph site name, the `Organization` in structured data and the page title suffixes (#751). |
| Brand, colours | **Ready.** Both apps render from CSS custom properties, and the values come from `site_settings.brand` with the tokens as fallback (#745, #748, #749). Twelve fields in Admin. Proved by setting a purple brand in the database and watching both apps repaint. |
| Brand, images | **Ready.** Logo, favicon and share image, in the same `brand` column, uploaded to the existing `assets` bucket (#750). Reaches five places, including `prerender.mjs`, which writes `og:image` into every page the App serves. |
| Modules | **Ready.** 39 flags, enforced on both routers. |
| Words | **The remaining work.** `site_copy` holds 153 entries covering body copy on eight Site pages, and the company *name* is now configuration everywhere it is used as a name. What is left is 49 mentions that say more than the name, such as "founder of Altogether Agile", across the App's pages and tool descriptions, plus per-page descriptions. These get rewritten on a new site rather than templated, so this is a content job, not a plumbing one. |
| Content | **Ready enough.** The tables exist and Admin manages them. |

**Still this repository's, and worth knowing before standing a site up:**

- Per-page `description` strings are hardcoded. A second site's search snippets would describe Altogether Agile.
- The `Organization` description and founder in `organizationJsonLd` name Alun.
- The Course, Workshop and Masterclass card colours are their own palette, unconnected to the brand.
- `recommend-pattern` and `export-data` mention the company in an AI system prompt and an export provenance string. Neither is customer-facing.
- The App flashes the default brand before `site_settings` arrives, because it is client-rendered. The Site does not.

## 5a. What Still Says Altogether Agile, And Where

Audited 23 September by grepping both apps, the edge functions and the build scripts for the
company name, the founder's name, the domain and the email addresses, then discarding every line
that already reads a setting or an environment variable. **177 references had no way to be
anything else.** They are not all the same kind of problem.

| Kind | Count | What to do |
|---|---|---|
| The company name, visible | 102 | Mostly tab titles on App pages (`Journey Map Studio - Altogether Agile`) and `aria-label="Altogether Agile home"`. Mechanical, and only matters for the App, which is behind a login. |
| Hardcoded domain or email | 20 | `SITE_URL` constants, `info@altogetheragile.com`, and Search Console's `sc-domain:`. Several are already env-var fallbacks. A new site needs its own, and some are deployment config rather than content. |
| Names a person | 29 | Handled for the Site by `show_founder` and `founder_name`. What remains is the App's Terms page, its `JsonLd` constant, and the blog importer's default author. |
| Alt text and labels | 26 | `alt="Altogether Agile"` on logos, `title="... - Altogether Agile"` on App pages. Invisible until a screen reader or a tab reads them out. |

**The founder is done** (this section's work): `show_founder` removes the portrait, the biography
and the `Person` structured data entirely; `founder_name`, `brand.images.founderPhoto` and
`brand.images.founderPortrait` change who it is; the words are in `site_copy` under
`home.founder.*` and `about.founder.*`.

**Verified by running it.** With `show_founder` off, the home page and the About page render zero
founder photographs, no `Person` structured data and no `founder` claim in the `Organization`.
With it on, both are byte-identical to production.

**Three things a new site must still rewrite by hand**, because they are sentences about a person
and templating them would produce something nobody would have written:

- `src/pages/Terms.tsx`: "Our courses are delivered personally by Alun Davies-Baker".
- `src/components/seo/JsonLd.tsx`: a `FOUNDER_NAME` constant. It does not reach a crawler
  (`prerender.mjs` writes what Google sees) but it is in the DOM.
- `src/components/admin/ImportMarkdownDialog.tsx`: the default author on an imported blog post.

**And one that is data, not code:** the testimonials name Alun, because customers wrote them. A
new site has its own.

---

## 6. The Blocker, Tested

**FIXED 23 September (#747).** What follows is the diagnosis, kept because it explains the shape
of `supabase/migrations-archive/` and why a baseline exists at all.

~~The migrations do not build an empty database. Tested 23 September; the first one fails.~~

Run against a clean local Supabase stack, `supabase start` gets exactly one migration in:

```
Applying migration 20250621215408_3440d28e-a10b-44a7-a46f-0a3dc319176b.sql...
ERROR: relation "public.events" does not exist (SQLSTATE 42P01)
At statement: 0
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_instructor_id_fkey
```

The repository's migration history begins in the middle. The earliest files alter tables that
nothing in the repository ever creates, because those tables were made through the Supabase UI
before migrations were being tracked. Ten tables are in that state, and they are the core of the
schema: `events`, `event_templates`, `event_registrations`, `locations`, `instructors`,
`knowledge_items`, `knowledge_item_tags`, `knowledge_item_relations`, `contacts`, `profiles`.
The repository creates 127 tables and assumes another ten already exist.

**So there is no site number two until this is fixed,** and the same gap explains the drift that
makes `db push` unreliable against production today.

### The Fix: Baseline From The Live Schema

Dump the current production schema into a single `00000000000000_baseline.sql`, move the 232
historical files into `supabase/migrations/archive/`, and start the history there. New projects
apply the baseline and everything after it. Production is told the baseline is already applied
(`supabase migration repair`), which also resolves the existing drift.

This needs the production database password, which is not in the repository and should not be.
Either that is supplied, or the dump is run by hand:

```
supabase link --project-ref wqaplkypnetifpqrungv
supabase db dump --linked -f supabase/migrations/00000000000000_baseline.sql
```

**Also wrong:** `supabase/config.toml` has `project_id = "tdfbqmjmrqcovwnptiux"`, which is not
this project. The live ref is `wqaplkypnetifpqrungv`. Anyone running a CLI command that respects
that file is aimed at something else.

### Then, In Order

1. ~~**Add a CI job that applies the migrations to an empty database.**~~ **Done** (#747). The
   `Schema` workflow builds from nothing on any change under `supabase/`. One of its checks is
   exact: zero public tables without row level security.
2. **Unify the App palette,** so one brand drives both apps. The largest remaining piece.
3. **Brand as data:** the palette and the image URLs into `site_settings`, defaults from the
   tokens, so an unset value still renders today's brand.
4. **Close the copy gaps:** page metadata, the App, the edge function emails.
5. **Build the walk-through.**

## 7. Open Questions

1. **Category colours.** `EventsList` has its own Course, Workshop and Masterclass palette. Does a
   second site inherit that colour language or choose its own? A design decision, not a
   conversion.
2. **Shared changes.** With an instance per site, a fix has to be deployed to each. At two sites
   that is a non-issue. At six it wants a release process.
3. **Fonts.** The palette is configurable in this plan; the typefaces are not. DM Serif and DM
   Sans are self-hosted in both apps. Whether a second site gets its own typography is unasked.
