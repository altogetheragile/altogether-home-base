
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON event_templates;

-- Ensure RLS is enabled
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all templates
CREATE POLICY "Admins can view all templates" 
ON event_templates FOR SELECT 
TO authenticated 
USING (is_admin());

-- Allow admins to insert templates (with created_by enforcement)
CREATE POLICY "Admins can insert templates" 
ON event_templates FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() AND auth.uid() = created_by);

-- Allow admins to update templates they created
CREATE POLICY "Admins can update templates they created" 
ON event_templates FOR UPDATE 
TO authenticated 
USING (is_admin() AND auth.uid() = created_by)
WITH CHECK (is_admin());

-- Allow admins to delete templates they created
CREATE POLICY "Admins can delete templates they created" 
ON event_templates FOR DELETE 
TO authenticated 
USING (is_admin() AND auth.uid() = created_by);
