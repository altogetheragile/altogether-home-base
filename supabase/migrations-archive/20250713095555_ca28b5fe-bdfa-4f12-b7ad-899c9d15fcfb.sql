-- Phase 1: Enhance knowledge_techniques table with new fields
ALTER TABLE public.knowledge_techniques 
ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'technique' CHECK (content_type IN ('technique', 'article', 'template')),
ADD COLUMN IF NOT EXISTS estimated_reading_time integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_reviewed_at timestamp with time zone DEFAULT now();

-- Create kb_feedback table for user feedback
CREATE TABLE IF NOT EXISTS public.kb_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id uuid REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  rating integer CHECK (rating IN (-1, 0, 1)), -- -1 (bad), 0 (neutral), +1 (good)
  comment text,
  ip_address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create technique_relations table for related content
CREATE TABLE IF NOT EXISTS public.technique_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_technique_id uuid REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  related_technique_id uuid REFERENCES public.knowledge_techniques(id) ON DELETE CASCADE,
  relation_type text DEFAULT 'related' CHECK (relation_type IN ('related', 'prerequisite', 'see_also', 'follow_up')),
  strength integer DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(source_technique_id, related_technique_id, relation_type)
);

-- Enable RLS on new tables
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for kb_feedback
CREATE POLICY "Anyone can view feedback stats" ON public.kb_feedback
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit feedback" ON public.kb_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all feedback" ON public.kb_feedback
  FOR ALL USING (is_admin());

-- RLS policies for technique_relations
CREATE POLICY "Anyone can view technique relations" ON public.technique_relations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage technique relations" ON public.technique_relations
  FOR ALL USING (is_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kb_feedback_technique_id ON public.kb_feedback(technique_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_created_at ON public.kb_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_technique_relations_source ON public.technique_relations(source_technique_id);
CREATE INDEX IF NOT EXISTS idx_technique_relations_related ON public.technique_relations(related_technique_id);