-- Fix admin access issues by ensuring proper user profile and RLS policies

-- 1. Create a function to ensure admin profile exists for current user
CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update existing profile to admin if user exists
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE id = auth.uid() AND email = 'al@altogetheragile.com';
  
  -- If no rows were updated, insert new profile
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      auth.uid(),
      'al@altogetheragile.com',
      'Al Davies-Baker',
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET 
      role = 'admin',
      email = 'al@altogetheragile.com';
  END IF;
END;
$$;

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
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

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
DROP POLICY IF EXISTS "view templates" ON public.event_templates;
DROP POLICY IF EXISTS "Users can view all event templates" ON public.event_templates;

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