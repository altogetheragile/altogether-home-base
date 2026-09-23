-- Add show_resources flag to control the Resources nav dropdown
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS show_resources boolean DEFAULT true;

-- Add show_flow_game flag to control the Flow Game link
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS show_flow_game boolean DEFAULT true;
