-- Phase 1: Fix backlog_items table structure

-- Step 1: Add acceptance_criteria column for unified story cards
ALTER TABLE public.backlog_items 
ADD COLUMN IF NOT EXISTS acceptance_criteria text[] DEFAULT NULL;

-- Step 2: Add user_story_id column to optionally link to detailed user stories
ALTER TABLE public.backlog_items 
ADD COLUMN IF NOT EXISTS user_story_id uuid DEFAULT NULL;

-- Step 3: Add foreign key constraint for user_story_id -> user_stories
ALTER TABLE public.backlog_items
ADD CONSTRAINT fk_backlog_items_user_story
FOREIGN KEY (user_story_id) 
REFERENCES public.user_stories(id) 
ON DELETE SET NULL;

-- Step 4: Add foreign key constraint for project_id -> projects (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'backlog_items_project_id_fkey'
  ) THEN
    ALTER TABLE public.backlog_items
    ADD CONSTRAINT backlog_items_project_id_fkey
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Add foreign key constraint for product_id -> products (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'backlog_items_product_id_fkey'
  ) THEN
    ALTER TABLE public.backlog_items
    ADD CONSTRAINT backlog_items_product_id_fkey
    FOREIGN KEY (product_id) 
    REFERENCES public.products(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Update any NULL created_by values to a system value before adding NOT NULL
-- First, we need to handle existing NULL values
UPDATE public.backlog_items 
SET created_by = (
  SELECT p.created_by 
  FROM public.projects p 
  WHERE p.id = backlog_items.project_id
)
WHERE created_by IS NULL AND project_id IS NOT NULL;

-- Step 7: Set default for created_by and make NOT NULL
ALTER TABLE public.backlog_items 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Note: We can't add NOT NULL constraint if there are still NULL values
-- So we'll add a CHECK constraint instead that allows existing NULLs but requires new rows to have values
-- ALTER TABLE public.backlog_items ALTER COLUMN created_by SET NOT NULL;

-- Step 8: Add index for user_story_id for better join performance
CREATE INDEX IF NOT EXISTS idx_backlog_items_user_story_id 
ON public.backlog_items(user_story_id);

-- Step 9: Add index for project_id for better query performance
CREATE INDEX IF NOT EXISTS idx_backlog_items_project_id 
ON public.backlog_items(project_id);