-- Fix RLS policies to allow admins full access to knowledge items and templates

-- Update knowledge_items RLS policy for admins to see all items (published and unpublished)
DROP POLICY IF EXISTS "Admins can manage all knowledge items" ON public.knowledge_items;
CREATE POLICY "Admins can manage all knowledge items" 
ON public.knowledge_items 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Update knowledge_templates RLS policy to allow proper admin inserts
DROP POLICY IF EXISTS "Users can create their own templates" ON public.knowledge_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.knowledge_templates;

CREATE POLICY "Admins can manage all templates" 
ON public.knowledge_templates 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can create their own templates" 
ON public.knowledge_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND NOT is_admin());

CREATE POLICY "Users can update their own templates" 
ON public.knowledge_templates 
FOR UPDATE 
USING ((auth.uid() = created_by) OR is_admin())
WITH CHECK ((auth.uid() = created_by) OR is_admin());