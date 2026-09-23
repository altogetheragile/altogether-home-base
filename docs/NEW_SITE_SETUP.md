# Standing Up A New Site

**Version:** 1.0 (23 September 2026).
**Status:** Specification, with one tested finding. The walk-through described here is the last
thing to build, not the next: each step names configuration that has to exist first, so this
document is the target for that work. **Read Section 6 first.** The database cannot currently be
built from this repository, which blocks everything else here.

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

| Step | State |
|---|---|
| Identity | **Ready.** The columns exist and Admin already edits them. |
| Brand, colours | **Half.** The Site resolves its palette through CSS custom properties (#745), so it can be repainted without a rebuild, but the values still come from `tokens.ts` at build time. The App is worse: its Tailwind theme reads `--primary` and friends, which `src/index.css` sets statically and which are not derived from the brand tokens. Two palettes, one of them not swappable at all. |
| Brand, images | **Not started,** and small. Three referenced paths: `/brand/lockup-horizontal-tight.svg`, `/favicon.svg`, `/og-image.png`. |
| Modules | **Ready.** 39 flags, enforced on both routers. |
| Words | **Partial, and the gap is larger than it looks.** `site_copy` holds 153 entries covering visible body copy on eight Site pages. It does not cover page metadata: titles, descriptions and JSON-LD are hardcoded in `generateMetadata` across 16 Site files. The company name also appears in 46 App files and 4 edge functions, including the emails a customer receives. A new site would render its own words and email somebody else's name. |
| Content | **Ready enough.** The tables exist and Admin manages them. |

## 6. The Blocker, Tested

**The migrations do not build an empty database. Tested 23 September; the first one fails.**

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

1. **Add a CI job that applies the migrations to an empty database.** Once the baseline exists,
   this is what stops the history rotting again. It is the cheapest guard on the list and the
   absence of it is why nobody knew.
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
