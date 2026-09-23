-- Remove broken link to non-existent /blog/isa-framework-planning-horizons
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

UPDATE public.blog_posts
SET content = REPLACE(
  content,
  '<p>If you are working at team or programme level and want to understand how certified frameworks like AgilePM connect to day-to-day delivery practice, our post on <a href="/blog/isa-framework-planning-horizons">planning horizons and structured agile delivery</a> is a useful next step.</p>',
  ''
)
WHERE slug = 'agile-certifications';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
