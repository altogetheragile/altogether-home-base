-- Process staging data into knowledge items with relationships
WITH batch_processing AS (
  -- First, insert knowledge items from staging data
  INSERT INTO knowledge_items (
    name, description, summary, purpose, slug, 
    category_id, activity_domain_id, activity_focus_id,
    team_size_min, team_size_max, duration_min_minutes, duration_max_minutes,
    is_published, content_type, created_by, created_at, updated_at
  )
  SELECT DISTINCT
    COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name', 'Unnamed Activity') as name,
    COALESCE(s.raw_data->>'Activity Description', s.raw_data->>'Description') as description,
    COALESCE(s.raw_data->>'Generic Summary (Narrative Form)', s.raw_data->>'Summary') as summary,
    s.raw_data->>'Generic Why' as purpose,
    LOWER(REGEXP_REPLACE(
      COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name', 'unnamed-activity'), 
      '[^a-zA-Z0-9]+', '-', 'g'
    )) as slug,
    -- Category lookup
    (SELECT id FROM knowledge_categories WHERE name ILIKE TRIM(s.raw_data->>'Category')) as category_id,
    -- Domain lookup  
    (SELECT id FROM activity_domains WHERE name ILIKE TRIM(s.raw_data->>'Domain')) as activity_domain_id,
    -- Focus lookup
    (SELECT id FROM activity_focus WHERE name ILIKE TRIM(s.raw_data->>'Focus')) as activity_focus_id,
    -- Team size
    CASE 
      WHEN s.raw_data->>'Min Team Size' ~ '^[0-9]+$' 
      THEN (s.raw_data->>'Min Team Size')::integer 
      ELSE NULL 
    END as team_size_min,
    CASE 
      WHEN s.raw_data->>'Max Team Size' ~ '^[0-9]+$' 
      THEN (s.raw_data->>'Max Team Size')::integer 
      ELSE NULL 
    END as team_size_max,
    -- Duration
    CASE 
      WHEN s.raw_data->>'Min Duration (minutes)' ~ '^[0-9]+$' 
      THEN (s.raw_data->>'Min Duration (minutes)')::integer 
      ELSE NULL 
    END as duration_min_minutes,
    CASE 
      WHEN s.raw_data->>'Max Duration (minutes)' ~ '^[0-9]+$' 
      THEN (s.raw_data->>'Max Duration (minutes)')::integer 
      ELSE NULL 
    END as duration_max_minutes,
    false as is_published, -- Set to false initially
    'technique' as content_type,
    (SELECT auth.uid()) as created_by,
    now() as created_at,
    now() as updated_at
  FROM staging_data s
  WHERE s.processing_status = 'pending'
    AND s.import_id IN (
      SELECT id FROM data_imports 
      WHERE target_entity = 'knowledge_items' 
      AND status = 'uploaded'
    )
    AND COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name') IS NOT NULL
  ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    summary = EXCLUDED.summary,
    updated_at = now()
  RETURNING id, slug, name
),

-- Create planning layer relationships
planning_relationships AS (
  INSERT INTO knowledge_item_planning_layers (
    knowledge_item_id, planning_layer_id, is_primary, created_at
  )
  SELECT DISTINCT
    ki.id as knowledge_item_id,
    pl.id as planning_layer_id,
    true as is_primary, -- Mark as primary for now
    now() as created_at
  FROM batch_processing ki
  JOIN staging_data s ON s.raw_data->>'Activity' = ki.name OR s.raw_data->>'Name' = ki.name
  JOIN planning_layers pl ON pl.name ILIKE TRIM(s.raw_data->>'Planning Layer')
  WHERE s.processing_status = 'pending'
    AND s.raw_data->>'Planning Layer' IS NOT NULL
  ON CONFLICT (knowledge_item_id, planning_layer_id) DO NOTHING
  RETURNING knowledge_item_id, planning_layer_id
)

-- Update staging data status to processed
UPDATE staging_data 
SET processing_status = 'processed', 
    processed_at = now()
WHERE processing_status = 'pending'
  AND import_id IN (
    SELECT id FROM data_imports 
    WHERE target_entity = 'knowledge_items' 
    AND status = 'uploaded'
  )
  AND COALESCE(raw_data->>'Activity', raw_data->>'Name') IS NOT NULL;

-- Update import records status
UPDATE data_imports 
SET status = 'completed',
    processed_at = now(),
    processing_log = processing_log || jsonb_build_array(
      jsonb_build_object(
        'timestamp', now(),
        'message', 'Successfully processed staging data into knowledge items',
        'level', 'info'
      )
    )
WHERE target_entity = 'knowledge_items' 
  AND status = 'uploaded';