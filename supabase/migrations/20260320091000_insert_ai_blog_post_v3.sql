-- Delete any broken partial row first, then re-insert
DELETE FROM public.blog_posts WHERE slug = 'how-ai-is-changing-software-development';

-- Minimal test insert first
INSERT INTO public.blog_posts (title, slug, content, is_published, estimated_reading_time)
VALUES (
  'How AI Is Changing Software Development: We Have Moved Up a Level of Abstraction',
  'how-ai-is-changing-software-development',
  'test content',
  false,
  9
);
