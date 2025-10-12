-- Create site_settings table for configurable footer
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  -- About Section
  company_name text DEFAULT 'AltogetherAgile',
  company_description text DEFAULT 'Empowering teams and organizations through agile transformation and coaching.',
  
  -- Contact Information (all optional)
  contact_email text,
  contact_phone text,
  contact_location text,
  
  -- Social Media Links (all optional)
  social_linkedin text,
  social_twitter text,
  social_facebook text,
  social_youtube text,
  social_github text,
  
  -- Quick Links (stored as JSONB array)
  quick_links jsonb DEFAULT '[{"label": "Home", "url": "/", "enabled": true}, {"label": "AI Tools", "url": "/bmc-generator", "enabled": true}, {"label": "Dashboard", "url": "/dashboard", "enabled": true}]'::jsonb,
  
  -- Footer Copyright
  copyright_text text DEFAULT 'All rights reserved.',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default row (only one row should exist)
INSERT INTO public.site_settings (id, contact_email) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'al@altogetheragile.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger to update updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();