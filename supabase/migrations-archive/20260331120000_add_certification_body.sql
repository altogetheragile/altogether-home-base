-- Add certification_body column to event_templates
ALTER TABLE event_templates
  ADD COLUMN certification_body text DEFAULT NULL;

-- Backfill existing APMG courses based on title
UPDATE event_templates
  SET certification_body = 'APMG'
  WHERE lower(title) LIKE '%agilepm%'
     OR lower(title) LIKE '%agileba%'
     OR lower(title) LIKE '%agile digital%';
