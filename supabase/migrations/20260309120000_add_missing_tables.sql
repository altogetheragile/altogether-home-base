-- Create tables that exist in code but are missing from the remote database.
-- These were defined in old Dashboard migrations that were never applied to remote.

-- 1. kb_feedback table (used by useFeedback.ts, ContentAnalyticsDashboard.tsx)
CREATE TABLE IF NOT EXISTS public.kb_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  rating integer CHECK (rating IN (-1, 0, 1)),
  comment text,
  ip_address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback stats" ON public.kb_feedback
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit feedback" ON public.kb_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all feedback" ON public.kb_feedback
  FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_kb_feedback_knowledge_item_id ON public.kb_feedback(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_created_at ON public.kb_feedback(created_at);

-- 2. activity_focus table (used by useActivityFocus.ts)
CREATE TABLE IF NOT EXISTS public.activity_focus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view activity focus" ON public.activity_focus
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage activity focus" ON public.activity_focus
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_activity_focus_updated_at
  BEFORE UPDATE ON public.activity_focus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.activity_focus (name, slug, description, color) VALUES
('Delivery', 'delivery', 'Focus on product and service delivery', '#22C55E'),
('Discovery', 'discovery', 'Focus on research and exploration', '#3B82F6'),
('People', 'people', 'Focus on team and individual development', '#F59E0B'),
('Process', 'process', 'Focus on workflow and methodology', '#8B5CF6'),
('Quality', 'quality', 'Focus on standards and improvement', '#EF4444'),
('Strategy', 'strategy', 'Focus on planning and direction', '#06B6D4')
ON CONFLICT (slug) DO NOTHING;

-- 3. technique_comments table (used by useTechniqueComments.ts)
-- Note: knowledge_item_comments exists but has a different schema (no threading/voting).
-- technique_comments adds parent_comment_id, is_approved, upvotes, downvotes.
CREATE TABLE IF NOT EXISTS public.technique_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES public.technique_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.technique_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved technique comments" ON public.technique_comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create technique comments" ON public.technique_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own technique comments" ON public.technique_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all technique comments" ON public.technique_comments
  FOR ALL USING (public.is_admin());

CREATE TRIGGER update_technique_comments_updated_at
  BEFORE UPDATE ON public.technique_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. knowledge_item_relations table (used by useTechniqueRelations.ts)
-- Note: knowledge_item_relationships exists but has different column names.
-- Code uses: knowledge_item_id, related_knowledge_item_id, relation_type, strength
-- DB has: knowledge_item_id, related_item_id, relationship_type, position
CREATE TABLE IF NOT EXISTS public.knowledge_item_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  related_knowledge_item_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  relation_type text DEFAULT 'related',
  strength integer DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(knowledge_item_id, related_knowledge_item_id, relation_type)
);

ALTER TABLE public.knowledge_item_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view knowledge item relations" ON public.knowledge_item_relations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage knowledge item relations" ON public.knowledge_item_relations
  FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_knowledge_item_relations_source ON public.knowledge_item_relations(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_item_relations_related ON public.knowledge_item_relations(related_knowledge_item_id);
