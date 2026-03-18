
-- Final missing tables
CREATE TABLE IF NOT EXISTS public.classification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_type text NOT NULL,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  custom_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classification_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view classification_config" ON public.classification_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage classification_config" ON public.classification_config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS public.knowledge_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  media_type text DEFAULT 'image',
  caption text,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view knowledge_media" ON public.knowledge_media FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge_media" ON public.knowledge_media FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Fix search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix permissive RLS on kb_feedback (require auth for insert)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.kb_feedback;
CREATE POLICY "Authenticated can submit feedback" ON public.kb_feedback FOR INSERT TO authenticated WITH CHECK (true);

-- Fix permissive RLS on search_analytics
DROP POLICY IF EXISTS "Anyone can insert search_analytics" ON public.search_analytics;
CREATE POLICY "Authenticated can insert search_analytics" ON public.search_analytics FOR INSERT TO authenticated WITH CHECK (true);

-- Fix permissive RLS on contacts
DROP POLICY IF EXISTS "Anyone can submit contacts" ON public.contacts;
CREATE POLICY "Anon can submit contacts" ON public.contacts FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Fix permissive RLS on course_feedback
DROP POLICY IF EXISTS "Authenticated can submit feedback" ON public.course_feedback;
CREATE POLICY "Auth can submit course_feedback" ON public.course_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
