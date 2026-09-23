-- Clean up and finalize with the working approach
DROP POLICY IF EXISTS "Test direct admin check" ON public.events;
DROP POLICY IF EXISTS "Admin full access to events" ON public.events;

-- Use the direct approach that should work reliably
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL  
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Also fix event_templates with the same approach
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.event_templates;

CREATE POLICY "Admins can manage all templates"
ON public.event_templates
FOR ALL
TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Clean up the diagnostic function since we won't need it
DROP FUNCTION IF EXISTS public.rls_audit();