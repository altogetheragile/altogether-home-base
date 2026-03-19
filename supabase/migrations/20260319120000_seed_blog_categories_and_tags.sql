-- Seed blog categories and tags, then assign them to the 14 migrated WordPress posts

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
INSERT INTO public.blog_categories (name, slug, description, color) VALUES
  ('Agile Fundamentals', 'agile-fundamentals', 'Core concepts, frameworks, and introductions to agile ways of working.', '#B2DFDB'),
  ('Coaching & Leadership', 'coaching-leadership', 'Insights on agile coaching, leadership development, and personal growth.', '#FFCC80'),
  ('Certifications', 'certifications', 'Guides to agile certifications and professional development pathways.', '#CE93D8'),
  ('Techniques & Tools', 'techniques-tools', 'Practical techniques, models, and tools for agile practitioners.', '#90CAF9'),
  ('Product & Delivery', 'product-delivery', 'Product management, MVP thinking, and delivery practices.', '#A5D6A7')
ON CONFLICT (slug) DO NOTHING;

-- ─── TAGS ─────────────────────────────────────────────────────────────────────
INSERT INTO public.blog_tags (name, slug, usage_count) VALUES
  ('Scrum',                'scrum',                0),
  ('Kanban',               'kanban',               0),
  ('Agile Coaching',       'agile-coaching',       0),
  ('Continuous Improvement','continuous-improvement',0),
  ('Lean',                 'lean',                 0),
  ('MVP',                  'mvp',                  0),
  ('Frameworks',           'frameworks',           0),
  ('Team Dynamics',        'team-dynamics',        0),
  ('Self-awareness',       'self-awareness',       0),
  ('Retrospectives',       'retrospectives',       0),
  ('Leadership',           'leadership',           0),
  ('Certification',        'certification',        0),
  ('Management 3.0',       'management-3-0',       0),
  ('Reading',              'reading',              0)
ON CONFLICT (slug) DO NOTHING;

-- ─── ASSIGN CATEGORIES TO POSTS ───────────────────────────────────────────────
-- An Introduction to Agile → Agile Fundamentals
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'agile-fundamentals')
WHERE slug = 'an-introduction-to-agile';

-- What is Agile Part 2 → Agile Fundamentals
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'agile-fundamentals')
WHERE slug = 'what-is-agile-part-2-agile-frameworks';

-- What is Agile Part 3 → Agile Fundamentals
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'agile-fundamentals')
WHERE slug = 'what-is-agile-part-3-unpredictability-change';

-- Successful Agile Teams Fail Every Day → Agile Fundamentals
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'agile-fundamentals')
WHERE slug = 'successful-agile-teams-fail-every-day';

-- Top Ten Agile Failures → Agile Fundamentals
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'agile-fundamentals')
WHERE slug = 'top-ten-agile-failures';

-- Agile Certification Part 1 → Certifications
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'certifications')
WHERE slug = 'agile-training-certification-1';

-- Agile Certification Part 2 → Certifications
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'certifications')
WHERE slug = 'agile-training-certification-2';

-- User Story Mapping → Techniques & Tools
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'techniques-tools')
WHERE slug = 'user-story-mapping';

-- PDCA Model → Techniques & Tools
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'techniques-tools')
WHERE slug = 'the-pdca-model-explained-exploring-the-deming-cycle';

-- Moving Motivators → Techniques & Tools
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'techniques-tools')
WHERE slug = 'better-coaching-with-moving-motivators';

-- Understanding MVP → Product & Delivery
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'product-delivery')
WHERE slug = 'understanding-mvp-meaning';

-- Overcome Imposter Syndrome → Coaching & Leadership
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'coaching-leadership')
WHERE slug = 'overcome-imposter-syndrome';

-- Coaching Benefits → Coaching & Leadership
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'coaching-leadership')
WHERE slug = 'coaching-benefits';

-- Agile Reading List → Coaching & Leadership
UPDATE public.blog_posts SET category_id = (SELECT id FROM public.blog_categories WHERE slug = 'coaching-leadership')
WHERE slug = 'agile-reading-list';

-- ─── ASSIGN TAGS TO POSTS ─────────────────────────────────────────────────────
-- Helper: insert tag links using slugs
INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT bp.id, bt.id FROM public.blog_posts bp, public.blog_tags bt
WHERE (bp.slug, bt.slug) IN (
  -- An Introduction to Agile
  ('an-introduction-to-agile', 'scrum'),
  ('an-introduction-to-agile', 'kanban'),
  ('an-introduction-to-agile', 'continuous-improvement'),
  ('an-introduction-to-agile', 'team-dynamics'),
  -- What is Agile Part 2
  ('what-is-agile-part-2-agile-frameworks', 'scrum'),
  ('what-is-agile-part-2-agile-frameworks', 'kanban'),
  ('what-is-agile-part-2-agile-frameworks', 'lean'),
  ('what-is-agile-part-2-agile-frameworks', 'frameworks'),
  -- What is Agile Part 3
  ('what-is-agile-part-3-unpredictability-change', 'frameworks'),
  ('what-is-agile-part-3-unpredictability-change', 'leadership'),
  -- Successful Agile Teams Fail
  ('successful-agile-teams-fail-every-day', 'team-dynamics'),
  ('successful-agile-teams-fail-every-day', 'continuous-improvement'),
  ('successful-agile-teams-fail-every-day', 'retrospectives'),
  -- Top Ten Agile Failures
  ('top-ten-agile-failures', 'agile-coaching'),
  ('top-ten-agile-failures', 'leadership'),
  ('top-ten-agile-failures', 'team-dynamics'),
  -- Certification Part 1
  ('agile-training-certification-1', 'certification'),
  ('agile-training-certification-1', 'scrum'),
  -- Certification Part 2
  ('agile-training-certification-2', 'certification'),
  -- User Story Mapping
  ('user-story-mapping', 'scrum'),
  ('user-story-mapping', 'team-dynamics'),
  -- PDCA Model
  ('the-pdca-model-explained-exploring-the-deming-cycle', 'continuous-improvement'),
  ('the-pdca-model-explained-exploring-the-deming-cycle', 'lean'),
  ('the-pdca-model-explained-exploring-the-deming-cycle', 'retrospectives'),
  -- Moving Motivators
  ('better-coaching-with-moving-motivators', 'agile-coaching'),
  ('better-coaching-with-moving-motivators', 'management-3-0'),
  ('better-coaching-with-moving-motivators', 'self-awareness'),
  -- MVP
  ('understanding-mvp-meaning', 'mvp'),
  ('understanding-mvp-meaning', 'lean'),
  -- Imposter Syndrome
  ('overcome-imposter-syndrome', 'agile-coaching'),
  ('overcome-imposter-syndrome', 'self-awareness'),
  ('overcome-imposter-syndrome', 'leadership'),
  -- Coaching Benefits
  ('coaching-benefits', 'agile-coaching'),
  ('coaching-benefits', 'self-awareness'),
  ('coaching-benefits', 'leadership'),
  -- Reading List
  ('agile-reading-list', 'reading'),
  ('agile-reading-list', 'agile-coaching'),
  ('agile-reading-list', 'leadership')
)
ON CONFLICT (post_id, tag_id) DO NOTHING;

-- ─── UPDATE TAG USAGE COUNTS ──────────────────────────────────────────────────
UPDATE public.blog_tags bt
SET usage_count = (
  SELECT COUNT(*) FROM public.blog_post_tags bpt WHERE bpt.tag_id = bt.id
);
