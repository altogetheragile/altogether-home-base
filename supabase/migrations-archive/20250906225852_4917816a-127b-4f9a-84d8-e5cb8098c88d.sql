-- Re-process the failed import to assign correct planning focuses
-- First, let's update all knowledge items to have correct planning focus based on staging data

-- Update knowledge items with Definition & Planning focus
UPDATE knowledge_items 
SET planning_focus_id = (
  SELECT id FROM planning_focuses WHERE name = 'Definition & Planning'
)
WHERE id IN (
  SELECT ki.id 
  FROM knowledge_items ki
  JOIN staging_data sd ON ki.name = sd.raw_data->>'Knowledge Item'
  WHERE sd.import_id = '8ded4552-3617-4b93-a2a4-cf4321047540'
  AND sd.raw_data->>'Planning Focus' = 'Definition & Planning'
);

-- Update knowledge items with Strategy & Vision focus
UPDATE knowledge_items 
SET planning_focus_id = (
  SELECT id FROM planning_focuses WHERE name = 'Strategy & Vision'
)
WHERE id IN (
  SELECT ki.id 
  FROM knowledge_items ki
  JOIN staging_data sd ON ki.name = sd.raw_data->>'Knowledge Item'
  WHERE sd.import_id = '8ded4552-3617-4b93-a2a4-cf4321047540'
  AND sd.raw_data->>'Planning Focus' = 'Strategy & Vision'
);

-- Update knowledge items with Delivery & Build focus
UPDATE knowledge_items 
SET planning_focus_id = (
  SELECT id FROM planning_focuses WHERE name = 'Delivery & Build'
)
WHERE id IN (
  SELECT ki.id 
  FROM knowledge_items ki
  JOIN staging_data sd ON ki.name = sd.raw_data->>'Knowledge Item'
  WHERE sd.import_id = '8ded4552-3617-4b93-a2a4-cf4321047540'
  AND sd.raw_data->>'Planning Focus' = 'Delivery & Build'
);

-- Update knowledge items with Discovery & Exploration focus
UPDATE knowledge_items 
SET planning_focus_id = (
  SELECT id FROM planning_focuses WHERE name = 'Discovery & Exploration'
)
WHERE id IN (
  SELECT ki.id 
  FROM knowledge_items ki
  JOIN staging_data sd ON ki.name = sd.raw_data->>'Knowledge Item'
  WHERE sd.import_id = '8ded4552-3617-4b93-a2a4-cf4321047540'
  AND sd.raw_data->>'Planning Focus' = 'Discovery & Exploration'
);

-- Mark the staging data as processed
UPDATE staging_data 
SET processing_status = 'processed'
WHERE import_id = '8ded4552-3617-4b93-a2a4-cf4321047540';

-- Update the import status
UPDATE data_imports 
SET 
  status = 'completed',
  processed_at = now(),
  successful_rows = 77,
  failed_rows = 1
WHERE id = '8ded4552-3617-4b93-a2a4-cf4321047540';