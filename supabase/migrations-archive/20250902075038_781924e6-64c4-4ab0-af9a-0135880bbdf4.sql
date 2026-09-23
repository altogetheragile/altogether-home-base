-- Update RLS policies for knowledge_use_cases to allow authenticated users to manage use cases
-- for knowledge items they have permission to edit

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all use cases" ON knowledge_use_cases;
DROP POLICY IF EXISTS "Public can view use cases for published items" ON knowledge_use_cases;

-- Create new policies that align with knowledge item permissions
CREATE POLICY "Admins can manage all use cases" 
ON knowledge_use_cases 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage use cases for items they can edit" 
ON knowledge_use_cases 
FOR ALL 
TO authenticated
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM knowledge_items ki 
    WHERE ki.id = knowledge_use_cases.knowledge_item_id 
    AND (ki.created_by = auth.uid() OR is_admin())
  )
)
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM knowledge_items ki 
    WHERE ki.id = knowledge_use_cases.knowledge_item_id 
    AND (ki.created_by = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Public can view use cases for published items" 
ON knowledge_use_cases 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM knowledge_items ki 
    WHERE ki.id = knowledge_use_cases.knowledge_item_id 
    AND ki.is_published = true
  )
);