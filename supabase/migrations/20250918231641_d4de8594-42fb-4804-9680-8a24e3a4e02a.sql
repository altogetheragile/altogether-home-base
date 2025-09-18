-- Fix RLS policies with proper cleanup

-- Clean up existing policies on knowledge_templates
DROP POLICY IF EXISTS "Users can create their own templates" ON public.knowledge_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.knowledge_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.knowledge_templates;

-- Create clean admin policy for knowledge_templates
CREATE POLICY "Admins can manage all templates" 
ON public.knowledge_templates 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Allow non-admin users to create their own templates
CREATE POLICY "Users can create their own templates" 
ON public.knowledge_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own templates
CREATE POLICY "Users can update their own templates" 
ON public.knowledge_templates 
FOR UPDATE 
USING ((auth.uid() = created_by) OR is_admin())
WITH CHECK ((auth.uid() = created_by) OR is_admin());

-- Update knowledge_items policy to ensure admins see all items  
DROP POLICY IF EXISTS "Admins can manage all knowledge items" ON public.knowledge_items;
CREATE POLICY "Admins can manage all knowledge items" 
ON public.knowledge_items 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());