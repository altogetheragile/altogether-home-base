-- Create new clean schema for Excel import

-- Categories table (simple name/description)
CREATE TABLE public.categories_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Planning layers table (simple name/description)
CREATE TABLE public.planning_layers_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Domains table (simple name/description)
CREATE TABLE public.domains_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main knowledge items table - direct Excel mapping
CREATE TABLE public.knowledge_items_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  
  -- Direct references to new lookup tables
  category_id UUID REFERENCES public.categories_v2(id),
  planning_layer_id UUID REFERENCES public.planning_layers_v2(id),
  domain_id UUID REFERENCES public.domains_v2(id),
  
  -- Generic Use Case fields (direct from Excel)
  generic_who TEXT,
  generic_what TEXT,
  generic_when TEXT,
  generic_where TEXT,
  generic_why TEXT,
  generic_how TEXT,
  generic_how_much TEXT,
  generic_summary TEXT,
  
  -- Example Use Case fields (direct from Excel)
  example_who TEXT,
  example_what TEXT,
  example_when TEXT,
  example_where TEXT,
  example_why TEXT,
  example_how TEXT,
  example_how_much TEXT,
  example_summary TEXT,
  
  -- Additional fields from Excel
  purpose TEXT,
  background TEXT,
  originator TEXT,
  source TEXT,
  focus_description TEXT,
  planning_considerations TEXT,
  industry_context TEXT,
  
  -- System fields
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.categories_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_layers_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories_v2
CREATE POLICY "Public can view categories_v2" ON public.categories_v2 FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories_v2" ON public.categories_v2 FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for planning_layers_v2
CREATE POLICY "Public can view planning_layers_v2" ON public.planning_layers_v2 FOR SELECT USING (true);
CREATE POLICY "Admins can manage planning_layers_v2" ON public.planning_layers_v2 FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for domains_v2
CREATE POLICY "Public can view domains_v2" ON public.domains_v2 FOR SELECT USING (true);
CREATE POLICY "Admins can manage domains_v2" ON public.domains_v2 FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for knowledge_items_v2
CREATE POLICY "Public can view published knowledge_items_v2" ON public.knowledge_items_v2 FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all knowledge_items_v2" ON public.knowledge_items_v2 FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_knowledge_items_v2_category ON public.knowledge_items_v2(category_id);
CREATE INDEX idx_knowledge_items_v2_planning_layer ON public.knowledge_items_v2(planning_layer_id);
CREATE INDEX idx_knowledge_items_v2_domain ON public.knowledge_items_v2(domain_id);
CREATE INDEX idx_knowledge_items_v2_slug ON public.knowledge_items_v2(slug);
CREATE INDEX idx_knowledge_items_v2_published ON public.knowledge_items_v2(is_published);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_v2_updated_at
  BEFORE UPDATE ON public.categories_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_layers_v2_updated_at
  BEFORE UPDATE ON public.planning_layers_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domains_v2_updated_at
  BEFORE UPDATE ON public.domains_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_items_v2_updated_at
  BEFORE UPDATE ON public.knowledge_items_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();