-- Add short_description column for card teasers
ALTER TABLE event_templates
ADD COLUMN IF NOT EXISTS short_description text;

-- Add is_published flag for template-level publishing
ALTER TABLE event_templates
ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Publish all existing templates that already have content
UPDATE event_templates
SET is_published = true
WHERE description IS NOT NULL AND description != '';
