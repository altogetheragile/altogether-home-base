-- Create knowledge_tags table
CREATE TABLE public.knowledge_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_item_tags junction table
CREATE TABLE public.knowledge_item_tags (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for knowledge_tags
CREATE POLICY "Public can view knowledge tags" 
ON public.knowledge_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledge tags" 
ON public.knowledge_tags 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create RLS policies for knowledge_item_tags
CREATE POLICY "Public can view tag associations for published items" 
ON public.knowledge_item_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.knowledge_items ki 
    WHERE ki.id = knowledge_item_tags.knowledge_item_id 
    AND ki.is_published = true
  )
);

CREATE POLICY "Admins can manage all tag associations" 
ON public.knowledge_item_tags 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger to update tag usage count
CREATE TRIGGER update_knowledge_tag_usage_count
  AFTER INSERT OR DELETE ON public.knowledge_item_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_usage_count();