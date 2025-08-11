-- Secure SECURITY DEFINER functions by locking search_path and add popular searches RPC

-- 1) Recreate has_role with locked search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- 2) Recreate increment_view_count with locked search_path
CREATE OR REPLACE FUNCTION public.increment_view_count(technique_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.knowledge_techniques 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = technique_id;
END;
$function$;

-- 3) Recreate increment_blog_view_count with locked search_path
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$function$;

-- 4) Tighten INSERT policy on search_analytics to authenticated users only
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'search_analytics' AND policyname = 'Anyone can insert search analytics'
  ) THEN
    DROP POLICY "Anyone can insert search analytics" ON public.search_analytics;
  END IF;
END $$;

CREATE POLICY "Authenticated users can insert search analytics"
ON public.search_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5) Create safe public RPC for popular searches (aggregated, no PII)
CREATE OR REPLACE FUNCTION public.get_popular_searches(
  p_limit int DEFAULT 5,
  p_days int DEFAULT 30
)
RETURNS TABLE(query text, search_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(sa.query)) AS query, COUNT(*)::bigint AS search_count
  FROM public.search_analytics sa
  WHERE sa.created_at >= now() - make_interval(days => GREATEST(p_days, 0))
  GROUP BY lower(trim(sa.query))
  ORDER BY COUNT(*) DESC
  LIMIT GREATEST(p_limit, 1)
$$;