-- Complete asset consolidation: migrate knowledge_templates to media_assets
INSERT INTO public.media_assets (
  id, type, title, description, url, thumbnail_url, file_size, file_type, 
  original_filename, is_template, template_category, template_version, 
  usage_count, is_public, created_at, updated_at, created_by, updated_by
)
SELECT 
  id,
  CASE 
    WHEN template_type = 'pdf' THEN 'document'
    WHEN template_type = 'canvas' THEN 'document'
    ELSE 'document'
  END as type,
  title,
  description,
  COALESCE(pdf_url, '') as url,
  thumbnail_url,
  pdf_file_size as file_size,
  CASE 
    WHEN pdf_filename IS NOT NULL THEN 'application/pdf'
    ELSE 'application/octet-stream'
  END as file_type,
  pdf_filename as original_filename,
  true as is_template,
  category as template_category,
  version as template_version,
  COALESCE(usage_count, 0) as usage_count,
  COALESCE(is_public, true) as is_public,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM public.knowledge_templates
WHERE NOT EXISTS (
  SELECT 1 FROM public.media_assets ma 
  WHERE ma.id = knowledge_templates.id
);

-- Update knowledge_item_templates to reference media_assets
-- First add new column
ALTER TABLE public.knowledge_item_templates 
ADD COLUMN IF NOT EXISTS media_asset_id uuid;

-- Update existing records to reference media_assets
UPDATE public.knowledge_item_templates 
SET media_asset_id = template_id 
WHERE media_asset_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM public.media_assets ma 
    WHERE ma.id = template_id AND ma.is_template = true
  );

-- Add foreign key constraint
ALTER TABLE public.knowledge_item_templates
ADD CONSTRAINT fk_knowledge_item_templates_media_asset
FOREIGN KEY (media_asset_id) REFERENCES public.media_assets(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_assets_is_template ON public.media_assets(is_template);
CREATE INDEX IF NOT EXISTS idx_media_assets_template_category ON public.media_assets(template_category);
CREATE INDEX IF NOT EXISTS idx_knowledge_item_templates_media_asset ON public.knowledge_item_templates(media_asset_id);