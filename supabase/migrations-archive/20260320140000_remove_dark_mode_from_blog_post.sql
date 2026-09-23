-- Remove @media (prefers-color-scheme: dark) block from the AI blog post.
-- The site is always light-themed, so dark mode CSS causes invisible text
-- when the user's OS is in dark mode.

ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

UPDATE public.blog_posts
SET content = regexp_replace(
  content,
  '@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{[^}]*(\{[^}]*\}[^}]*)*\}',
  '',
  'g'
),
updated_at = now()
WHERE slug = 'how-ai-is-changing-software-development';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
