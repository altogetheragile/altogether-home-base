-- Update database functions to use correct table names
UPDATE supabase.rpc SET function_name = 'increment_knowledge_item_view_count' WHERE function_name = 'increment_view_count';

DROP FUNCTION IF EXISTS public.increment_view_count(uuid);

CREATE OR REPLACE FUNCTION public.increment_knowledge_item_view_count(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.knowledge_items 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id;
END;
$function$;

-- Simple data processing approach - just copy the first few records for testing
INSERT INTO knowledge_items (name, slug, description, summary, is_published, estimated_reading_time, content_type)
SELECT 
    raw_data->>'Activity' as name,
    lower(regexp_replace(raw_data->>'Activity', '[^a-zA-Z0-9]+', '-', 'g')) as slug,
    raw_data->>'Activity Description' as description,
    raw_data->>'Generic Summary (Narrative Form)' as summary,
    true as is_published,
    5 as estimated_reading_time,
    'technique' as content_type
FROM staging_data 
WHERE processing_status = 'processed' 
AND import_id = 'a65d9ece-5a56-4279-a1d9-d50ffcda8d1c'
AND raw_data->>'Activity' IS NOT NULL
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- Insert categories
INSERT INTO knowledge_categories (name, slug, description, color)
SELECT DISTINCT
    raw_data->>'Category' as name,
    lower(regexp_replace(raw_data->>'Category', '[^a-zA-Z0-9]+', '-', 'g')) as slug,
    raw_data->>'Category Description' as description,
    '#3B82F6' as color
FROM staging_data 
WHERE processing_status = 'processed' 
AND import_id = 'a65d9ece-5a56-4279-a1d9-d50ffcda8d1c'
AND raw_data->>'Category' IS NOT NULL
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;