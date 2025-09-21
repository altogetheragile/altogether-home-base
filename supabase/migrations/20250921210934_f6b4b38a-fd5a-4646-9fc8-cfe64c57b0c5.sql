-- Handle dependent objects before dropping knowledge_templates
-- Drop dependent constraints and policies in proper order

-- Drop template usage table and its dependencies
DROP TABLE IF EXISTS public.template_usage CASCADE;

-- Drop template assets table and its dependencies  
DROP TABLE IF EXISTS public.template_assets CASCADE;

-- Drop template versions table and its dependencies
DROP TABLE IF EXISTS public.template_versions CASCADE;

-- Now we can safely drop the knowledge_templates table
DROP TABLE IF EXISTS public.knowledge_templates CASCADE;

-- Clean up the knowledge_item_templates table structure
ALTER TABLE public.knowledge_item_templates 
DROP COLUMN IF EXISTS template_id CASCADE;

-- Ensure media_assets has proper RLS policies for templates
DROP POLICY IF EXISTS "Users can view templates and media" ON public.media_assets;
CREATE POLICY "Users can view templates and media" 
ON public.media_assets 
FOR SELECT 
USING (true);

-- Update function to work with media_assets
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