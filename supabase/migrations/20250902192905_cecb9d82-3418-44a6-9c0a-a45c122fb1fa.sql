-- Create knowledge_media table for storing media items associated with knowledge items
CREATE TABLE public.knowledge_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document', 'embed')),
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_media ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_media
CREATE POLICY "Admins can manage all media" 
ON public.knowledge_media 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view media for published items" 
ON public.knowledge_media 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM knowledge_items ki 
  WHERE ki.id = knowledge_media.knowledge_item_id 
  AND ki.is_published = true
));

-- Create index for better performance
CREATE INDEX idx_knowledge_media_knowledge_item_id ON public.knowledge_media(knowledge_item_id);
CREATE INDEX idx_knowledge_media_position ON public.knowledge_media(position);