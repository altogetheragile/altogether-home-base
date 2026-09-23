-- Publish the imported knowledge items so they appear in filters
UPDATE knowledge_items 
SET is_published = true, 
    updated_at = now()
WHERE is_published = false;