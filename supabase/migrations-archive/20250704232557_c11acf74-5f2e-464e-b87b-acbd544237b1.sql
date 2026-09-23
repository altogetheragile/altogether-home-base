-- Clean up temporary functions now that fix is complete
DROP FUNCTION IF EXISTS public.ensure_admin_profile();
DROP FUNCTION IF EXISTS public.debug_auth_info();