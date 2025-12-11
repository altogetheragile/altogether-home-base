-- Add parent story reference to user_stories for story splitting
ALTER TABLE public.user_stories 
ADD COLUMN parent_story_id uuid REFERENCES public.user_stories(id) ON DELETE SET NULL;

-- Add parent item reference to backlog_items for story splitting
ALTER TABLE public.backlog_items 
ADD COLUMN parent_item_id uuid REFERENCES public.backlog_items(id) ON DELETE SET NULL;

-- Add indexes for efficient querying of child stories
CREATE INDEX idx_user_stories_parent ON public.user_stories(parent_story_id) WHERE parent_story_id IS NOT NULL;
CREATE INDEX idx_backlog_items_parent ON public.backlog_items(parent_item_id) WHERE parent_item_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_stories.parent_story_id IS 'Reference to parent story when this story was created by splitting acceptance criteria';
COMMENT ON COLUMN public.backlog_items.parent_item_id IS 'Reference to parent backlog item when this item was created by splitting acceptance criteria';