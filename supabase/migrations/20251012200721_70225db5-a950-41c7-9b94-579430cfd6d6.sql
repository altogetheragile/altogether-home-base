-- Ensure only one hero block per page
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_hero_per_page 
ON content_blocks (page_id) 
WHERE type = 'hero';

-- Create style templates table for reusable block styles
CREATE TABLE IF NOT EXISTS public.page_style_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_builtin BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_style_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.page_style_templates
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Public can view builtin templates
CREATE POLICY "Public can view builtin templates"
ON public.page_style_templates
FOR SELECT
TO authenticated
USING (is_builtin = true);

-- Insert builtin templates
INSERT INTO public.page_style_templates (name, description, styles, is_builtin) VALUES
('Modern', 'Clean modern design with bold typography', '{"backgroundColor":"bg-background","textColor":"text-foreground","titleFontSize":"text-[48px]","subtitleFontSize":"text-[24px]","fontWeight":"font-semibold","padding":"p-12","textAlign":"text-center"}', true),
('Classic', 'Timeless classic style', '{"backgroundColor":"bg-card","textColor":"text-foreground","titleFontSize":"text-[36px]","subtitleFontSize":"text-[18px]","fontWeight":"font-normal","padding":"p-8","textAlign":"text-left"}', true),
('Bold', 'High contrast bold design', '{"backgroundColor":"bg-primary","textColor":"text-primary-foreground","titleFontSize":"text-[64px]","subtitleFontSize":"text-[28px]","fontWeight":"font-bold","padding":"p-16","textAlign":"text-center"}', true),
('Minimal', 'Minimalist clean design', '{"backgroundType":"none","textColor":"text-muted-foreground","titleFontSize":"text-[32px]","subtitleFontSize":"text-[16px]","fontWeight":"font-light","padding":"p-4","textAlign":"text-center"}', true)
ON CONFLICT DO NOTHING;