-- Complete KB Deletion and Fresh Start
-- Drop all KB-related tables and their dependencies

-- Drop junction tables first
DROP TABLE IF EXISTS knowledge_item_tags CASCADE;
DROP TABLE IF EXISTS technique_relations CASCADE;
DROP TABLE IF EXISTS technique_comments CASCADE;

-- Drop main knowledge items table
DROP TABLE IF EXISTS knowledge_items CASCADE;

-- Drop reference tables
DROP TABLE IF EXISTS knowledge_categories CASCADE;
DROP TABLE IF EXISTS knowledge_tags CASCADE;
DROP TABLE IF EXISTS activity_domains CASCADE;
DROP TABLE IF EXISTS planning_layers CASCADE;

-- Drop staging data for KB imports
DELETE FROM staging_data WHERE import_id IN (
  SELECT id FROM data_imports WHERE target_entity = 'knowledge_items'
);

-- Drop import records for KB
DELETE FROM data_imports WHERE target_entity = 'knowledge_items';

-- Drop any search analytics related to KB
DELETE FROM search_analytics WHERE clicked_technique_id IS NOT NULL;