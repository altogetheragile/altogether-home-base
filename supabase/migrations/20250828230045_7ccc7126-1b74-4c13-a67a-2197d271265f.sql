-- Clean up database - keep only knowledge items from latest import

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

    -- Remove knowledge item planning layer relationships
    DELETE FROM knowledge_item_planning_layers 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Remove knowledge media
    DELETE FROM knowledge_media 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Remove knowledge examples
    DELETE FROM knowledge_examples 
    WHERE knowledge_item_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Remove knowledge item relations
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

    -- Remove user bookmarks for old items
    DELETE FROM user_bookmarks 
    WHERE technique_id IN (
        SELECT ki.id FROM knowledge_items ki
        WHERE NOT EXISTS (
            SELECT 1 FROM staging_data sd 
            WHERE sd.import_id = latest_import_id 
            AND sd.target_record_id = ki.id
        )
    );

    -- Remove feedback for old items
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

    -- Step 3: Clean up unused categories that have no knowledge items
    DELETE FROM knowledge_categories 
    WHERE id NOT IN (
        SELECT DISTINCT category_id 
        FROM knowledge_items 
        WHERE category_id IS NOT NULL
    );

    -- Step 4: Update tag usage counts
    UPDATE knowledge_tags 
    SET usage_count = (
        SELECT COUNT(*) 
        FROM knowledge_item_tags 
        WHERE tag_id = knowledge_tags.id
    );

    -- Remove tags with zero usage
    DELETE FROM knowledge_tags 
    WHERE usage_count = 0;

    -- Step 5: Update import status - just add to processing log, don't change status
    UPDATE data_imports 
    SET 
        processing_log = COALESCE(processing_log, '[]'::jsonb) || 
            jsonb_build_object(
                'cleanup_timestamp', now(),
                'old_items_removed', old_items_count,
                'action', 'database_cleanup_completed'
            )::jsonb
    WHERE id = latest_import_id;

    RAISE NOTICE 'Database cleanup completed successfully. Removed % old knowledge items and related data.', old_items_count;
END $$;