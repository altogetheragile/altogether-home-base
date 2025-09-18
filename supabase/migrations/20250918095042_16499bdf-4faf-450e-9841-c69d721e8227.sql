-- Foundation Phase: Enhanced Template System Schema

-- Add enhanced columns to knowledge_templates table
ALTER TABLE knowledge_templates 
ADD COLUMN canvas_config JSONB DEFAULT '{}',
ADD COLUMN assets JSONB DEFAULT '[]',
ADD COLUMN collaboration JSONB DEFAULT '{}';

-- Create template assets table for images/icons
CREATE TABLE template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES knowledge_templates(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'icon', 'font', 'shape')),
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for template_assets
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for template_assets
CREATE POLICY "Admins can manage all template assets" 
ON template_assets FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Users can manage assets for their templates" 
ON template_assets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM knowledge_templates kt 
    WHERE kt.id = template_assets.template_id 
    AND (kt.created_by = auth.uid() OR is_admin())
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM knowledge_templates kt 
    WHERE kt.id = template_assets.template_id 
    AND (kt.created_by = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Public can view assets for public templates" 
ON template_assets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM knowledge_templates kt 
    WHERE kt.id = template_assets.template_id 
    AND kt.is_public = true
  )
);

-- Create template versions table for history
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES knowledge_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL,
  canvas_config JSONB DEFAULT '{}',
  change_summary TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for template_versions
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for template_versions
CREATE POLICY "Admins can manage all template versions" 
ON template_versions FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Users can manage versions for their templates" 
ON template_versions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM knowledge_templates kt 
    WHERE kt.id = template_versions.template_id 
    AND (kt.created_by = auth.uid() OR is_admin())
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM knowledge_templates kt 
    WHERE kt.id = template_versions.template_id 
    AND (kt.created_by = auth.uid() OR is_admin())
  )
);

-- Create indexes for performance
CREATE INDEX idx_template_assets_template_id ON template_assets(template_id);
CREATE INDEX idx_template_assets_type ON template_assets(type);
CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_versions_version_number ON template_versions(template_id, version_number);

-- Create trigger for template_assets updated_at
CREATE TRIGGER update_template_assets_updated_at
  BEFORE UPDATE ON template_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();