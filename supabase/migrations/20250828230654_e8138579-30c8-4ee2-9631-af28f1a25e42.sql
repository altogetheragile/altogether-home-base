-- Clean database by properly handling triggers and functions

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON knowledge_item_tags;
DROP TRIGGER IF EXISTS update_knowledge_technique_tags_usage_count ON knowledge_item_tags;
DROP TRIGGER IF EXISTS update_knowledge_item_tags_usage_count ON knowledge_item_tags;

-- Drop and recreate the function with correct table reference
DROP FUNCTION IF EXISTS public.update_tag_usage_count() CASCADE;

CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_item_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_item_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_tag_usage_count
    AFTER INSERT OR DELETE ON knowledge_item_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Now perform the cleanup
DO $$
DECLARE
    latest_import_id uuid;
    old_items_count integer;
BEGIN
    -- Get the latest import ID
    SELECT id INTO latest_import_id
    FROM data_imports 
    WHERE original_filename = '20250828_Agile_Planning_Activities_With_BMC.xlsx'
    ORDER BY created_at DESC 
    LIMIT 1;

    IF latest_import_id IS NULL THEN
        RAISE EXCEPTION 'Could not find import for Excel file';
    END IF;

    -- Count old items
    SELECT COUNT(*) INTO old_items_count
    FROM knowledge_items ki
    WHERE NOT EXISTS (
        SELECT 1 FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id = ki.id
    );

    -- Remove all related data for old items
    DELETE FROM knowledge_item_tags 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM knowledge_item_planning_layers 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM knowledge_media 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM knowledge_examples 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM knowledge_item_relations 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    ) OR related_knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM user_bookmarks 
    WHERE technique_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    DELETE FROM kb_feedback 
    WHERE knowledge_item_id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    -- Remove old knowledge items
    DELETE FROM knowledge_items 
    WHERE id NOT IN (
        SELECT sd.target_record_id 
        FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id IS NOT NULL
    );

    -- Clean up unused categories and tags
    DELETE FROM knowledge_categories 
    WHERE id NOT IN (
        SELECT DISTINCT category_id 
        FROM knowledge_items 
        WHERE category_id IS NOT NULL
    );

    UPDATE knowledge_tags 
    SET usage_count = (
        SELECT COUNT(*) 
        FROM knowledge_item_tags 
        WHERE tag_id = knowledge_tags.id
    );

    DELETE FROM knowledge_tags WHERE usage_count = 0;

    -- Log cleanup
    UPDATE data_imports 
    SET processing_log = COALESCE(processing_log, '[]'::jsonb) || 
            jsonb_build_object(
                'cleanup_timestamp', now(),
                'old_items_removed', old_items_count,
                'action', 'database_cleanup_completed'
            )::jsonb
    WHERE id = latest_import_id;

    RAISE NOTICE 'Successfully removed % old knowledge items and cleaned database', old_items_count;
END $$;