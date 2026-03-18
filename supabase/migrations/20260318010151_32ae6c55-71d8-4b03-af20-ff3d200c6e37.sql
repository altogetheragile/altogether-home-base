
-- ============================================================
-- PART 3: Blog, CMS, Projects, Stories, and remaining tables
-- ============================================================

-- Blog categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blog_categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_categories" ON public.blog_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Blog tags
CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  usage_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blog_tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_tags" ON public.blog_tags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  featured_image_url text,
  author_id uuid REFERENCES auth.users(id),
  category_id uuid REFERENCES public.blog_categories(id),
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  estimated_reading_time integer DEFAULT 5,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published blog_posts" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_posts" ON public.blog_posts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Blog post tags junction
CREATE TABLE public.blog_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.blog_tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (blog_post_id, tag_id)
);
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blog_post_tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_post_tags" ON public.blog_post_tags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Pages (CMS)
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_published boolean DEFAULT false,
  show_in_main_menu boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Content blocks
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'text',
  content jsonb DEFAULT '{}',
  position integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view content_blocks" ON public.content_blocks FOR SELECT USING (true);
CREATE POLICY "Admins can manage content_blocks" ON public.content_blocks FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Site settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  company_description text,
  contact_email text,
  contact_phone text,
  contact_location text,
  social_linkedin text,
  social_twitter text,
  social_facebook text,
  social_youtube text,
  social_github text,
  quick_links jsonb,
  copyright_text text,
  show_events boolean DEFAULT true,
  show_knowledge boolean DEFAULT true,
  show_blog boolean DEFAULT true,
  show_ai_tools boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Contacts
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  enquiry_type text,
  preferred_contact_method text,
  attachment_url text,
  attachment_filename text,
  attachment_size integer,
  attachment_type text,
  ip_address text,
  status text DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (is_admin());

-- Course feedback
CREATE TABLE public.course_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id),
  course_name text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  rating integer,
  comment text NOT NULL,
  company text,
  job_title text,
  source text DEFAULT 'manual',
  source_url text,
  submitted_at timestamptz DEFAULT now(),
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.course_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved feedback" ON public.course_feedback FOR SELECT USING (true);
CREATE POLICY "Authenticated can submit feedback" ON public.course_feedback FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage feedback" ON public.course_feedback FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color_theme text DEFAULT '#3B82F6',
  is_archived boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Project artifacts
CREATE TABLE public.project_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  artifact_type text NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb DEFAULT '{}',
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own artifacts" ON public.project_artifacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_artifacts.project_id AND created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_artifacts.project_id AND created_by = auth.uid()));

-- Canvases
CREATE TABLE public.canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  data jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own canvases" ON public.canvases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = canvases.project_id AND created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = canvases.project_id AND created_by = auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvases;

-- Epics
CREATE TABLE public.epics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  theme text,
  status text DEFAULT 'draft',
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  business_objective text,
  success_metrics text[],
  stakeholders text[],
  start_date date,
  target_date date,
  jira_issue_key text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage epics" ON public.epics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Features
CREATE TABLE public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  epic_id uuid REFERENCES public.epics(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  user_value text,
  acceptance_criteria text[],
  status text DEFAULT 'draft',
  jira_issue_key text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage features" ON public.features FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User stories
CREATE TABLE public.user_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  acceptance_criteria text[],
  story_points integer,
  status text DEFAULT 'draft',
  priority text DEFAULT 'medium',
  issue_type text DEFAULT 'story',
  epic_id uuid REFERENCES public.epics(id) ON DELETE SET NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  parent_story_id uuid REFERENCES public.user_stories(id) ON DELETE SET NULL,
  user_persona text,
  problem_statement text,
  business_value text,
  assumptions_risks text,
  dependencies text[],
  technical_notes text,
  design_notes text,
  ui_mockup_url text,
  definition_of_ready jsonb,
  definition_of_done jsonb,
  tags text[],
  story_type text,
  sprint text,
  impact_effort_matrix jsonb,
  evidence_links text[],
  non_functional_requirements text[],
  customer_journey_stage text,
  confidence_level integer,
  jira_issue_key text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage user_stories" ON public.user_stories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Backlog items
CREATE TABLE public.backlog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id uuid,
  user_story_id uuid REFERENCES public.user_stories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  acceptance_criteria text[],
  priority text DEFAULT 'medium',
  status text DEFAULT 'idea',
  backlog_position integer DEFAULT 0,
  estimated_value integer,
  estimated_effort integer,
  source text,
  target_release text,
  tags text[],
  parent_item_id uuid REFERENCES public.backlog_items(id) ON DELETE SET NULL,
  item_type text DEFAULT 'story',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage backlog_items" ON public.backlog_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI generation audit
CREATE TABLE public.ai_generation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  story_level text,
  input_data jsonb DEFAULT '{}',
  output_data jsonb,
  token_count integer,
  execution_time_ms integer,
  success boolean DEFAULT false,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_generation_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit" ON public.ai_generation_audit FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert audit" ON public.ai_generation_audit FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all audit" ON public.ai_generation_audit FOR SELECT TO authenticated USING (is_admin());

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit_log" ON public.admin_audit_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert audit_log" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Data imports
CREATE TABLE public.data_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_type text NOT NULL DEFAULT 'csv',
  status text DEFAULT 'uploaded',
  target_entity text NOT NULL,
  total_rows integer DEFAULT 0,
  successful_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  mapping_config jsonb DEFAULT '{}',
  processing_log jsonb DEFAULT '[]',
  file_size integer,
  original_filename text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage data_imports" ON public.data_imports FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Staging data
CREATE TABLE public.staging_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid REFERENCES public.data_imports(id) ON DELETE CASCADE NOT NULL,
  row_number integer NOT NULL,
  raw_data jsonb DEFAULT '{}',
  mapped_data jsonb,
  validation_status text DEFAULT 'pending',
  validation_errors jsonb DEFAULT '[]',
  processing_status text DEFAULT 'pending',
  processing_errors jsonb DEFAULT '[]',
  target_record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.staging_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staging_data" ON public.staging_data FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Activity focus
CREATE TABLE public.activity_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view activity_focus" ON public.activity_focus FOR SELECT USING (true);
CREATE POLICY "Admins can manage activity_focus" ON public.activity_focus FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Template usages
CREATE TABLE public.template_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.knowledge_templates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  session_data jsonb DEFAULT '{}',
  exported_format text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own usages" ON public.template_usages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insert default site settings
INSERT INTO public.site_settings (id, company_name) VALUES ('00000000-0000-0000-0000-000000000001', 'Altogether Agile');
