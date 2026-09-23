-- Phase 1: Knowledge Items Transformation
-- Rename knowledge_techniques to knowledge_items and add rich data structure

-- First, create the four dimension tables
CREATE TABLE IF NOT EXISTS public.activity_focus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planning_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add rich data fields to knowledge_techniques (will rename to knowledge_items after)
ALTER TABLE public.knowledge_techniques 
ADD COLUMN IF NOT EXISTS activity_focus_id UUID REFERENCES public.activity_focus(id),
ADD COLUMN IF NOT EXISTS activity_domain_id UUID REFERENCES public.activity_domains(id),
ADD COLUMN IF NOT EXISTS activity_category_id UUID REFERENCES public.activity_categories(id),
ADD COLUMN IF NOT EXISTS generic_who TEXT,
ADD COLUMN IF NOT EXISTS generic_what TEXT,
ADD COLUMN IF NOT EXISTS generic_when TEXT,
ADD COLUMN IF NOT EXISTS generic_where TEXT,
ADD COLUMN IF NOT EXISTS generic_why TEXT,
ADD COLUMN IF NOT EXISTS generic_how TEXT,
ADD COLUMN IF NOT EXISTS example_who TEXT,
ADD COLUMN IF NOT EXISTS example_what TEXT,
ADD COLUMN IF NOT EXISTS example_when TEXT,
ADD COLUMN IF NOT EXISTS example_where TEXT,
ADD COLUMN IF NOT EXISTS example_why TEXT,
ADD COLUMN IF NOT EXISTS example_how TEXT,
ADD COLUMN IF NOT EXISTS planning_considerations TEXT,
ADD COLUMN IF NOT EXISTS typical_participants TEXT[],
ADD COLUMN IF NOT EXISTS required_skills TEXT[],
ADD COLUMN IF NOT EXISTS success_criteria TEXT[],
ADD COLUMN IF NOT EXISTS common_pitfalls TEXT[],
ADD COLUMN IF NOT EXISTS related_practices TEXT[],
ADD COLUMN IF NOT EXISTS industry_context TEXT,
ADD COLUMN IF NOT EXISTS team_size_min INTEGER,
ADD COLUMN IF NOT EXISTS team_size_max INTEGER,
ADD COLUMN IF NOT EXISTS duration_min_minutes INTEGER,
ADD COLUMN IF NOT EXISTS duration_max_minutes INTEGER;

-- Rename knowledge_techniques to knowledge_items
ALTER TABLE public.knowledge_techniques RENAME TO knowledge_items;

-- Create flexible planning layer ranges junction table
CREATE TABLE IF NOT EXISTS public.knowledge_item_planning_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  planning_layer_id UUID NOT NULL REFERENCES public.planning_layers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(knowledge_item_id, planning_layer_id)
);

-- Update related tables to point to knowledge_items
ALTER TABLE public.knowledge_technique_tags RENAME TO knowledge_item_tags;
ALTER TABLE public.knowledge_item_tags RENAME COLUMN technique_id TO knowledge_item_id;

ALTER TABLE public.knowledge_technique_relations RENAME TO knowledge_item_relations;
ALTER TABLE public.knowledge_item_relations RENAME COLUMN technique_id TO knowledge_item_id;
ALTER TABLE public.knowledge_item_relations RENAME COLUMN related_technique_id TO related_knowledge_item_id;

ALTER TABLE public.knowledge_examples RENAME COLUMN technique_id TO knowledge_item_id;
ALTER TABLE public.knowledge_media RENAME COLUMN technique_id TO knowledge_item_id;

-- Update kb_feedback table
ALTER TABLE public.kb_feedback RENAME COLUMN technique_id TO knowledge_item_id;

-- Insert initial dimension data
INSERT INTO public.activity_focus (name, slug, description, color) VALUES
('Delivery', 'delivery', 'Focus on product and service delivery', '#22C55E'),
('Discovery', 'discovery', 'Focus on research and exploration', '#3B82F6'),
('People', 'people', 'Focus on team and individual development', '#F59E0B'),
('Process', 'process', 'Focus on workflow and methodology', '#8B5CF6'),
('Quality', 'quality', 'Focus on standards and improvement', '#EF4444'),
('Strategy', 'strategy', 'Focus on planning and direction', '#06B6D4')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.planning_layers (name, slug, description, color, display_order) VALUES
('Strategy', 'strategy', 'Organizational and portfolio level planning', '#1E40AF', 1),
('Product & Project', 'product-project', 'Product and project level planning', '#059669', 2),
('Team & Sprint', 'team-sprint', 'Team and iteration level execution', '#DC2626', 3),
('Individual & Task', 'individual-task', 'Personal and task level activities', '#7C2D12', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.activity_domains (name, slug, description, color) VALUES
('Product Management', 'product-management', 'Product strategy and roadmap activities', '#3B82F6'),
('Engineering', 'engineering', 'Development and technical activities', '#10B981'),
('Design', 'design', 'User experience and interface design', '#F59E0B'),
('Quality Assurance', 'quality-assurance', 'Testing and quality activities', '#EF4444'),
('DevOps', 'devops', 'Infrastructure and deployment activities', '#8B5CF6'),
('Business Analysis', 'business-analysis', 'Requirements and analysis activities', '#06B6D4'),
('Project Management', 'project-management', 'Coordination and delivery activities', '#84CC16'),
('Leadership', 'leadership', 'Team and organizational leadership', '#F97316')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.activity_categories (name, slug, description, color) VALUES
('Meeting', 'meeting', 'Collaborative sessions and gatherings', '#3B82F6'),
('Ceremony', 'ceremony', 'Formal agile ceremonies and rituals', '#059669'),
('Artifact', 'artifact', 'Deliverables and documentation', '#F59E0B'),
('Technique', 'technique', 'Methods and approaches', '#EF4444'),
('Role', 'role', 'Responsibilities and positions', '#8B5CF6'),
('Practice', 'practice', 'Ongoing habits and behaviors', '#06B6D4'),
('Framework', 'framework', 'Structured methodologies', '#84CC16'),
('Event', 'event', 'Time-boxed activities', '#F97316')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.activity_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_planning_layers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dimension tables (public read, admin write)
CREATE POLICY "Public can view activity focus" ON public.activity_focus FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity focus" ON public.activity_focus FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view planning layers" ON public.planning_layers FOR SELECT USING (true);
CREATE POLICY "Admins can manage planning layers" ON public.planning_layers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view activity domains" ON public.activity_domains FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity domains" ON public.activity_domains FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view activity categories" ON public.activity_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity categories" ON public.activity_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view knowledge item planning layers" ON public.knowledge_item_planning_layers FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge item planning layers" ON public.knowledge_item_planning_layers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_activity_focus_updated_at BEFORE UPDATE ON public.activity_focus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planning_layers_updated_at BEFORE UPDATE ON public.planning_layers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activity_domains_updated_at BEFORE UPDATE ON public.activity_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activity_categories_updated_at BEFORE UPDATE ON public.activity_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();