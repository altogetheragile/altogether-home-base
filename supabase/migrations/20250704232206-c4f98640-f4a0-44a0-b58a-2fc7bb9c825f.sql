-- Fix admin access issues by ensuring proper user profile and RLS policies

-- 1. Insert admin profile for the authenticated user if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '0f4c7684-f0ab-4c9d-bb3b-4e6b7e2ad2d',
  'al@altogetheragile.com',
  'Al Davies-Baker',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET role = 'admin', email = 'al@altogetheragile.com';

-- 2. Create a debug function to help troubleshoot auth issues
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'auth_uid', auth.uid(),
    'user_profile', (
      SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'role', p.role
      )
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    ),
    'is_admin_result', public.is_admin()
  );
$$;

-- 3. Clean up and standardize events RLS policies to use is_admin() consistently
DROP POLICY IF EXISTS "Public can view published events only" ON public.events;
DROP POLICY IF EXISTS "view published events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "admin manage events" ON public.events;

-- Create standardized admin policies for events
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can view published events"
ON public.events
FOR SELECT
USING (is_published = true);

-- 4. Ensure other admin tables use consistent policies
-- Clean up event_templates policies
DROP POLICY IF EXISTS "admin manage templates" ON public.event_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.event_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.event_templates;
DROP POLICY IF EXISTS "Admins can update templates they created" ON public.event_templates;
DROP POLICY IF EXISTS "Admins can delete templates they created" ON public.event_templates;

CREATE POLICY "Admins can manage all templates"
ON public.event_templates
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can view all templates"
ON public.event_templates
FOR SELECT
USING (true);