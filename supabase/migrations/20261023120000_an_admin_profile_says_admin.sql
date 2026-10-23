-- An admin's profile says admin.
--
-- The backfill in 20261023100000 gave every missing profile the role 'user', because that is what
-- the sign-up trigger gives. On a second site that included the person who set it up, who already
-- held 'admin' in public.user_roles. Nothing they could do changed (is_admin() and both apps read
-- user_roles first), but Admin -> Users shows profiles.role, and it called the site's owner a user.
--
-- user_roles is the one that decides, so the profile follows it.

UPDATE public.profiles p
SET role = 'admin'
WHERE p.role IS DISTINCT FROM 'admin'
  AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin'::public.app_role);
