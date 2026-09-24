-- What a value was, before somebody changed it.
--
-- The words on this site are edited from the site itself now, which makes editing casual: a
-- sentence gets reworded between meetings, on a phone, without ceremony. Casual editing needs an
-- undo, and site_copy holds only the current value. Yesterday a mislabelled button was one click
-- away from deleting a seven-paragraph timeline and there was nothing to restore it from.
--
-- The log holds the PREVIOUS value rather than every version. site_copy stays the one place the
-- current value lives, so the two cannot drift, and an undo is a stack pop: take the most recent
-- row, put it back, delete it. Undoing twice walks further back.
--
-- Rows are small and edits are rare; a thousand edits is well under a megabyte. If that ever
-- stops being true, prune by replaced_at rather than adding a trigger nobody remembers.

create table if not exists public.site_copy_revisions (
  id          bigint generated always as identity primary key,
  key         text        not null,
  page        text        not null,
  value       text        not null,
  replaced_at timestamptz not null default now(),
  replaced_by uuid references auth.users(id)
);

comment on table public.site_copy_revisions is
  'What a site_copy value was before each change. The most recent row for a key is what undo restores.';
comment on column public.site_copy_revisions.value is
  'The value being replaced, not the new one. Empty string is a real value: it means the key had no row and the page was showing its shipped default.';

-- Undo reads the newest row for one key, which is the only access pattern there is.
create index if not exists site_copy_revisions_key_idx
  on public.site_copy_revisions (key, replaced_at desc);

alter table public.site_copy_revisions enable row level security;

-- Deliberately not readable by anyone, unlike site_copy itself. The current words are public
-- because the site renders them; the drafts somebody discarded are not.
create policy "admins read copy revisions" on public.site_copy_revisions
  for select using (public.is_admin());
create policy "admins write copy revisions" on public.site_copy_revisions
  for insert with check (public.is_admin());
create policy "admins pop copy revisions" on public.site_copy_revisions
  for delete using (public.is_admin());
