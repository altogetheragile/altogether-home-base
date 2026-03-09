-- Create a temporary test policy to see if the issue is with policy evaluation
DROP POLICY IF EXISTS "Test admin access" ON public.events;

CREATE POLICY "Test admin access"
ON public.events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);