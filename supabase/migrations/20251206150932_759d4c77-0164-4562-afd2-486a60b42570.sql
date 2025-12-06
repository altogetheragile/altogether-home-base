-- Add project_id column to backlog_items table
ALTER TABLE public.backlog_items 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_backlog_items_project_id ON public.backlog_items(project_id);

-- Update RLS policy to allow users to view backlog items for their projects
DROP POLICY IF EXISTS "Users can view backlog items" ON public.backlog_items;
CREATE POLICY "Users can view backlog items for their projects" 
ON public.backlog_items 
FOR SELECT 
USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = backlog_items.project_id 
    AND p.created_by = auth.uid()
  )
);