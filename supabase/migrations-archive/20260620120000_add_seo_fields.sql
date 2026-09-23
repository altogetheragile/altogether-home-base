-- Per-page SEO override fields for exams and courses (mirrors blog_posts.seo_*).
-- Nullable; the prerender falls back to title/description when these are empty.
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS seo_description text;
