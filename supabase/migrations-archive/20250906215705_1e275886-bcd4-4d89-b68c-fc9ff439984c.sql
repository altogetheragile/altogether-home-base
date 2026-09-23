-- Remove planning_layer_id column from knowledge_items table
ALTER TABLE public.knowledge_items DROP COLUMN IF EXISTS planning_layer_id;

-- Drop the planning_layers table completely
DROP TABLE IF EXISTS public.planning_layers;