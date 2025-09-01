-- Drop any remaining KB-related tables that might still exist
DROP TABLE IF EXISTS knowledge_item_tags CASCADE;
DROP TABLE IF EXISTS knowledge_tags CASCADE;
DROP TABLE IF EXISTS kb_feedback CASCADE;
DROP TABLE IF EXISTS knowledge_media CASCADE;
DROP TABLE IF EXISTS knowledge_path_techniques CASCADE;
DROP TABLE IF EXISTS learning_path_steps CASCADE;
DROP TABLE IF EXISTS knowledge_learning_paths CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS knowledge_items_backup CASCADE;
DROP TABLE IF EXISTS knowledge_items CASCADE;
DROP TABLE IF EXISTS knowledge_categories CASCADE;
DROP TABLE IF EXISTS activity_domains CASCADE;
DROP TABLE IF EXISTS planning_layers CASCADE;
DROP TABLE IF EXISTS activity_focus CASCADE;
DROP TABLE IF EXISTS activity_categories CASCADE;

-- Now create the fresh tables
-- Create Categories table (maps to "Category" column in Excel)
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Activity Domains table (maps to "Domain of Interest" column in Excel)
CREATE TABLE public.activity_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Planning Layers table (maps to "Planning Layer" column in Excel)
CREATE TABLE public.planning_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#8B5CF6',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Knowledge Items table with exact Excel column mapping
CREATE TABLE public.knowledge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info (maps to Excel columns)
  name TEXT NOT NULL, -- "Knowledge Item"
  description TEXT, -- "Knowledge Item Description"
  slug TEXT NOT NULL UNIQUE,
  
  -- Foreign keys
  category_id UUID REFERENCES public.knowledge_categories(id),
  domain_id UUID REFERENCES public.activity_domains(id),
  planning_layer_id UUID REFERENCES public.planning_layers(id),
  
  -- Excel mapped fields
  background TEXT, -- "Background"
  source TEXT, -- "Source"
  originator TEXT, -- "Originator"
  purpose TEXT, -- "Purpose"
  focus_description TEXT, -- "Focus Description"
  planning_considerations TEXT, -- "Planning Considerations"
  industry_context TEXT, -- "Industry Context"
  
  -- Generic Use Case fields (exact Excel column names)
  generic_who TEXT, -- "Generic Use Case - Who"
  generic_what TEXT, -- "Generic Use Case - What"
  generic_when TEXT, -- "Generic Use Case - When"
  generic_where TEXT, -- "Generic Use Case - Where"
  generic_why TEXT, -- "Generic Use Case - Why"
  generic_how TEXT, -- "Generic Use Case - How"
  generic_how_much TEXT, -- "Generic Use Case - How Much"
  generic_summary TEXT, -- "Generic Summary (Narrative Form)"
  
  -- Example Use Case fields (exact Excel column names)
  example_who TEXT, -- "Example / Use Case - Who"
  example_what TEXT, -- "Example / Use Case - What"
  example_when TEXT, -- "Example / Use Case - When"
  example_where TEXT, -- "Example / Use Case - Where"
  example_why TEXT, -- "Example / Use Case - Why"
  example_how TEXT, -- "Example / Use Case - How"
  example_how_much TEXT, -- "Example / Use Case - How Much"
  example_summary TEXT, -- "Example / Use Case - Summary (Narrative Form)"
  
  -- System fields
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create Knowledge Tags table
CREATE TABLE public.knowledge_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Knowledge Item Tags junction table
CREATE TABLE public.knowledge_item_tags (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view knowledge categories" ON public.knowledge_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge categories" ON public.knowledge_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view activity domains" ON public.activity_domains FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity domains" ON public.activity_domains FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view planning layers" ON public.planning_layers FOR SELECT USING (true);
CREATE POLICY "Admins can manage planning layers" ON public.planning_layers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view published knowledge items" ON public.knowledge_items FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all knowledge items" ON public.knowledge_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view knowledge tags" ON public.knowledge_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge tags" ON public.knowledge_tags FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view knowledge item tags" ON public.knowledge_item_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge item tags" ON public.knowledge_item_tags FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_categories_updated_at
  BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_domains_updated_at
  BEFORE UPDATE ON public.activity_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_layers_updated_at
  BEFORE UPDATE ON public.planning_layers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for tag usage count
CREATE TRIGGER update_knowledge_tag_usage_count
  AFTER INSERT OR DELETE ON public.knowledge_item_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_tag_usage_count();