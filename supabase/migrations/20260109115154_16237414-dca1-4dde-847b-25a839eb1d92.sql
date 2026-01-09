-- Phase 1: Unified Taxonomy System Database Changes

-- 1.1 Create decision_levels table
CREATE TABLE public.decision_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.decision_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decision_levels
CREATE POLICY "Decision levels are viewable by everyone" 
  ON public.decision_levels FOR SELECT USING (true);

CREATE POLICY "Only admins can insert decision levels" 
  ON public.decision_levels FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update decision levels" 
  ON public.decision_levels FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Only admins can delete decision levels" 
  ON public.decision_levels FOR DELETE 
  USING (public.is_admin());

-- Insert the 4 decision levels
INSERT INTO public.decision_levels (name, slug, description, color, display_order) VALUES
  ('Strategic Direction', 'strategic-direction', 'Sets intent, outcomes, and investment boundaries', '#8b5cf6', 1),
  ('Coordination', 'coordination', 'Aligns and sequences work across initiatives and teams', '#3b82f6', 2),
  ('Teams', 'teams', 'Execute, operate, support, and improve solutions and services', '#10b981', 3),
  ('General', 'general', 'Applies broadly across all decision contexts', '#6b7280', 4);

-- 1.2 Create junction table for knowledge_item_decision_levels
CREATE TABLE public.knowledge_item_decision_levels (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  decision_level_id UUID NOT NULL REFERENCES public.decision_levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (knowledge_item_id, decision_level_id)
);

ALTER TABLE public.knowledge_item_decision_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Junction viewable by everyone" 
  ON public.knowledge_item_decision_levels FOR SELECT USING (true);

CREATE POLICY "Only admins can insert" 
  ON public.knowledge_item_decision_levels FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete" 
  ON public.knowledge_item_decision_levels FOR DELETE 
  USING (public.is_admin());

-- 1.3 Create junction table for knowledge_item_categories (replacing single FK)
CREATE TABLE public.knowledge_item_categories (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.knowledge_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (knowledge_item_id, category_id)
);

ALTER TABLE public.knowledge_item_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Junction viewable by everyone" 
  ON public.knowledge_item_categories FOR SELECT USING (true);

CREATE POLICY "Only admins can insert" 
  ON public.knowledge_item_categories FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete" 
  ON public.knowledge_item_categories FOR DELETE 
  USING (public.is_admin());

-- 1.4 Create junction table for knowledge_item_domains (replacing single FK)
CREATE TABLE public.knowledge_item_domains (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.activity_domains(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (knowledge_item_id, domain_id)
);

ALTER TABLE public.knowledge_item_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Junction viewable by everyone" 
  ON public.knowledge_item_domains FOR SELECT USING (true);

CREATE POLICY "Only admins can insert" 
  ON public.knowledge_item_domains FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete" 
  ON public.knowledge_item_domains FOR DELETE 
  USING (public.is_admin());

-- 1.5 Migrate existing category_id data to junction table
INSERT INTO public.knowledge_item_categories (knowledge_item_id, category_id)
SELECT id, category_id FROM public.knowledge_items WHERE category_id IS NOT NULL;

-- 1.6 Migrate existing domain_id data to junction table
INSERT INTO public.knowledge_item_domains (knowledge_item_id, domain_id)
SELECT id, domain_id FROM public.knowledge_items WHERE domain_id IS NOT NULL;

-- 1.7 Migrate planning_focus_id to decision_levels via junction table
-- Map: Organisational Direction -> Strategic Direction, Coordination -> Coordination, 
-- Teams -> Teams, Realisation & Improvement -> General, General -> General
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT 
  ki.id,
  CASE pf.slug
    WHEN 'organisational-direction' THEN (SELECT id FROM public.decision_levels WHERE slug = 'strategic-direction')
    WHEN 'coordination' THEN (SELECT id FROM public.decision_levels WHERE slug = 'coordination')
    WHEN 'teams' THEN (SELECT id FROM public.decision_levels WHERE slug = 'teams')
    WHEN 'realisation-improvement' THEN (SELECT id FROM public.decision_levels WHERE slug = 'general')
    WHEN 'general' THEN (SELECT id FROM public.decision_levels WHERE slug = 'general')
    ELSE (SELECT id FROM public.decision_levels WHERE slug = 'general')
  END
FROM public.knowledge_items ki
JOIN public.planning_focuses pf ON ki.planning_focus_id = pf.id
WHERE ki.planning_focus_id IS NOT NULL;

-- 1.8 Update activity_domains descriptions to match PDF
UPDATE public.activity_domains SET 
  description = 'Vision, outcomes, benefits, and business value',
  full_description = 'Focuses on defining and communicating the vision, desired outcomes, expected benefits, and overall business value that guides decision-making and prioritization.'
WHERE slug = 'value-ownership';

UPDATE public.activity_domains SET 
  description = 'Enabling effective delivery through coordination and facilitation',
  full_description = 'Focuses on enabling effective delivery by coordinating activities, facilitating collaboration, removing impediments, and ensuring teams have what they need to succeed.'
WHERE slug = 'delivery-enablement';

UPDATE public.activity_domains SET 
  description = 'Creating, evolving, and validating the solution',
  full_description = 'Focuses on the hands-on work of creating, evolving, testing, and validating the solution to meet user needs and business objectives.'
WHERE slug = 'solution-delivery';

-- Add updated_at trigger for decision_levels
CREATE TRIGGER update_decision_levels_updated_at
  BEFORE UPDATE ON public.decision_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();