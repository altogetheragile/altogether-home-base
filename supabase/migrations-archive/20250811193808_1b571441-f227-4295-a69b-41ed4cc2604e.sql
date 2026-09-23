-- Lock search_path for SECURITY DEFINER and other functions
-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT exists (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- update_tag_usage_count
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM knowledge_technique_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM knowledge_technique_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- increment_view_count
CREATE OR REPLACE FUNCTION public.increment_view_count(technique_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE knowledge_techniques 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = technique_id;
END;
$$;

-- update_blog_tag_usage_count
CREATE OR REPLACE FUNCTION public.update_blog_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM blog_post_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM blog_post_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- increment_blog_view_count
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

-- Create aggregated stats RPC for feedback (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_feedback_stats(p_technique_id uuid)
RETURNS TABLE(average_rating numeric, total_ratings integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT 
    COALESCE(AVG(rating)::numeric, 0) AS average_rating,
    COUNT(rating) AS total_ratings
  FROM public.kb_feedback
  WHERE technique_id = p_technique_id AND rating IS NOT NULL;
$$;

-- Triggers to set user_id automatically on insert if missing
CREATE OR REPLACE FUNCTION public.set_kb_feedback_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_kb_feedback_user ON public.kb_feedback;
CREATE TRIGGER trg_set_kb_feedback_user
BEFORE INSERT ON public.kb_feedback
FOR EACH ROW EXECUTE FUNCTION public.set_kb_feedback_user();

CREATE OR REPLACE FUNCTION public.set_search_analytics_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_search_analytics_user ON public.search_analytics;
CREATE TRIGGER trg_set_search_analytics_user
BEFORE INSERT ON public.search_analytics
FOR EACH ROW EXECUTE FUNCTION public.set_search_analytics_user();

-- Tighten RLS on kb_feedback
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive policies if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'kb_feedback' AND policyname = 'Anyone can submit feedback'
  ) THEN
    DROP POLICY "Anyone can submit feedback" ON public.kb_feedback;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'kb_feedback' AND policyname = 'Anyone can view feedback stats'
  ) THEN
    DROP POLICY "Anyone can view feedback stats" ON public.kb_feedback;
  END IF;
END $$;

-- Allow authenticated inserts; ensure they can only insert for themselves (or trigger fills it)
CREATE POLICY "Authenticated users can submit feedback"
ON public.kb_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (NEW.user_id IS NULL OR NEW.user_id = auth.uid()));

-- Allow users to view their own feedback; admins already covered by existing admin policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'kb_feedback' AND policyname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback"
    ON public.kb_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Restrict search_analytics inserts to authenticated users only
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Drop any existing permissive insert policies
  FOR policy_name IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'search_analytics' AND cmd = 'INS'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.search_analytics', policy_name);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can insert search analytics"
ON public.search_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
