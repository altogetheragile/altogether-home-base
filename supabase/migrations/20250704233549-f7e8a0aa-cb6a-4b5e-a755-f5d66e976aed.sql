-- Clean up test policy and set final working policies
DROP POLICY IF EXISTS "Test admin access" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;  
DROP POLICY IF EXISTS "Public can view published events" ON public.events;

-- Create the final working policies
CREATE POLICY "Admin full access to events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can view published events" 
ON public.events
FOR SELECT
USING (is_published = true);

-- Also ensure consistent policies on event_registrations for admin access
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.event_registrations;
CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (public.is_admin());