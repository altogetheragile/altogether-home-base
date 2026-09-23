-- Phase 1: Add template-specific fields to media_assets table
ALTER TABLE public.media_assets 
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_category text,
ADD COLUMN IF NOT EXISTS template_version text DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Phase 2: Migrate data from knowledge_templates to media_assets
INSERT INTO public.media_assets (
  id, type, title, description, url, thumbnail_url, file_size, file_type, 
  original_filename, created_at, updated_at, created_by, updated_by,
  is_template, template_category, template_version, usage_count, is_public
)
SELECT 
  id,
  'template' as type,
  title,
  description,
  pdf_url as url,
  thumbnail_url,
  pdf_file_size as file_size,
  'application/pdf' as file_type,
  pdf_filename as original_filename,
  created_at,
  updated_at,
  created_by,
  updated_by,
  true as is_template,
  category as template_category,
  version as template_version,
  COALESCE(usage_count, 0) as usage_count,
  COALESCE(is_public, true) as is_public
FROM public.knowledge_templates
WHERE NOT EXISTS (
  SELECT 1 FROM public.media_assets ma WHERE ma.id = knowledge_templates.id
);

-- Phase 3: Create unified assets storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Phase 4: Create RLS policies for the unified assets bucket
CREATE POLICY "Public can view assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Users can upload their own assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'assets' AND 
    public.is_admin()
  );

-- Phase 5: Update knowledge_item_templates to reference media_assets
-- (The foreign key relationship should work since we're using the same IDs)