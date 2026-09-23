-- Clear junction table references first
DELETE FROM public.knowledge_item_categories;

-- Clear legacy category_id on knowledge_items
UPDATE public.knowledge_items SET category_id = NULL;

-- Delete all existing categories (the incorrect ones)
DELETE FROM public.knowledge_categories;

-- Insert the correct 8 categories from the PDF
INSERT INTO public.knowledge_categories (name, slug, description, color, display_order)
VALUES
  ('Direction and Alignment', 'direction-alignment', 'Need to establish or realign purpose, goals, or outcomes', '#3b82f6', 1),
  ('Explore & Understand', 'explore-understand', 'Need to build insight before committing to action', '#8b5cf6', 2),
  ('Estimate, Prioritise & Plan', 'estimate-prioritise-plan', 'Need to choose between options under constraint', '#06b6d4', 3),
  ('Ways of Working & Collaboration', 'ways-of-working-collaboration', 'Need to agree how people will work together', '#10b981', 4),
  ('Build & Deliver', 'build-deliver', 'Need to progress committed work toward completion', '#22c55e', 5),
  ('Run & Realise Value', 'run-realise-value', 'Need to operate live work and realise benefits', '#f59e0b', 6),
  ('Learn & Improve', 'learn-improve', 'Need to reflect, learn, and adapt based on outcomes', '#ef4444', 7),
  ('Support Practice', 'support-practice', 'Need to enable or strengthen other practices', '#6b7280', 8);