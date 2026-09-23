-- Reset pre-launch test data now that the site is live
-- Keeps real content (course_feedback) intact

-- 1. Truncate search analytics (test searches skew popular suggestions)
TRUNCATE TABLE public.search_analytics;

-- 2. Truncate admin audit log (pre-launch actions aren't meaningful)
TRUNCATE TABLE public.admin_audit_log;

-- 3. Truncate knowledge base feedback (test data only)
TRUNCATE TABLE public.kb_feedback;

-- 4. Truncate user reading progress (test reads only)
TRUNCATE TABLE public.user_reading_progress;

-- 5. Zero out view counters on knowledge items
UPDATE public.knowledge_items SET view_count = 0;

-- 6. Zero out view and like counters on blog posts
UPDATE public.blog_posts SET view_count = 0, like_count = 0;
