-- Add slug column to exams
ALTER TABLE exams ADD COLUMN slug text;

-- Populate slugs for existing exams
UPDATE exams SET slug = 'agilepm-foundation-paper-1' WHERE title = 'AgilePM Foundation - Paper 1';
UPDATE exams SET slug = 'professional-scrum-master' WHERE title = 'Professional Scrum Master';

-- For any other exams, generate slug from title
UPDATE exams SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE exams ALTER COLUMN slug SET NOT NULL;
ALTER TABLE exams ADD CONSTRAINT exams_slug_key UNIQUE (slug);

-- Index for fast lookups
CREATE INDEX idx_exams_slug ON exams (slug);
