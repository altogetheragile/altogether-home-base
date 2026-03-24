-- Add display_order to blog_posts for manual sorting
ALTER TABLE blog_posts ADD COLUMN display_order integer;

-- Initialize display_order from current published_at ordering
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST) as rn
  FROM blog_posts
)
UPDATE blog_posts SET display_order = ordered.rn
FROM ordered WHERE blog_posts.id = ordered.id;

CREATE INDEX idx_blog_posts_display_order ON blog_posts (display_order);
