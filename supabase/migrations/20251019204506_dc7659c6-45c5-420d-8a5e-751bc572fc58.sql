-- Add canvas_type and user_id to canvases table
-- Make project_id nullable to support user-scoped canvases

-- Add canvas_type column to distinguish between different canvas types
ALTER TABLE public.canvases 
ADD COLUMN IF NOT EXISTS canvas_type TEXT DEFAULT 'project';

-- Add user_id column for user-scoped canvases
ALTER TABLE public.canvases 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make project_id nullable to support canvases without projects
ALTER TABLE public.canvases 
ALTER COLUMN project_id DROP NOT NULL;

-- Add check constraint to ensure either project_id or user_id is set
ALTER TABLE public.canvases 
ADD CONSTRAINT canvases_scope_check 
CHECK (
  (project_id IS NOT NULL AND user_id IS NULL) OR 
  (project_id IS NULL AND user_id IS NOT NULL)
);

-- Create index for efficient user-scoped queries
CREATE INDEX IF NOT EXISTS idx_canvases_user_id_type 
ON public.canvases(user_id, canvas_type) 
WHERE user_id IS NOT NULL;

-- Update RLS policies for user-scoped canvases

-- Drop existing policies that only support project-scoped
DROP POLICY IF EXISTS "Users can view canvases of their projects" ON public.canvases;
DROP POLICY IF EXISTS "Users can create canvases for their projects" ON public.canvases;
DROP POLICY IF EXISTS "Users can update canvases of their projects" ON public.canvases;

-- Create new policies that support both project and user-scoped canvases

-- Users can view their own user-scoped canvases OR project-scoped canvases they own
CREATE POLICY "Users can view their canvases" 
ON public.canvases 
FOR SELECT 
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
  ))
);

-- Users can create their own user-scoped canvases OR project canvases
CREATE POLICY "Users can create canvases" 
ON public.canvases 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
    ))
  )
);

-- Users can update their own canvases
CREATE POLICY "Users can update their canvases" 
ON public.canvases 
FOR UPDATE 
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
  ))
);

-- Users can delete their own canvases
CREATE POLICY "Users can delete their canvases" 
ON public.canvases 
FOR DELETE 
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
  ))
);

-- Admins retain full access
-- (Admin policy already exists from context)