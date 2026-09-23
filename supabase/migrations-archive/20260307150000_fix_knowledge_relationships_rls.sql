-- Fix RLS on knowledge_item_relationships: restrict write operations to admins only.
-- Previously these policies allowed any authenticated user to INSERT, UPDATE, DELETE.

-- Drop the overly permissive per-operation policies created in the previous migration
DROP POLICY IF EXISTS "Authenticated users can insert knowledge item relationships" ON public.knowledge_item_relationships;
DROP POLICY IF EXISTS "Authenticated users can update knowledge item relationships" ON public.knowledge_item_relationships;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge item relationships" ON public.knowledge_item_relationships;

-- Also drop the older combined policy in case it still exists
DROP POLICY IF EXISTS "Authenticated users can manage knowledge item relationships" ON public.knowledge_item_relationships;

-- Create admin-only policies using the project-standard public.is_admin() function
CREATE POLICY "Only admins can insert knowledge item relationships"
ON public.knowledge_item_relationships
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update knowledge item relationships"
ON public.knowledge_item_relationships
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete knowledge item relationships"
ON public.knowledge_item_relationships
FOR DELETE
USING (public.is_admin());
