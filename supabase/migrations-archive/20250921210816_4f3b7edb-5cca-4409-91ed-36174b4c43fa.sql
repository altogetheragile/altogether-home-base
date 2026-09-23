-- Clean up legacy knowledge_templates table after successful migration
-- First, ensure all data has been migrated
DO $$
BEGIN
    -- Verify migration is complete
    IF (SELECT COUNT(*) FROM public.knowledge_templates) = 0 OR 
       (SELECT COUNT(*) FROM public.knowledge_templates) = (SELECT COUNT(*) FROM public.media_assets WHERE is_template = true) THEN
        
        -- Remove old foreign key constraint from knowledge_item_templates
        ALTER TABLE public.knowledge_item_templates 
        DROP CONSTRAINT IF EXISTS knowledge_item_templates_template_id_fkey;
        
        -- Drop the old template_id column
        ALTER TABLE public.knowledge_item_templates 
        DROP COLUMN IF EXISTS template_id;
        
        -- Drop the legacy knowledge_templates table
        DROP TABLE IF EXISTS public.knowledge_templates;
        
        -- Update RLS policies for media_assets to handle templates
        DROP POLICY IF EXISTS "Users can view templates" ON public.media_assets;
        CREATE POLICY "Users can view templates and media" 
        ON public.media_assets 
        FOR SELECT 
        USING (true);
        
        -- Update templates usage function to work with media_assets
        DROP FUNCTION IF EXISTS public.increment_template_usage_count(uuid);
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
        
    END IF;
END $$;