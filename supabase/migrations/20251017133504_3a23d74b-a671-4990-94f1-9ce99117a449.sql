-- Add show_in_main_menu column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_in_main_menu boolean DEFAULT true;

-- Update existing special pages to match requirements
UPDATE pages SET show_in_main_menu = true WHERE slug IN ('events', 'knowledge', 'blog');

-- Seed test data for requirements validation
INSERT INTO pages (slug, title, description, is_published, show_in_main_menu)
VALUES 
  ('home', 'Home', 'Welcome to AltogetherAgile', true, true),
  ('about', 'About', 'Learn about our company', true, true),
  ('features', 'Features', 'Explore our features', true, true),
  ('beta', 'Beta Preview', 'Try our beta features', true, false),
  ('draft-policy', 'Policy (Draft)', 'Internal policy draft', false, false)
ON CONFLICT (slug) DO UPDATE SET
  is_published = EXCLUDED.is_published,
  show_in_main_menu = EXCLUDED.show_in_main_menu;