-- Create the missing knowledge page record
INSERT INTO pages (slug, title, description, is_published, created_at, updated_at)
VALUES ('knowledge', 'Knowledge Base', 'Browse our knowledge base of agile techniques', false, now(), now())
ON CONFLICT (slug) DO NOTHING;