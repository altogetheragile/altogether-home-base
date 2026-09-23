-- Clean Slate Solution: Drop legacy tables and rename v2 tables

-- Step 1: Drop all legacy knowledge tables
DROP TABLE IF EXISTS knowledge_item_tags CASCADE;
DROP TABLE IF EXISTS knowledge_item_relations CASCADE;
DROP TABLE IF EXISTS knowledge_item_planning_layers CASCADE;
DROP TABLE IF EXISTS knowledge_examples CASCADE;
DROP TABLE IF EXISTS knowledge_items CASCADE;
DROP TABLE IF EXISTS knowledge_categories CASCADE;
DROP TABLE IF EXISTS activity_domains CASCADE;
DROP TABLE IF EXISTS planning_layers CASCADE;

-- Step 2: Rename v2 tables to primary names
ALTER TABLE categories_v2 RENAME TO knowledge_categories;
ALTER TABLE domains_v2 RENAME TO activity_domains;
ALTER TABLE planning_layers_v2 RENAME TO planning_layers;
ALTER TABLE knowledge_items_v2 RENAME TO knowledge_items;

-- Step 3: Update RLS policies for renamed tables
-- Knowledge Categories policies
CREATE POLICY "Admins can manage categories" ON knowledge_categories
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view categories" ON knowledge_categories
FOR SELECT USING (true);

-- Activity Domains policies  
CREATE POLICY "Admins can manage domains" ON activity_domains
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view domains" ON activity_domains
FOR SELECT USING (true);

-- Planning Layers policies
CREATE POLICY "Admins can manage planning layers" ON planning_layers
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view planning layers" ON planning_layers
FOR SELECT USING (true);

-- Knowledge Items policies
CREATE POLICY "Admins can manage knowledge items" ON knowledge_items
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view published knowledge items" ON knowledge_items
FOR SELECT USING (is_published = true);