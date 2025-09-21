-- Fix the function parameter naming issue
DROP FUNCTION IF EXISTS public.increment_template_usage_count(uuid);
DROP FUNCTION IF EXISTS public.increment_pdf_template_usage(uuid);

-- Create new function with correct naming
CREATE OR REPLACE FUNCTION public.increment_template_usage_count(asset_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.media_assets 
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = asset_uuid AND is_template = true;
END;
$function$;