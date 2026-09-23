-- Phase 1: Insert the 4 new categories
INSERT INTO public.knowledge_categories (name, slug, description, color, display_order)
VALUES
  ('Governance', 'governance', 'Responsible oversight, risk management, and continuous improvement', '#8b5cf6', 1),
  ('Strategy', 'strategy', 'Vision, goals, and decision-making for direction and value', '#3b82f6', 2),
  ('Operations', 'operations', 'Planning, coordination, and execution of work', '#10b981', 3),
  ('Support', 'support', 'Enabling collaboration, facilitation, and communication', '#f59e0b', 4);

-- Phase 2: Migrate knowledge_item_categories to new categories
-- Map Direction & Alignment + Insight & Understanding -> Strategy
UPDATE public.knowledge_item_categories 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'strategy')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug IN ('direction-alignment', 'insight-understanding')
);

-- Map Decision & Planning + Flow & Delivery -> Operations
UPDATE public.knowledge_item_categories 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'operations')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug IN ('decision-planning', 'flow-delivery')
);

-- Map Assurance & Adaptation -> Governance
UPDATE public.knowledge_item_categories 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'governance')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug = 'assurance-adaptation'
);

-- Map Enabling Practices -> Support
UPDATE public.knowledge_item_categories 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'support')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug = 'enabling-practices'
);

-- Phase 3: Also update the legacy category_id column on knowledge_items table
UPDATE public.knowledge_items 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'strategy')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug IN ('direction-alignment', 'insight-understanding')
);

UPDATE public.knowledge_items 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'operations')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug IN ('decision-planning', 'flow-delivery')
);

UPDATE public.knowledge_items 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'governance')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug = 'assurance-adaptation'
);

UPDATE public.knowledge_items 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE slug = 'support')
WHERE category_id IN (
  SELECT id FROM public.knowledge_categories WHERE slug = 'enabling-practices'
);

-- Phase 4: Delete old categories
DELETE FROM public.knowledge_categories 
WHERE slug IN ('direction-alignment', 'insight-understanding', 'decision-planning', 'flow-delivery', 'assurance-adaptation', 'enabling-practices');