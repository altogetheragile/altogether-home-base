-- Add icon and emoji columns to knowledge_items table
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS emoji text;