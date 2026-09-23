-- Bulk assign categories to knowledge items based on keyword matching
-- Items can belong to multiple categories

-- Direction and Alignment
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'direction-alignment'
AND ki.is_published = true
AND (
  ki.name ILIKE '%vision%' OR ki.name ILIKE '%roadmap%' OR 
  ki.name ILIKE '%goal%' OR ki.name ILIKE '%strategy%' OR
  ki.name ILIKE '%okr%' OR ki.name ILIKE '%objective%' OR
  ki.name ILIKE '%mission%' OR ki.name ILIKE '%charter%' OR
  ki.name ILIKE '%north star%' OR ki.name ILIKE '%purpose%'
)
ON CONFLICT DO NOTHING;

-- Explore & Understand  
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'explore-understand'
AND ki.is_published = true
AND (
  ki.name ILIKE '%research%' OR ki.name ILIKE '%discovery%' OR
  ki.name ILIKE '%interview%' OR ki.name ILIKE '%persona%' OR
  ki.name ILIKE '%empathy%' OR ki.name ILIKE '%journey%' OR
  ki.name ILIKE '%user story%' OR ki.name ILIKE '%assumption%' OR
  ki.name ILIKE '%hypothesis%' OR ki.name ILIKE '%contextual%' OR
  ki.name ILIKE '%stakeholder%' OR ki.name ILIKE '%customer%'
)
ON CONFLICT DO NOTHING;

-- Estimate, Prioritise & Plan
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'estimate-prioritise-plan'
AND ki.is_published = true
AND (
  ki.name ILIKE '%estimat%' OR ki.name ILIKE '%priorit%' OR
  ki.name ILIKE '%plan%' OR ki.name ILIKE '%backlog%' OR
  ki.name ILIKE '%cost of delay%' OR ki.name ILIKE '%moscow%' OR
  ki.name ILIKE '%story point%' OR ki.name ILIKE '%sizing%' OR
  ki.name ILIKE '%wsjf%' OR ki.name ILIKE '%poker%' OR
  ki.name ILIKE '%refinement%' OR ki.name ILIKE '%grooming%'
)
ON CONFLICT DO NOTHING;

-- Ways of Working & Collaboration
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'ways-of-working-collaboration'
AND ki.is_published = true
AND (
  ki.name ILIKE '%working agreement%' OR ki.name ILIKE '%team%' OR
  ki.name ILIKE '%stand-up%' OR ki.name ILIKE '%standup%' OR
  ki.name ILIKE '%daily%' OR ki.name ILIKE '%ceremony%' OR
  ki.name ILIKE '%meeting%' OR ki.name ILIKE '%facilitat%' OR
  ki.name ILIKE '%workshop%' OR ki.name ILIKE '%collaboration%' OR
  ki.name ILIKE '%contract%' OR ki.name ILIKE '%norm%'
)
ON CONFLICT DO NOTHING;

-- Build & Deliver
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'build-deliver'
AND ki.is_published = true
AND (
  ki.name ILIKE '%sprint%' OR ki.name ILIKE '%kanban%' OR
  ki.name ILIKE '%acceptance%' OR ki.name ILIKE '%definition of done%' OR
  ki.name ILIKE '%increment%' OR ki.name ILIKE '%delivery%' OR
  ki.name ILIKE '%cumulative%' OR ki.name ILIKE '%flow%' OR
  ki.name ILIKE '%wip%' OR ki.name ILIKE '%cycle time%' OR
  ki.name ILIKE '%throughput%' OR ki.name ILIKE '%lead time%'
)
ON CONFLICT DO NOTHING;

-- Run & Realise Value
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'run-realise-value'
AND ki.is_published = true
AND (
  ki.name ILIKE '%monitor%' OR ki.name ILIKE '%metric%' OR
  ki.name ILIKE '%kpi%' OR ki.name ILIKE '%value stream%' OR
  ki.name ILIKE '%a/b test%' OR ki.name ILIKE '%experiment%' OR
  ki.name ILIKE '%analytics%' OR ki.name ILIKE '%release%' OR
  ki.name ILIKE '%outcome%' OR ki.name ILIKE '%benefit%'
)
ON CONFLICT DO NOTHING;

-- Learn & Improve
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'learn-improve'
AND ki.is_published = true
AND (
  ki.name ILIKE '%retrospective%' OR ki.name ILIKE '%retro%' OR
  ki.name ILIKE '%review%' OR ki.name ILIKE '%feedback%' OR
  ki.name ILIKE '%lesson%' OR ki.name ILIKE '%improvement%' OR
  ki.name ILIKE '%reflect%' OR ki.name ILIKE '%5 why%' OR
  ki.name ILIKE '%inspect%' OR ki.name ILIKE '%adapt%' OR
  ki.name ILIKE '%kaizen%' OR ki.name ILIKE '%root cause%'
)
ON CONFLICT DO NOTHING;

-- Support Practice (broad category for tools, canvases, techniques)
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'support-practice'
AND ki.is_published = true
AND (
  ki.name ILIKE '%canvas%' OR ki.name ILIKE '%map%' OR
  ki.name ILIKE '%diagram%' OR ki.name ILIKE '%model%' OR
  ki.name ILIKE '%template%' OR ki.name ILIKE '%matrix%' OR
  ki.name ILIKE '%framework%' OR ki.name ILIKE '%technique%'
)
ON CONFLICT DO NOTHING;

-- Fallback: Assign uncategorized items to "Support Practice"
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT ki.id, kc.id
FROM public.knowledge_items ki
CROSS JOIN public.knowledge_categories kc
WHERE kc.slug = 'support-practice'
AND ki.is_published = true
AND NOT EXISTS (
  SELECT 1 FROM public.knowledge_item_categories kic 
  WHERE kic.knowledge_item_id = ki.id
)
ON CONFLICT DO NOTHING;