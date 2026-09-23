-- Add display_order column to event_templates for custom sorting on the public events page
ALTER TABLE event_templates ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Seed initial order based on current alphabetical title order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY title ASC) AS rn
  FROM event_templates
)
UPDATE event_templates
SET display_order = ordered.rn
FROM ordered
WHERE event_templates.id = ordered.id;
