-- Add show_recommendations column to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN show_recommendations BOOLEAN DEFAULT false;

-- Set initial value for existing settings
UPDATE public.site_settings
SET show_recommendations = false
WHERE id = '00000000-0000-0000-0000-000000000001';