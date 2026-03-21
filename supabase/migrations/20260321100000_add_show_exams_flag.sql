-- Add show_exams feature flag to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_exams boolean DEFAULT true;
