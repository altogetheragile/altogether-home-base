-- Add show_dashboard column to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN show_dashboard BOOLEAN DEFAULT true;

-- Initialize the setting for existing row
UPDATE public.site_settings
SET show_dashboard = true
WHERE id = '00000000-0000-0000-0000-000000000001';