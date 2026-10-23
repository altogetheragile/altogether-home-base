-- Signing up makes a profile, on every project.
--
-- Reported from a second site: Admin -> Users said "No users found" for somebody who had signed up
-- and could sign in. That page lists public.profiles, and nobody who signed up there had a row in
-- it, nor a role in public.user_roles.
--
-- The trigger that writes both lived in a migration that was later archived
-- (migrations-archive/20260318005922_...). The baseline that replaced the history is a dump of the
-- public schema, which keeps public.handle_new_user() and drops the trigger, because the trigger
-- sits on auth.users. This project kept the trigger it already had; a project built from the
-- baseline never got one.
--
-- Same name as the trigger this project already has, so here it is replaced by itself.

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Everybody who signed up while it was missing, given what the trigger would have given them.
INSERT INTO public.profiles (id, email, full_name, username, role)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'username', 'user'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
-- A username somebody else already holds would stop the whole backfill; skip that one instead.
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT DO NOTHING;
