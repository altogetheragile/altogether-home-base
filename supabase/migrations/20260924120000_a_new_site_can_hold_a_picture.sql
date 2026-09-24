-- Somewhere to put an uploaded picture.
--
-- Found by uploading one. This site has six storage buckets; a database built from these
-- migrations had none, because pg_dump of the public schema does not carry storage.buckets rows
-- or the policies on storage.objects, and the baseline was a pg_dump. So every upload on a new
-- instance failed, and would have gone on failing quietly: the editor showed an error, the
-- person editing assumed they had done something wrong.
--
-- Only two buckets are actually reached from code, so only two are created here. The others on
-- this site belong to features that predate them and can be added if anything turns out to need
-- one.
--
-- Written to be a no-op where the bucket or policy already exists, because this runs against this
-- site too, and this site already has both.

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true),
       ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

-- Policies cannot be declared "if not exists", and this site already has its own.
do $$
declare
  want record;
begin
  for want in
    select * from (values
      ('assets public read',        'assets',       'SELECT', 'true'),
      ('assets admin write',        'assets',       'INSERT', 'public.is_admin()'),
      ('assets admin update',       'assets',       'UPDATE', 'public.is_admin()'),
      ('assets admin delete',       'assets',       'DELETE', 'public.is_admin()'),
      ('user uploads public read',  'user-uploads', 'SELECT', 'true'),
      ('user uploads signed in write', 'user-uploads', 'INSERT', 'auth.uid() is not null')
    ) as t(policy_name, bucket, action, rule)
  loop
    if not exists (
      select 1 from pg_policy
       where polrelid = 'storage.objects'::regclass
         and polname = want.policy_name
    ) then
      execute format(
        'create policy %I on storage.objects for %s to public %s (bucket_id = %L and (%s))',
        want.policy_name,
        want.action,
        case when want.action = 'INSERT' then 'with check' else 'using' end,
        want.bucket,
        want.rule
      );
    end if;
  end loop;
end $$;
