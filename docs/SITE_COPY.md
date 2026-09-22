# Site Copy

The words on the public pages, editable in Admin without a deploy.

## How It Works

Three pieces:

1. **A JSON registry per page**, in `apps/web/src/lib/copy/`. It holds the wording the site shipped
   with, plus the label and note the editor shows beside each entry. It is the fallback and the
   seed, never the live value.
2. **The `site_copy` table**, holding whatever has been edited since, keyed by the same ids.
3. **`getCopy(page)`** in `apps/web/src/lib/copy/index.ts`, which reads the table and lays it over
   the registry. If the query fails the page renders its shipped wording and says nothing, because
   nobody should see a site with no words in it because a query timed out.

Registries are JSON rather than TypeScript because two things read them and they cannot import each
other's source: the Next app renders the pages, and `scripts/seed-site-copy.mjs` writes the rows the
editor lists. A shared `.json` needs no build step and no shared package.

## Adding A Page

1. Write `apps/web/src/lib/copy/<page>.json` in the shape of `home.json`: a `page` id, a `label`,
   and `entries` of `{ value, label, hint }` keyed by `<page>.<section>.<name>`.
2. Add it to `REGISTRIES` in `apps/web/src/lib/copy/index.ts`.
3. Replace the hardcoded strings in the page with `t('<key>')`.
4. Run `node scripts/seed-site-copy.mjs` to create the rows.

`copyRegistryMatchesPage.test.ts` fails if a registry declares a key the page never reads, or the
page reads a key no registry declares.

## Lists

A list of plain strings lives in ONE entry, one item per line, and the page splits it with
`list()`. That is deliberate: a key-value editor cannot add a key, but it can add a line, so the
credentials and the hero tags on About can be grown and shortened without a developer.

A list whose items have several fields of their own, like the career timeline on About, stays in
code. Squeezing three fields per row into a textarea trades one problem for a worse one.

## A Line Break In A Heading

Two headings are deliberately split across lines. The registry stores the break as a newline and the
page renders it with `lines()`. Editing one of those entries, put the break back where you want it
or leave it out for a single line.

## The Table

Run once, in the Supabase dashboard SQL editor. The repo's migration history is out of sync with
remote, so this is one-off DDL rather than `db push`.

```sql
create table if not exists public.site_copy (
  key         text primary key,
  page        text not null,
  value       text not null default '',
  label       text not null default '',
  hint        text not null default '',
  sort        integer not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

create index if not exists site_copy_page_idx on public.site_copy (page, sort);

alter table public.site_copy enable row level security;

-- Anyone can read it: this is the text of the public pages, and the Next app fetches it
-- unauthenticated when it renders them.
create policy "site copy is readable by anyone"
  on public.site_copy for select using (true);

create policy "admins write site copy"
  on public.site_copy for all
  using (public.is_admin()) with check (public.is_admin());
```

Then seed it:

```
node scripts/seed-site-copy.mjs
```

The seed inserts any key the table does not have and refreshes labels, hints and order on the ones
it does. It never overwrites `value` on an existing row, so re-running it after an edit is safe.
