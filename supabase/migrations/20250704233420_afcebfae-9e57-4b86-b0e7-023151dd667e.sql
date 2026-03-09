-- Fix the events policy to use fully qualified function name
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;

CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Also ensure the SELECT policy doesn't conflict
DROP POLICY IF EXISTS "Public can view published events" ON public.events;

CREATE POLICY "Public can view published events"
ON public.events
FOR SELECT
USING (is_published = true OR public.is_admin());