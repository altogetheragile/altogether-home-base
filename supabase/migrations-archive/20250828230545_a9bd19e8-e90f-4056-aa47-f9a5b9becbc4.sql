-- Drop and recreate the trigger and function to ensure clean state, then perform cleanup

-- Drop any existing triggers that might reference the old function
DROP TRIGGER IF EXISTS update_knowledge_technique_tags_usage_count ON knowledge_item_tags;
DROP TRIGGER IF EXISTS update_knowledge_item_tags_usage_count ON knowledge_item_tags;

-- Drop and recreate the function with correct table name
DROP FUNCTION IF EXISTS public.update_tag_usage_count();

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

-- Recreate the trigger with the correct function
CREATE TRIGGER update_knowledge_item_tags_usage_count
    AFTER INSERT OR DELETE ON knowledge_item_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Now perform the cleanup without triggers interfering
DO $$
DECLARE
    latest_import_id uuid;
    old_items_count integer;
BEGIN
    -- Get the latest import ID for the Excel file
    SELECT id INTO latest_import_id
    FROM data_imports 
    WHERE original_filename = '20250828_Agile_Planning_Activities_With_BMC.xlsx'
    ORDER BY created_at DESC 
    LIMIT 1;

    IF latest_import_id IS NULL THEN
        RAISE EXCEPTION 'Could not find import for 20250828_Agile_Planning_Activities_With_BMC.xlsx';
    END IF;

    -- Count old items for logging
    SELECT COUNT(*) INTO old_items_count
    FROM knowledge_items ki
    WHERE NOT EXISTS (
        SELECT 1 FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id = ki.id
    );

    RAISE NOTICE 'Found % old knowledge items to remove', old_items_count;

    -- Temporarily disable the trigger to avoid issues during bulk deletion
    ALTER TABLE knowledge_item_tags DISABLE TRIGGER update_knowledge_item_tags_usage_count;

    -- Step 1: Remove related data for old knowledge items
    
    -- Remove knowledge item tag relationships
    DELETE FROM knowledge_item_tags 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Re-enable the trigger
    ALTER TABLE knowledge_item_tags ENABLE TRIGGER update_knowledge_item_tags_usage_count;

    -- Remove other related data
    DELETE FROM knowledge_item_planning_layers 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    DELETE FROM knowledge_media 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    DELETE FROM knowledge_examples 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    DELETE FROM knowledge_item_relations 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    ) OR related_knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    DELETE FROM user_bookmarks 
    WHERE technique_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    DELETE FROM kb_feedback 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Step 2: Remove old knowledge items
    DELETE FROM knowledge_items 
    WHERE NOT EXISTS (
        SELECT 1 FROM staging_data sd 
        WHERE sd.import_id = latest_import_id 
        AND sd.target_record_id = knowledge_items.id
    );

    -- Step 3: Clean up unused categories
    DELETE FROM knowledge_categories 
    WHERE id NOT IN (
        SELECT DISTINCT category_id 
        FROM knowledge_items 
        WHERE category_id IS NOT NULL
    );

    -- Step 4: Update tag usage counts and remove unused tags
    UPDATE knowledge_tags 
    SET usage_count = (
        SELECT COUNT(*) 
        FROM knowledge_item_tags 
        WHERE tag_id = knowledge_tags.id
    );

    DELETE FROM knowledge_tags WHERE usage_count = 0;

    -- Step 5: Log the cleanup
    UPDATE data_imports 
    SET processing_log = COALESCE(processing_log, '[]'::jsonb) || 
            jsonb_build_object(
                'cleanup_timestamp', now(),
                'old_items_removed', old_items_count,
                'action', 'database_cleanup_completed'
            )::jsonb
    WHERE id = latest_import_id;

    RAISE NOTICE 'Database cleanup completed successfully. Removed % old knowledge items and related data.', old_items_count;
END $$;