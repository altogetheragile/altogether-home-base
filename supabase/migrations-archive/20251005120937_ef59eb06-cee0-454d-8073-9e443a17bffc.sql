-- Create table for knowledge item step-by-step instructions
CREATE TABLE public.knowledge_item_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_knowledge_item_steps_knowledge_item_id ON public.knowledge_item_steps(knowledge_item_id);
CREATE INDEX idx_knowledge_item_steps_position ON public.knowledge_item_steps(knowledge_item_id, position);

-- Enable Row Level Security
ALTER TABLE public.knowledge_item_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all steps
CREATE POLICY "Admins can manage all steps"
ON public.knowledge_item_steps
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policy: Public can view steps for published knowledge items
CREATE POLICY "Public can view steps for published items"
ON public.knowledge_item_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_items ki
    WHERE ki.id = knowledge_item_steps.knowledge_item_id
    AND ki.is_published = true
  )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_knowledge_item_steps_updated_at
BEFORE UPDATE ON public.knowledge_item_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();