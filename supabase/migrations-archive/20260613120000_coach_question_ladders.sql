-- Coach question ladders (VISION_TO_VALUE.md: per-cell coach grounding).
-- Coaching questions live as knowledge_items with item_type 'question', linked to
-- the artifact they coach by coaches_slug, with a cell key, a rung
-- (open | follow_up | stretch) and a ladder order. These columns are sparse: only
-- 'question' rows populate them. item_type is free text on knowledge_items (it
-- already holds 'event'), so no constraint change is needed.

alter table public.knowledge_items
  add column if not exists coaches_slug text,
  add column if not exists cell_key text,
  add column if not exists rung text,
  add column if not exists ladder_order int;
