-- Create knowledge_templates table
CREATE TABLE public.knowledge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('canvas', 'matrix', 'worksheet', 'process', 'form')),
  
  -- Template Configuration (JSON Schema)
  config JSONB NOT NULL DEFAULT '{}',
  
  category TEXT,
  version TEXT DEFAULT '1.0',
  is_public BOOLEAN DEFAULT true,
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  
  -- Standard metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create knowledge_item_templates junction table
CREATE TABLE public.knowledge_item_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.knowledge_templates(id) ON DELETE CASCADE,
  
  -- Template customization per KI
  custom_config JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(knowledge_item_id, template_id)
);

-- Create template_usage tracking table
CREATE TABLE public.template_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.knowledge_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id), -- Anonymous users = null
  session_data JSONB DEFAULT '{}', -- Store filled template data
  exported_format TEXT, -- 'pdf', 'png', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_templates
CREATE POLICY "Admins can manage all templates"
ON public.knowledge_templates
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view public templates"
ON public.knowledge_templates
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create their own templates"
ON public.knowledge_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
ON public.knowledge_templates
FOR UPDATE
USING (auth.uid() = created_by OR is_admin())
WITH CHECK (auth.uid() = created_by OR is_admin());

-- RLS Policies for knowledge_item_templates
CREATE POLICY "Admins can manage all template associations"
ON public.knowledge_item_templates
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view template associations for published items"
ON public.knowledge_item_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_items ki
    WHERE ki.id = knowledge_item_templates.knowledge_item_id
    AND ki.is_published = true
  )
);

-- RLS Policies for template_usage
CREATE POLICY "Admins can view all template usage"
ON public.template_usage
FOR SELECT
USING (is_admin());

CREATE POLICY "Users can create template usage records"
ON public.template_usage
FOR INSERT
WITH CHECK (true); -- Allow anonymous usage

CREATE POLICY "Users can view their own template usage"
ON public.template_usage
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger for updating timestamps
CREATE TRIGGER update_knowledge_templates_updated_at
BEFORE UPDATE ON public.knowledge_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage_count(template_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.knowledge_templates 
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = template_uuid;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_knowledge_templates_type ON public.knowledge_templates(template_type);
CREATE INDEX idx_knowledge_templates_category ON public.knowledge_templates(category);
CREATE INDEX idx_knowledge_templates_public ON public.knowledge_templates(is_public);
CREATE INDEX idx_knowledge_item_templates_ki ON public.knowledge_item_templates(knowledge_item_id);
CREATE INDEX idx_knowledge_item_templates_template ON public.knowledge_item_templates(template_id);
CREATE INDEX idx_template_usage_template ON public.template_usage(template_id);
CREATE INDEX idx_template_usage_user ON public.template_usage(user_id);
CREATE INDEX idx_template_usage_created ON public.template_usage(created_at);