-- Create knowledge base tables for product delivery techniques

-- Categories/purpose groups (Discovery, Design, Validation, etc.)
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main techniques table
CREATE TABLE public.knowledge_techniques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  purpose TEXT,
  description TEXT,
  originator TEXT,
  category_id UUID REFERENCES public.knowledge_categories(id),
  
  -- SEO metadata
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Content flags
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_complete BOOLEAN DEFAULT false,
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Tags for techniques
CREATE TABLE public.knowledge_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Many-to-many relationship between techniques and tags
CREATE TABLE public.knowledge_technique_tags (
  technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (technique_id, tag_id)
);

-- Media attachments (images, videos, documents)
CREATE TABLE public.knowledge_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document', 'embed')),
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Real-world examples and use cases
CREATE TABLE public.knowledge_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT, -- When/where to use
  industry TEXT,
  company_size TEXT,
  outcome TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Related techniques (for suggestions)
CREATE TABLE public.knowledge_technique_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  related_technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('related', 'prerequisite', 'follows', 'alternative')),
  strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(technique_id, related_technique_id)
);

-- Learning paths for guided technique sequences
CREATE TABLE public.knowledge_learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  target_audience TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Techniques within learning paths
CREATE TABLE public.knowledge_path_techniques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID REFERENCES public.knowledge_learning_paths(id) ON DELETE CASCADE,
  technique_id UUID REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(path_id, technique_id),
  UNIQUE(path_id, position)
);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_technique_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_technique_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_path_techniques ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: public read, admin write
CREATE POLICY "Public can view published categories" ON public.knowledge_categories
FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.knowledge_categories
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Techniques: public read for published, admin write
CREATE POLICY "Public can view published techniques" ON public.knowledge_techniques
FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all techniques" ON public.knowledge_techniques
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Tags: public read, admin write
CREATE POLICY "Public can view tags" ON public.knowledge_tags
FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.knowledge_tags
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Technique tags: public read, admin write
CREATE POLICY "Public can view technique tags" ON public.knowledge_technique_tags
FOR SELECT USING (true);

CREATE POLICY "Admins can manage technique tags" ON public.knowledge_technique_tags
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Media: public read for published techniques, admin write
CREATE POLICY "Public can view media for published techniques" ON public.knowledge_media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_techniques t 
    WHERE t.id = technique_id AND t.is_published = true
  )
);

CREATE POLICY "Admins can manage media" ON public.knowledge_media
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Examples: public read for published techniques, admin write
CREATE POLICY "Public can view examples for published techniques" ON public.knowledge_examples
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_techniques t 
    WHERE t.id = technique_id AND t.is_published = true
  )
);

CREATE POLICY "Admins can manage examples" ON public.knowledge_examples
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Relations: public read for published techniques, admin write
CREATE POLICY "Public can view relations for published techniques" ON public.knowledge_technique_relations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_techniques t 
    WHERE t.id = technique_id AND t.is_published = true
  )
);

CREATE POLICY "Admins can manage relations" ON public.knowledge_technique_relations
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Learning paths: public read for published, admin write
CREATE POLICY "Public can view published learning paths" ON public.knowledge_learning_paths
FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage learning paths" ON public.knowledge_learning_paths
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Path techniques: public read for published paths, admin write
CREATE POLICY "Public can view path techniques for published paths" ON public.knowledge_path_techniques
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_learning_paths p 
    WHERE p.id = path_id AND p.is_published = true
  )
);

CREATE POLICY "Admins can manage path techniques" ON public.knowledge_path_techniques
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create updated_at triggers
CREATE TRIGGER update_knowledge_categories_updated_at
  BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_techniques_updated_at
  BEFORE UPDATE ON public.knowledge_techniques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_learning_paths_updated_at
  BEFORE UPDATE ON public.knowledge_learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better search performance
CREATE INDEX idx_knowledge_techniques_name ON public.knowledge_techniques USING gin(to_tsvector('english', name));
CREATE INDEX idx_knowledge_techniques_description ON public.knowledge_techniques USING gin(to_tsvector('english', description));
CREATE INDEX idx_knowledge_techniques_published ON public.knowledge_techniques(is_published) WHERE is_published = true;
CREATE INDEX idx_knowledge_techniques_category ON public.knowledge_techniques(category_id);
CREATE INDEX idx_knowledge_techniques_slug ON public.knowledge_techniques(slug);
CREATE INDEX idx_knowledge_tags_name ON public.knowledge_tags(name);
CREATE INDEX idx_knowledge_media_technique ON public.knowledge_media(technique_id);
CREATE INDEX idx_knowledge_examples_technique ON public.knowledge_examples(technique_id);

-- Insert some default categories
INSERT INTO public.knowledge_categories (name, slug, description, color) VALUES
('Discovery', 'discovery', 'Techniques for understanding problems and user needs', '#10B981'),
('Design', 'design', 'Methods for creating and iterating on solutions', '#3B82F6'),
('Validation & Feedback', 'validation-feedback', 'Approaches for testing and validating ideas', '#F59E0B'),
('Delivery & Implementation', 'delivery-implementation', 'Practices for building and shipping products', '#EF4444'),
('Team & Process', 'team-process', 'Frameworks for team collaboration and process improvement', '#8B5CF6'),
('Measurement & Analytics', 'measurement-analytics', 'Techniques for measuring success and gathering insights', '#06B6D4');