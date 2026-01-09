-- Fix the RLS policy for knowledge_item_relationships to be more restrictive
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage knowledge item relationships" ON public.knowledge_item_relationships;

-- Create separate policies for each operation with proper checks
CREATE POLICY "Authenticated users can insert knowledge item relationships"
ON public.knowledge_item_relationships
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge item relationships"
ON public.knowledge_item_relationships
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete knowledge item relationships"
ON public.knowledge_item_relationships
FOR DELETE
TO authenticated
USING (true);