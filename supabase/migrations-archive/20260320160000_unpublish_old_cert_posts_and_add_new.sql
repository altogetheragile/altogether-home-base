-- Step 1: Unpublish the two old certification posts
UPDATE public.blog_posts
SET is_published = false, updated_at = now()
WHERE slug IN ('agile-training-certification-1', 'agile-training-certification-2');
