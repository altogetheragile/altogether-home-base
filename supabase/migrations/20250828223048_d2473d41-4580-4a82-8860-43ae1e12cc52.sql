-- Process staging data into knowledge items, handling duplicates safely
WITH deduplicated_staging AS (
  SELECT DISTINCT ON (LOWER(REGEXP_REPLACE(
    COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name', 'unnamed-activity'), 
    '[^a-zA-Z0-9]+', '-', 'g'
  )))
    s.id as staging_id,
    s.raw_data,
    s.import_id,
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
    s.raw_data->>'Planning Layer' as planning_layer
  FROM staging_data s
  WHERE s.processing_status = 'pending'
    AND s.import_id IN (
      SELECT id FROM data_imports 
      WHERE target_entity = 'knowledge_items' 
      AND status = 'uploaded'
    )
    AND COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name') IS NOT NULL
  ORDER BY LOWER(REGEXP_REPLACE(
    COALESCE(s.raw_data->>'Activity', s.raw_data->>'Name', 'unnamed-activity'), 
    '[^a-zA-Z0-9]+', '-', 'g'
  )), s.id -- Use ID as tiebreaker for consistent results
),

-- Insert knowledge items
inserted_items AS (
  INSERT INTO knowledge_items (
    name, description, summary, purpose, slug, 
    category_id, activity_domain_id, activity_focus_id,
    team_size_min, team_size_max, duration_min_minutes, duration_max_minutes,
    is_published, content_type, created_by, created_at, updated_at
  )
  SELECT 
    ds.name,
    ds.description,
    ds.summary,
    ds.purpose,
    ds.slug,
    ds.category_id,
    ds.activity_domain_id,
    ds.activity_focus_id,
    ds.team_size_min,
    ds.team_size_max,
    ds.duration_min_minutes,
    ds.duration_max_minutes,
    false as is_published,
    'technique' as content_type,
    NULL as created_by, -- Allow NULL for service operations
    now() as created_at,
    now() as updated_at
  FROM deduplicated_staging ds
  WHERE ds.slug NOT IN (SELECT slug FROM knowledge_items)
  RETURNING id, slug, name
),

-- Create planning layer relationships for new items
planning_relationships AS (
  INSERT INTO knowledge_item_planning_layers (
    knowledge_item_id, planning_layer_id, is_primary, created_at
  )
  SELECT DISTINCT
    ii.id as knowledge_item_id,
    pl.id as planning_layer_id,
    true as is_primary,
    now() as created_at
  FROM inserted_items ii
  JOIN deduplicated_staging ds ON ds.slug = ii.slug
  JOIN planning_layers pl ON pl.name ILIKE TRIM(ds.planning_layer)
  WHERE ds.planning_layer IS NOT NULL
  ON CONFLICT (knowledge_item_id, planning_layer_id) DO NOTHING
  RETURNING knowledge_item_id, planning_layer_id
)

-- Mark all staging data as processed
UPDATE staging_data 
SET processing_status = 'processed', 
    processed_at = now()
WHERE processing_status = 'pending'
  AND import_id IN (
    SELECT id FROM data_imports 
    WHERE target_entity = 'knowledge_items' 
    AND status = 'uploaded'
  );