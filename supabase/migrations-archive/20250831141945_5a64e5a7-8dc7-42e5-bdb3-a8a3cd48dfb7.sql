-- Fix security issue: Enable RLS on backup table
ALTER TABLE knowledge_items_backup ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for admins only to view backup data
CREATE POLICY "Admins can view backup data" 
ON knowledge_items_backup 
FOR SELECT 
USING (is_admin());