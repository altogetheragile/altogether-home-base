-- Create classification_config table to manage visibility and settings for classification types
CREATE TABLE public.classification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_type text NOT NULL UNIQUE CHECK (classification_type IN ('categories', 'planning-focuses', 'activity-domains')),
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  custom_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.classification_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage classification config
CREATE POLICY "Admins can manage classification config"
  ON public.classification_config
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Everyone can view classification config
CREATE POLICY "Public can view classification config"
  ON public.classification_config
  FOR SELECT
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_classification_config_updated_at
  BEFORE UPDATE ON public.classification_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.classification_config (classification_type, is_visible, display_order, custom_label)
VALUES 
  ('categories', true, 1, 'Categories'),
  ('planning-focuses', true, 2, 'Planning Focuses'),
  ('activity-domains', true, 3, 'Activity Domains');