-- Set the Blog page to unpublished so it's only accessible to admins
UPDATE pages 
SET is_published = false, 
    updated_at = now()
WHERE slug = 'blog';