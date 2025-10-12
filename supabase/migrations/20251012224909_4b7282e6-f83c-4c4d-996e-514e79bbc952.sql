-- Add feature toggle columns to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS show_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_knowledge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_blog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_ai_tools BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_admin_routes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_protected_projects BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_dynamic_pages BOOLEAN DEFAULT true;

-- Initialize default values for the existing settings row
UPDATE public.site_settings
SET 
  show_events = false,
  show_knowledge = false,
  show_blog = false,
  show_ai_tools = true,
  show_contact = true,
  show_admin_routes = true,
  show_protected_projects = true,
  show_dynamic_pages = true
WHERE id = '00000000-0000-0000-0000-000000000001';