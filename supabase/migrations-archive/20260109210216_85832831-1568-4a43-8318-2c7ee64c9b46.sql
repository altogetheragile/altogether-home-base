-- Add new fields to knowledge_items table for enhanced Read/Edit views
ALTER TABLE public.knowledge_items
ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'technique',
ADD COLUMN IF NOT EXISTS why_it_exists text,
ADD COLUMN IF NOT EXISTS typical_output text,
ADD COLUMN IF NOT EXISTS what_good_looks_like text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS decisions_supported text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS decision_boundaries text,
ADD COLUMN IF NOT EXISTS governance_value text,
ADD COLUMN IF NOT EXISTS use_this_when text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avoid_when text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS inspect_adapt_signals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS maturity_indicators text[] DEFAULT '{}';

-- Add is_primary and rationale to knowledge_item_categories junction table
ALTER TABLE public.knowledge_item_categories
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rationale text;

-- Add is_primary and rationale to knowledge_item_decision_levels junction table
ALTER TABLE public.knowledge_item_decision_levels
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rationale text;

-- Add is_primary and rationale to knowledge_item_domains junction table
ALTER TABLE public.knowledge_item_domains
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rationale text;

-- Create knowledge_item_relationships table for linking related techniques
CREATE TABLE IF NOT EXISTS public.knowledge_item_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  related_item_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'pairs_with',
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_item_relationships_unique UNIQUE (knowledge_item_id, related_item_id, relationship_type),
  CONSTRAINT knowledge_item_relationships_no_self CHECK (knowledge_item_id != related_item_id)
);

-- Enable RLS on the new table
ALTER TABLE public.knowledge_item_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for knowledge_item_relationships
CREATE POLICY "Knowledge item relationships are viewable by everyone"
ON public.knowledge_item_relationships
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage knowledge item relationships"
ON public.knowledge_item_relationships
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_item_relationships_item 
ON public.knowledge_item_relationships(knowledge_item_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_item_relationships_related 
ON public.knowledge_item_relationships(related_item_id);