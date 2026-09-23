-- Create comprehensive RLS diagnostic function
CREATE OR REPLACE FUNCTION public.rls_audit()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_name text,
  policy_cmd text,
  policy_roles text[],
  policy_using text,
  policy_check text
)
LANGUAGE sql
AS $$
  SELECT 
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    p.policyname::text as policy_name,
    p.cmd::text as policy_cmd,
    p.roles as policy_roles,
    p.qual::text as policy_using,
    p.with_check::text as policy_check
  FROM pg_class c
  LEFT JOIN pg_policies p ON c.relname = p.tablename
  WHERE c.relname IN ('events', 'event_templates', 'event_registrations', 'profiles')
  ORDER BY c.relname, p.policyname;
$$;

-- Fix the policy to use fully qualified function name
DROP POLICY IF EXISTS "Admin full access to events" ON public.events;

CREATE POLICY "Admin full access to events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Test if the issue is function qualification by creating a temporary direct policy
CREATE POLICY "Test direct admin check"
ON public.events  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);