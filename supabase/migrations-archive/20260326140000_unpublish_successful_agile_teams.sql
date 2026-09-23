-- Unpublish "Successful Agile Teams Fail Every Day" — content merged into PDCA post
UPDATE public.blog_posts
SET is_published = false, updated_at = now()
WHERE id = 'ed27b5ae-73f1-4667-b3b1-ff737e1ec4a3';
