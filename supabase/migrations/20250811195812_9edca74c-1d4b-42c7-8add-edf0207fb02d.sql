-- Lock search_path on remaining public functions flagged by linter

-- update_updated_at_column trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_tag_usage_count trigger
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_technique_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_technique_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- update_blog_tag_usage_count trigger
CREATE OR REPLACE FUNCTION public.update_blog_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.blog_post_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.blog_post_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$function$;