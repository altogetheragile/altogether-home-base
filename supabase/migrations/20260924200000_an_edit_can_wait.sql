-- An edit that is not ready to be seen yet.
--
-- Editing happens on the live page, which is what makes it quick and is also the whole risk: a
-- half-rewritten paragraph is public the moment it is saved. That is fine for fixing a typo and
-- wrong for reworking a page, and until now there was no way to say which one you were doing.
--
-- Saving still publishes. This is the opt-in half: "Save as draft" puts the new value here
-- instead, the live page carries on showing what it showed before, and a preview shows the draft
-- to whoever is editing. Publishing moves it across; discarding forgets it.
--
-- WHY A TABLE OF ITS OWN, rather than a draft_value column on site_copy.
--
-- Not every editable field is a row in site_copy. The logo, the brand colours and the module
-- switches live in columns on site_settings, and the brand keys live inside a JSON object in one
-- of those columns. A draft_value column would give drafting to the words and not to the picture
-- beside them, which is exactly the split the editor spent this month removing.
--
-- A draft here is just "this key should become this value", and publishing hands it to the same
-- code that a normal save uses. So a drafted colour, a drafted logo and a drafted sentence all
-- work the same way, and nothing had to learn about drafting except the thing that writes.

create table if not exists public.site_copy_drafts (
  key        text primary key,
  page       text        not null,
  value      text        not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

comment on table public.site_copy_drafts is
  'Proposed values not yet published. Keyed the same as site_copy, but covers settings and brand fields too: publishing routes each one to wherever that field actually lives.';
comment on column public.site_copy_drafts.value is
  'What the field should become. The current value stays wherever it already lives; nothing here is on the live site.';

-- The editor loads one page at a time, and the preview overlays one page at a time.
create index if not exists site_copy_drafts_page_idx
  on public.site_copy_drafts (page);

alter table public.site_copy_drafts enable row level security;

-- Not readable by anyone but an admin, unlike site_copy itself. site_copy is public because the
-- site renders it; the point of a draft is that it is not on the site yet. A draft readable with
-- the anon key would put every unpublished rewrite one fetch away from anyone who wanted it.
create policy "admins read copy drafts" on public.site_copy_drafts
  for select using (public.is_admin());
create policy "admins write copy drafts" on public.site_copy_drafts
  for insert with check (public.is_admin());
create policy "admins change copy drafts" on public.site_copy_drafts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins discard copy drafts" on public.site_copy_drafts
  for delete using (public.is_admin());
