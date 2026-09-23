-- Phase 1: Backup existing data and clean knowledge items
-- Create backup table before deletion
CREATE TABLE IF NOT EXISTS knowledge_items_backup AS 
SELECT * FROM knowledge_items;

-- Delete all existing knowledge items and related data
DELETE FROM knowledge_item_tags;
DELETE FROM knowledge_item_relations;
DELETE FROM knowledge_item_planning_layers;
DELETE FROM knowledge_media;
DELETE FROM knowledge_examples;
DELETE FROM kb_feedback;
DELETE FROM knowledge_items;

-- Update knowledge_items table to match new Excel structure
-- Add missing description fields for enhanced metadata
ALTER TABLE knowledge_categories ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE activity_domains ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE planning_layers ADD COLUMN IF NOT EXISTS full_description text;

-- Update column names to match new Excel naming convention
-- The W5H fields are now split into Generic Use Case and Example Use Case
COMMENT ON COLUMN knowledge_items.generic_who IS 'Generic Use Case - Who';
COMMENT ON COLUMN knowledge_items.generic_what IS 'Generic Use Case - What';
COMMENT ON COLUMN knowledge_items.generic_when IS 'Generic Use Case - When';
COMMENT ON COLUMN knowledge_items.generic_where IS 'Generic Use Case - Where';
COMMENT ON COLUMN knowledge_items.generic_why IS 'Generic Use Case - Why';
COMMENT ON COLUMN knowledge_items.generic_how IS 'Generic Use Case - How';
COMMENT ON COLUMN knowledge_items.generic_how_much IS 'Generic Use Case - How Much';

COMMENT ON COLUMN knowledge_items.example_who IS 'Example / Use Case - Who';
COMMENT ON COLUMN knowledge_items.example_what IS 'Example / Use Case - What';
COMMENT ON COLUMN knowledge_items.example_when IS 'Example / Use Case - When';
COMMENT ON COLUMN knowledge_items.example_where IS 'Example / Use Case - Where';
COMMENT ON COLUMN knowledge_items.example_why IS 'Example / Use Case - Why';
COMMENT ON COLUMN knowledge_items.example_how IS 'Example / Use Case - How';
COMMENT ON COLUMN knowledge_items.example_how_much IS 'Example / Use Case - How Much';
COMMENT ON COLUMN knowledge_items.example_summary IS 'Example / Use Case - Summary (Narrative Form)';

-- Reset auto-increment sequences to ensure clean state
TRUNCATE TABLE knowledge_tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE knowledge_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE activity_domains RESTART IDENTITY CASCADE;
TRUNCATE TABLE activity_focus RESTART IDENTITY CASCADE;
TRUNCATE TABLE activity_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE planning_layers RESTART IDENTITY CASCADE;

-- Add indexes for better performance with new data
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_focus_domain ON knowledge_items(category_id, activity_focus_id, activity_domain_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_content_type ON knowledge_items(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_difficulty ON knowledge_items(difficulty_level);