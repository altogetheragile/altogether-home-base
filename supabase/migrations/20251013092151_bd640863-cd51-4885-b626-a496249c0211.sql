-- Add 'recommendations' to content_blocks type constraint
-- This allows recommendations to be added as a configurable content block type

-- First, we need to drop the existing constraint if it exists
ALTER TABLE public.content_blocks 
DROP CONSTRAINT IF EXISTS content_blocks_type_check;

-- Add the new constraint with recommendations included
ALTER TABLE public.content_blocks 
ADD CONSTRAINT content_blocks_type_check 
CHECK (type IN ('text', 'image', 'video', 'hero', 'section', 'recommendations'));

-- Add comment for documentation
COMMENT ON COLUMN public.content_blocks.type IS 'Type of content block: text, image, video, hero, section, or recommendations';