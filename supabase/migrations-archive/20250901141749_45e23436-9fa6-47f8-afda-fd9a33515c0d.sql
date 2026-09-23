-- Knowledge Base Schema - Phase 1: Core Tables

-- Categories table
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Planning layers table
CREATE TABLE public.planning_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#10B981',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Activity domains table
CREATE TABLE public.activity_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Main knowledge items table
CREATE TABLE public.knowledge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.knowledge_categories(id),
  planning_layer_id UUID REFERENCES public.planning_layers(id),
  domain_id UUID REFERENCES public.activity_domains(id),
  source TEXT,
  background TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Use cases table (handles both generic and example use cases)
CREATE TABLE public.knowledge_use_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL CHECK (case_type IN ('generic', 'example')),
  title TEXT, -- For example use cases
  who TEXT,
  what TEXT,
  when_used TEXT, -- renamed to avoid SQL keyword
  where_used TEXT, -- renamed to avoid SQL keyword  
  why TEXT,
  how TEXT,
  how_much TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_items_category ON public.knowledge_items(category_id);
CREATE INDEX idx_knowledge_items_layer ON public.knowledge_items(planning_layer_id);
CREATE INDEX idx_knowledge_items_domain ON public.knowledge_items(domain_id);
CREATE INDEX idx_knowledge_items_published ON public.knowledge_items(is_published);
CREATE INDEX idx_knowledge_items_featured ON public.knowledge_items(is_featured);
CREATE INDEX idx_knowledge_items_slug ON public.knowledge_items(slug);
CREATE INDEX idx_knowledge_use_cases_item ON public.knowledge_use_cases(knowledge_item_id);
CREATE INDEX idx_knowledge_use_cases_type ON public.knowledge_use_cases(case_type);

-- Helper function to create slugs
CREATE OR REPLACE FUNCTION public.create_knowledge_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'))) 
         ||'-'|| 
         substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_categories_updated_at
  BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_layers_updated_at
  BEFORE UPDATE ON public.planning_layers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_domains_updated_at
  BEFORE UPDATE ON public.activity_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_use_cases_updated_at
  BEFORE UPDATE ON public.knowledge_use_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_use_cases ENABLE ROW LEVEL SECURITY;

-- Knowledge Categories Policies
CREATE POLICY "Public can view knowledge categories" ON public.knowledge_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage knowledge categories" ON public.knowledge_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Planning Layers Policies
CREATE POLICY "Public can view planning layers" ON public.planning_layers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage planning layers" ON public.planning_layers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Activity Domains Policies
CREATE POLICY "Public can view activity domains" ON public.activity_domains
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage activity domains" ON public.activity_domains
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge Items Policies
CREATE POLICY "Public can view published knowledge items" ON public.knowledge_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all knowledge items" ON public.knowledge_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge Use Cases Policies
CREATE POLICY "Public can view use cases for published items" ON public.knowledge_use_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_items ki 
      WHERE ki.id = knowledge_use_cases.knowledge_item_id 
      AND ki.is_published = true
    )
  );

CREATE POLICY "Admins can manage all use cases" ON public.knowledge_use_cases
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());