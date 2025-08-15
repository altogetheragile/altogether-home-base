-- Add visual branding and enhanced metadata to event_templates
ALTER TABLE public.event_templates 
ADD COLUMN brand_color text DEFAULT '#3B82F6',
ADD COLUMN icon_name text DEFAULT 'Calendar',
ADD COLUMN hero_image_url text,
ADD COLUMN banner_template text DEFAULT 'default',
ADD COLUMN learning_outcomes text[],
ADD COLUMN prerequisites text[],
ADD COLUMN target_audience text,
ADD COLUMN key_benefits text[],
ADD COLUMN template_tags text[],
ADD COLUMN difficulty_rating text CHECK (difficulty_rating IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
ADD COLUMN popularity_score integer DEFAULT 0;

-- Update existing templates with some default branding
UPDATE public.event_templates 
SET brand_color = '#10B981', icon_name = 'Users' 
WHERE title ILIKE '%scrum%' OR title ILIKE '%agile%';

UPDATE public.event_templates 
SET brand_color = '#8B5CF6', icon_name = 'BookOpen' 
WHERE title ILIKE '%leadership%' OR title ILIKE '%management%';

UPDATE public.event_templates 
SET brand_color = '#F59E0B', icon_name = 'Zap' 
WHERE title ILIKE '%workshop%' OR title ILIKE '%training%';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_templates_brand_color ON public.event_templates(brand_color);
CREATE INDEX IF NOT EXISTS idx_event_templates_difficulty ON public.event_templates(difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_event_templates_popularity ON public.event_templates(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_event_templates_tags ON public.event_templates USING GIN(template_tags);

-- Update the useTemplates hook interface
COMMENT ON COLUMN public.event_templates.brand_color IS 'Template brand color in hex format for visual consistency';
COMMENT ON COLUMN public.event_templates.icon_name IS 'Lucide icon name for template visual identity';
COMMENT ON COLUMN public.event_templates.learning_outcomes IS 'Array of learning outcomes for events using this template';
COMMENT ON COLUMN public.event_templates.key_benefits IS 'Array of key benefits participants will gain';
COMMENT ON COLUMN public.event_templates.template_tags IS 'Array of tags for categorizing and filtering templates';