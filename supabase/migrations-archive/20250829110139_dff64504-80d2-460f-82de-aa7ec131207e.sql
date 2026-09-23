-- Add focus_description field to knowledge_items table
ALTER TABLE public.knowledge_items 
ADD COLUMN focus_description TEXT;