-- Process staging data into proper knowledge tables (fixed conflicts)
DO $$
DECLARE
    staging_row record;
    category_id uuid;
    domain_id uuid;  
    focus_id uuid;
    planning_layer_id uuid;
    knowledge_item_id uuid;
    tag_id uuid;
BEGIN
    -- Process each staging data row
    FOR staging_row IN 
        SELECT * FROM staging_data 
        WHERE processing_status = 'processed' 
        AND import_id = 'a65d9ece-5a56-4279-a1d9-d50ffcda8d1c'
    LOOP
        -- Create/get category
        IF staging_row.raw_data->>'Category' IS NOT NULL THEN
            INSERT INTO knowledge_categories (name, slug, description, color)
            VALUES (
                staging_row.raw_data->>'Category',
                lower(regexp_replace(staging_row.raw_data->>'Category', '[^a-zA-Z0-9]+', '-', 'g')),
                staging_row.raw_data->>'Category Description',
                '#3B82F6'
            )
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description
            RETURNING id INTO category_id;
            
            IF category_id IS NULL THEN
                SELECT id INTO category_id FROM knowledge_categories 
                WHERE name = staging_row.raw_data->>'Category';
            END IF;
        END IF;
        
        -- Create/get activity domain
        IF staging_row.raw_data->>'Domain' IS NOT NULL THEN
            INSERT INTO activity_domains (name, slug, description, color)
            VALUES (
                staging_row.raw_data->>'Domain',
                lower(regexp_replace(staging_row.raw_data->>'Domain', '[^a-zA-Z0-9]+', '-', 'g')),
                staging_row.raw_data->>'Domain Description',
                '#3B82F6'
            )
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description
            RETURNING id INTO domain_id;
            
            IF domain_id IS NULL THEN
                SELECT id INTO domain_id FROM activity_domains 
                WHERE name = staging_row.raw_data->>'Domain';
            END IF;
        END IF;
        
        -- Create/get activity focus
        IF staging_row.raw_data->>'Focus' IS NOT NULL THEN
            INSERT INTO activity_focus (name, slug, color)
            VALUES (
                staging_row.raw_data->>'Focus',
                lower(regexp_replace(staging_row.raw_data->>'Focus', '[^a-zA-Z0-9]+', '-', 'g')),
                '#3B82F6'
            )
            ON CONFLICT (name) DO NOTHING
            RETURNING id INTO focus_id;
            
            IF focus_id IS NULL THEN
                SELECT id INTO focus_id FROM activity_focus 
                WHERE name = staging_row.raw_data->>'Focus';
            END IF;
        END IF;
        
        -- Create/get planning layer
        IF staging_row.raw_data->>'Planning Layer' IS NOT NULL THEN
            INSERT INTO planning_layers (name, slug, description, color, display_order)
            VALUES (
                staging_row.raw_data->>'Planning Layer',
                lower(regexp_replace(staging_row.raw_data->>'Planning Layer', '[^a-zA-Z0-9]+', '-', 'g')),
                staging_row.raw_data->>'Planning Layer Description',
                '#3B82F6',
                1
            )
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description
            RETURNING id INTO planning_layer_id;
            
            IF planning_layer_id IS NULL THEN
                SELECT id INTO planning_layer_id FROM planning_layers 
                WHERE name = staging_row.raw_data->>'Planning Layer';
            END IF;
        END IF;
        
        -- Create knowledge item
        INSERT INTO knowledge_items (
            name,
            slug, 
            description,
            summary,
            purpose,
            generic_what,
            generic_how,
            generic_when,
            generic_where,
            generic_who,
            generic_why,
            example_what,
            example_how,
            example_when,
            example_where,
            example_who,
            example_why,
            originator,
            category_id,
            activity_domain_id,
            activity_focus_id,
            estimated_reading_time,
            is_published,
            content_type
        )
        VALUES (
            staging_row.raw_data->>'Activity',
            lower(regexp_replace(staging_row.raw_data->>'Activity', '[^a-zA-Z0-9]+', '-', 'g')),
            staging_row.raw_data->>'Activity Description',
            staging_row.raw_data->>'Generic Summary (Narrative Form)',
            staging_row.raw_data->>'Generic Why',
            staging_row.raw_data->>'Generic What',
            staging_row.raw_data->>'Generic How',
            staging_row.raw_data->>'Generic When',
            staging_row.raw_data->>'Generic Where',
            staging_row.raw_data->>'Generic Who',
            staging_row.raw_data->>'Generic Why',
            staging_row.raw_data->>'What',
            staging_row.raw_data->>'How',
            staging_row.raw_data->>'When',
            staging_row.raw_data->>'Where',
            staging_row.raw_data->>'Who',
            staging_row.raw_data->>'Why',
            staging_row.raw_data->>'Background',
            category_id,
            domain_id,
            focus_id,
            5,
            true,
            'technique'
        )
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            summary = EXCLUDED.summary,
            updated_at = now()
        RETURNING id INTO knowledge_item_id;
        
        -- Link to planning layer if exists
        IF planning_layer_id IS NOT NULL THEN
            INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
            VALUES (knowledge_item_id, planning_layer_id, true)
            ON CONFLICT (knowledge_item_id, planning_layer_id) DO NOTHING;
        END IF;
        
        -- Create tags from Source field (treat as a tag)
        IF staging_row.raw_data->>'Source' IS NOT NULL THEN
            INSERT INTO knowledge_tags (name, slug, usage_count)
            VALUES (
                staging_row.raw_data->>'Source',
                lower(regexp_replace(staging_row.raw_data->>'Source', '[^a-zA-Z0-9]+', '-', 'g')),
                1
            )
            ON CONFLICT (name) DO UPDATE SET
                usage_count = knowledge_tags.usage_count + 1
            RETURNING id INTO tag_id;
            
            IF tag_id IS NULL THEN
                SELECT id INTO tag_id FROM knowledge_tags 
                WHERE name = staging_row.raw_data->>'Source';
            END IF;
            
            -- Link tag to knowledge item
            INSERT INTO knowledge_item_tags (knowledge_item_id, tag_id)
            VALUES (knowledge_item_id, tag_id)
            ON CONFLICT (knowledge_item_id, tag_id) DO NOTHING;
        END IF;
        
        -- Update staging record with target_record_id
        UPDATE staging_data 
        SET target_record_id = knowledge_item_id 
        WHERE id = staging_row.id;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully processed staging data into knowledge items';
END $$;