-- Expand allowed content block types to include the new sections
ALTER TABLE public.content_blocks
  DROP CONSTRAINT IF EXISTS content_blocks_type_check;

ALTER TABLE public.content_blocks
  ADD CONSTRAINT content_blocks_type_check
  CHECK (
    type IN (
      'text',
      'image',
      'video',
      'hero',
      'section',
      'recommendations',
      'testimonials-carousel',
      'knowledge-items',
      'events-list',
      'blog-posts'
    )
  );

-- Optional: ensure position is non-negative
ALTER TABLE public.content_blocks
  ALTER COLUMN position SET DEFAULT 0;
