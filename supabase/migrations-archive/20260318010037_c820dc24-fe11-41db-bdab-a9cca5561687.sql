
-- ============================================================
-- PART 2: Knowledge Base tables
-- ============================================================

CREATE TABLE public.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view knowledge_categories" ON public.knowledge_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge_categories" ON public.knowledge_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.activity_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.activity_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view activity_domains" ON public.activity_domains FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity_domains" ON public.activity_domains FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.planning_focuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.planning_focuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view planning_focuses" ON public.planning_focuses FOR SELECT USING (true);
CREATE POLICY "Admins can manage planning_focuses" ON public.planning_focuses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.decision_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.decision_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view decision_levels" ON public.decision_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage decision_levels" ON public.decision_levels FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.knowledge_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  usage_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view knowledge_tags" ON public.knowledge_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge_tags" ON public.knowledge_tags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Authors & Publications
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  bio text,
  profile_image_url text,
  website_url text,
  expertise_areas text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage authors" ON public.authors FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  publication_type text NOT NULL DEFAULT 'book',
  url text,
  isbn text,
  doi text,
  publication_year integer,
  publisher text,
  journal text,
  volume text,
  issue text,
  pages text,
  abstract text,
  keywords text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view publications" ON public.publications FOR SELECT USING (true);
CREATE POLICY "Admins can manage publications" ON public.publications FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.publication_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid REFERENCES public.publications(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.authors(id) ON DELETE CASCADE NOT NULL,
  author_order integer DEFAULT 0,
  role text DEFAULT 'author',
  UNIQUE (publication_id, author_id)
);
ALTER TABLE public.publication_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view publication_authors" ON public.publication_authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage publication_authors" ON public.publication_authors FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge Items (main table)
CREATE TABLE public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  background text,
  source text,
  author text,
  publication_year integer,
  reference_url text,
  icon text,
  emoji text,
  hero_image_url text,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  has_ai_support boolean DEFAULT false,
  view_count integer DEFAULT 0,
  popularity_score integer DEFAULT 0,
  category_id uuid REFERENCES public.knowledge_categories(id),
  domain_id uuid REFERENCES public.activity_domains(id),
  planning_focus_id uuid REFERENCES public.planning_focuses(id),
  primary_publication_id uuid REFERENCES public.publications(id),
  learning_value_summary text,
  key_terminology jsonb,
  common_pitfalls text[],
  evidence_sources text[],
  related_techniques text[],
  item_type text,
  why_it_exists text,
  typical_output text,
  what_good_looks_like text[],
  decisions_supported text[],
  decision_boundaries text,
  governance_value text,
  use_this_when text[],
  avoid_when text[],
  inspect_adapt_signals text[],
  maturity_indicators text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published knowledge_items" ON public.knowledge_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge_items" ON public.knowledge_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Junction tables for knowledge items
CREATE TABLE public.knowledge_item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  rationale text,
  UNIQUE (knowledge_item_id, category_id)
);
ALTER TABLE public.knowledge_item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.knowledge_item_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES public.activity_domains(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  rationale text,
  UNIQUE (knowledge_item_id, domain_id)
);
ALTER TABLE public.knowledge_item_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_domains FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_domains FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.knowledge_item_decision_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  decision_level_id uuid REFERENCES public.decision_levels(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  rationale text,
  UNIQUE (knowledge_item_id, decision_level_id)
);
ALTER TABLE public.knowledge_item_decision_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_decision_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_decision_levels FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.knowledge_item_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.knowledge_tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (knowledge_item_id, tag_id)
);
ALTER TABLE public.knowledge_item_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_tags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge item references
CREATE TABLE public.knowledge_item_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  publication_id uuid REFERENCES public.publications(id) ON DELETE CASCADE NOT NULL,
  reference_type text DEFAULT 'citation',
  page_reference text,
  excerpt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_item_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_references FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_references FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge item relationships
CREATE TABLE public.knowledge_item_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  related_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  relationship_type text DEFAULT 'related',
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_item_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_relationships FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_relationships FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge use cases
CREATE TABLE public.knowledge_use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  case_type text NOT NULL DEFAULT 'generic',
  title text,
  what text,
  who text,
  when_used text,
  where_used text,
  why text,
  how text,
  how_much text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_use_cases FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_use_cases FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge item steps
CREATE TABLE public.knowledge_item_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.knowledge_item_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_steps FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_steps FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge item comments
CREATE TABLE public.knowledge_item_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_item_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.knowledge_item_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can add comments" ON public.knowledge_item_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON public.knowledge_item_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.knowledge_item_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON public.knowledge_item_comments FOR DELETE TO authenticated USING (is_admin());

-- Knowledge item likes
CREATE TABLE public.knowledge_item_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_item_id, user_id)
);
ALTER TABLE public.knowledge_item_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.knowledge_item_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated can toggle likes" ON public.knowledge_item_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.knowledge_item_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comment reports
CREATE TABLE public.comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.knowledge_item_comments(id) ON DELETE CASCADE NOT NULL,
  reported_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can report comments" ON public.comment_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can view reports" ON public.comment_reports FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update reports" ON public.comment_reports FOR UPDATE TO authenticated USING (is_admin());

-- Knowledge templates
CREATE TABLE public.knowledge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  template_type text NOT NULL DEFAULT 'canvas',
  file_format text,
  config jsonb,
  category text,
  version text DEFAULT '1.0',
  is_public boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  pdf_url text,
  pdf_filename text,
  pdf_file_size integer,
  pdf_page_count integer,
  file_url text,
  file_filename text,
  file_size integer,
  file_page_count integer,
  thumbnail_url text,
  tags text[],
  short_description text,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_template_title_version UNIQUE (title, version)
);
ALTER TABLE public.knowledge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public templates" ON public.knowledge_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.knowledge_templates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge item templates (junction)
CREATE TABLE public.knowledge_item_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.knowledge_templates(id) ON DELETE CASCADE NOT NULL,
  custom_config jsonb,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_item_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_item_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_item_templates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Media assets
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  alt_text text,
  caption text,
  tags text[],
  folder text,
  thumbnail_url text,
  is_template boolean DEFAULT false,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view media_assets" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Admins can manage media_assets" ON public.media_assets FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Knowledge items media (junction)
CREATE TABLE public.knowledge_items_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_items_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.knowledge_items_media FOR SELECT USING (true);
CREATE POLICY "Admins can manage" ON public.knowledge_items_media FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- KB feedback
CREATE TABLE public.kb_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technique_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  rating integer,
  comment text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedback" ON public.kb_feedback FOR SELECT USING (true);
CREATE POLICY "Anyone can submit feedback" ON public.kb_feedback FOR INSERT WITH CHECK (true);

-- Search analytics
CREATE TABLE public.search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count integer DEFAULT 0,
  clicked_technique_id uuid REFERENCES public.knowledge_items(id),
  search_filters jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert search_analytics" ON public.search_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view search_analytics" ON public.search_analytics FOR SELECT TO authenticated USING (is_admin());

-- User bookmarks
CREATE TABLE public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  technique_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, technique_id)
);
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON public.user_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User reading progress
CREATE TABLE public.user_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  technique_id uuid REFERENCES public.knowledge_items(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'unread',
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, technique_id)
);
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON public.user_reading_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- View count increment function
CREATE OR REPLACE FUNCTION public.increment_knowledge_item_view_count(item_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.knowledge_items SET view_count = COALESCE(view_count, 0) + 1 WHERE id = item_id;
END;
$$;

-- Feedback stats function
CREATE OR REPLACE FUNCTION public.get_feedback_stats(p_technique_id uuid)
RETURNS TABLE(average_rating numeric, total_ratings bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating)::numeric, 0) AS average_rating,
    COUNT(rating) AS total_ratings
  FROM public.kb_feedback
  WHERE technique_id = p_technique_id AND rating IS NOT NULL;
END;
$$;

-- Popular searches function
CREATE OR REPLACE FUNCTION public.get_popular_searches(p_limit integer DEFAULT 5, p_days integer DEFAULT 30)
RETURNS TABLE(query text, search_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sa.query, COUNT(*) AS search_count
  FROM public.search_analytics sa
  WHERE sa.created_at >= now() - (p_days || ' days')::interval
  GROUP BY sa.query
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$;
