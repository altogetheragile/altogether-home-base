-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create pages table to define editable pages
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create content_blocks table for page sections
CREATE TABLE public.content_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'hero', 'section')),
  content JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Pages policies
CREATE POLICY "Public can view published pages" 
ON public.pages 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all pages" 
ON public.pages 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Content blocks policies
CREATE POLICY "Public can view blocks of published pages" 
ON public.content_blocks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND p.is_published = true
  )
);

CREATE POLICY "Admins can manage all content blocks" 
ON public.content_blocks 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_content_blocks_page_id ON public.content_blocks(page_id);
CREATE INDEX idx_content_blocks_position ON public.content_blocks(page_id, position);

-- Create triggers for timestamp updates
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at
BEFORE UPDATE ON public.content_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pages
INSERT INTO public.pages (slug, title, description) VALUES 
('home', 'Home Page', 'Main landing page'),
('events', 'Events', 'Events listing page'),
('blog', 'Blog', 'Blog and news page');

-- Insert some default content blocks for the home page
INSERT INTO public.content_blocks (page_id, type, content, position) 
SELECT 
  p.id,
  'hero',
  '{"title": "Welcome to AltogetherAgile", "subtitle": "Transform your organization with agile practices", "backgroundImage": "", "ctaText": "Explore Events", "ctaLink": "/events"}',
  0
FROM public.pages p WHERE p.slug = 'home';

INSERT INTO public.content_blocks (page_id, type, content, position) 
SELECT 
  p.id,
  'section',
  '{"title": "Our Services", "content": "We offer comprehensive agile training and consulting services to help your organization succeed.", "layout": "text"}',
  1
FROM public.pages p WHERE p.slug = 'home';