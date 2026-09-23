-- Create planning_focuses table with the 6 new Planning Focus values
CREATE TABLE public.planning_focuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10B981',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on planning_focuses
ALTER TABLE public.planning_focuses ENABLE ROW LEVEL SECURITY;

-- Create policies for planning_focuses
CREATE POLICY "Admins can manage planning focuses" 
ON public.planning_focuses 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view planning focuses" 
ON public.planning_focuses 
FOR SELECT 
USING (true);

-- Insert the 6 Planning Focus values
INSERT INTO public.planning_focuses (name, slug, description, display_order) VALUES
('Strategy & Vision', 'strategy-vision', 'Define the business drivers, goals, and desired outcomes before any delivery begins. Aligns investment to value.', 1),
('Discovery & Exploration', 'discovery-exploration', 'Research the problem space, user needs, risks, and constraints before deciding what to build.', 2),
('Definition & Planning', 'definition-planning', 'Translate vision into deliverable scope, solution architecture, governance, and team plans.', 3),
('Delivery & Build', 'delivery-build', 'Iteratively develop working solutions, validate frequently, and incorporate feedback.', 4),
('Release & Deployment', 'release-deployment', 'Move the validated product or service into live use. Ensure readiness for handover, training, and operational support.', 5),
('Ongoing Operations / Improvement', 'ongoing-operations-improvement', 'Monitor outcomes, gather insights, and improve the solution or service continually.', 6);

-- Add planning_focus_id column to knowledge_items
ALTER TABLE public.knowledge_items 
ADD COLUMN planning_focus_id UUID REFERENCES public.planning_focuses(id);

-- Create a simple mapping function to migrate existing planning_layer_id data to planning_focus_id
-- This will map existing planning layers to appropriate planning focuses
-- Users can later update these mappings as needed
UPDATE public.knowledge_items 
SET planning_focus_id = (
  SELECT pf.id 
  FROM public.planning_focuses pf 
  WHERE pf.name = 'Definition & Planning'
  LIMIT 1
)
WHERE planning_layer_id IS NOT NULL;

-- Create trigger for automatic timestamp updates on planning_focuses
CREATE TRIGGER update_planning_focuses_updated_at
BEFORE UPDATE ON public.planning_focuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();