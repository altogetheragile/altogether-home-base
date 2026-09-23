-- Fix canvas duplication issues
-- First, clean up duplicate canvases, keeping only the most recent one for each project
WITH ranked_canvases AS (
  SELECT 
    id,
    project_id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at DESC) as rn
  FROM public.canvases
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_canvases 
  WHERE rn > 1
)
DELETE FROM public.canvases 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Add unique constraint to prevent multiple canvases per project
ALTER TABLE public.canvases 
ADD CONSTRAINT canvases_project_id_unique UNIQUE (project_id);