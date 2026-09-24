-- Remove six storage policies that duplicate, exactly, six that were already there.
--
-- 20260924120000 created buckets and policies so a database built from these migrations has
-- somewhere to put an uploaded picture. That was needed. But it matches existing policies by NAME,
-- and this site's own are named differently, so on this site it added six alongside six that
-- already said the same thing:
--
--   assets public read            = Public can view assets
--   assets admin write/update/delete = Admins can manage all assets
--   user uploads public read      = Public read for user-uploads
--   user uploads signed in write  = Authenticated users can upload to user-uploads
--
-- Checked against the dumped definitions before writing this: identical in effect, so nothing was
-- broadened when they were added and nothing is narrowed by removing them.
--
-- They are dropped only where an equivalent survives. On a database built from nothing there is
-- no equivalent, the drop does not fire, and the buckets keep the policies that make them work.
--
-- Duplicated access rules are worth removing even when they are harmless: the next person to
-- change one will believe they have changed the behaviour.

do $$
declare
  mine record;
begin
  for mine in
    select * from (values
      ('assets public read',           'Public can view assets'),
      ('assets admin write',           'Admins can manage all assets'),
      ('assets admin update',          'Admins can manage all assets'),
      ('assets admin delete',          'Admins can manage all assets'),
      ('user uploads public read',     'Public read for user-uploads'),
      ('user uploads signed in write', 'Authenticated users can upload to user-uploads')
    ) as t(redundant, covered_by)
  loop
    if exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polname = mine.covered_by)
       and exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polname = mine.redundant)
    then
      execute format('drop policy %I on storage.objects', mine.redundant);
    end if;
  end loop;
end $$;
