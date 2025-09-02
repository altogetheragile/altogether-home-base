-- Create independent media assets table
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document', 'embed')),
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for media assets
CREATE POLICY "Admins can manage all media assets"
ON public.media_assets
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can create their own media assets"
ON public.media_assets
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view media assets"
ON public.media_assets
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own media assets"
ON public.media_assets
FOR UPDATE
USING (auth.uid() = created_by OR is_admin())
WITH CHECK (auth.uid() = created_by OR is_admin());

-- Create junction table for knowledge items and media
CREATE TABLE public.knowledge_items_media (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (knowledge_item_id, media_asset_id)
);

-- Enable RLS for junction table
ALTER TABLE public.knowledge_items_media ENABLE ROW LEVEL SECURITY;

-- Create policies for junction table
CREATE POLICY "Admins can manage all knowledge item media associations"
ON public.knowledge_items_media
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view media associations for published items"
ON public.knowledge_items_media
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.knowledge_items ki
  WHERE ki.id = knowledge_items_media.knowledge_item_id
  AND ki.is_published = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_media_assets_type ON public.media_assets(type);
CREATE INDEX idx_media_assets_created_by ON public.media_assets(created_by);
CREATE INDEX idx_knowledge_items_media_position ON public.knowledge_items_media(knowledge_item_id, position);