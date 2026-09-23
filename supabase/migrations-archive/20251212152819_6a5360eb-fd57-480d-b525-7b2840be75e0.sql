-- Add item_type column to backlog_items for Epic/Feature/Story hierarchy
ALTER TABLE backlog_items 
ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'story';

-- Add check constraint for valid item types
ALTER TABLE backlog_items 
ADD CONSTRAINT backlog_items_item_type_check 
CHECK (item_type IN ('epic', 'feature', 'story'));

-- Create index for faster parent-child queries
CREATE INDEX IF NOT EXISTS idx_backlog_items_parent_item_id ON backlog_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_backlog_items_item_type ON backlog_items(item_type);