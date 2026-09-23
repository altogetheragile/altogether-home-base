-- Update knowledge_templates table for PDF template system
ALTER TABLE public.knowledge_templates 
DROP COLUMN IF EXISTS config,
DROP COLUMN IF EXISTS canvas_config,
DROP COLUMN IF EXISTS collaboration,
DROP COLUMN IF EXISTS assets;

-- Add PDF-specific columns
ALTER TABLE public.knowledge_templates 
ADD COLUMN pdf_url TEXT,
ADD COLUMN pdf_filename TEXT,
ADD COLUMN pdf_file_size INTEGER,
ADD COLUMN pdf_page_count INTEGER,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Update template_type to focus on PDF templates
ALTER TABLE public.knowledge_templates 
ALTER COLUMN template_type SET DEFAULT 'pdf';

-- Create storage bucket for PDF templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-templates', 
  'pdf-templates', 
  true,
  52428800, -- 50MB limit
  '{"application/pdf"}'
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for PDF templates
CREATE POLICY "Anyone can view PDF templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-templates');

CREATE POLICY "Admins can upload PDF templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-templates' AND is_admin());

CREATE POLICY "Admins can update PDF templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdf-templates' AND is_admin());

CREATE POLICY "Admins can delete PDF templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdf-templates' AND is_admin());

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION public.increment_pdf_template_usage(template_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.knowledge_templates 
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = now()
  WHERE id = template_uuid;
END;
$$;