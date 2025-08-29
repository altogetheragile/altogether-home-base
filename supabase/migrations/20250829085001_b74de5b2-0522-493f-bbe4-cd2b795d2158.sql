-- Add missing W5H fields to knowledge_items table
ALTER TABLE public.knowledge_items 
ADD COLUMN IF NOT EXISTS generic_how_much text,
ADD COLUMN IF NOT EXISTS generic_summary text,
ADD COLUMN IF NOT EXISTS example_use_case text,
ADD COLUMN IF NOT EXISTS example_how_much text,
ADD COLUMN IF NOT EXISTS example_summary text,
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS background text;

-- Update existing knowledge items with sample W5H data for Value Proposition Canvas
UPDATE public.knowledge_items 
SET 
  generic_who = 'Product Owners, Business Analysts, UX Designers, Strategic Stakeholders',
  generic_what = 'Identify and align customer pains, gains, and jobs with product features',
  generic_when = 'During discovery, design sprints, or product refinement',
  generic_where = 'In collaborative workshops using templates or digital canvases',
  generic_why = 'To ensure the product is solving real problems for the right audience',
  generic_how = 'Map the customer profile to the value map, exploring fit and validation',
  generic_how_much = 'Minimal cost and effort, high return in product clarity and focus',
  generic_summary = 'A cross-functional team uses the Value Proposition Canvas to explore customer needs and align product features. The technique clarifies assumptions, surfaces gaps, and strengthens user-product fit early in the process.',
  example_use_case = 'A startup uses the Value Proposition Canvas to align a new meal delivery app''s features with the specific needs and lifestyle of health-conscious urban professionals.',
  example_who = 'Startup founder and cross-functional product team',
  example_what = 'Validate customer needs and align product features with real value',
  example_when = 'Early-stage planning before feature prioritization',
  example_where = 'Remote planning session using whiteboard tools like Miro',
  example_why = 'To ensure the product delivers clear value to target users',
  example_how = 'Mapped pains, gains, and jobs to product ideas; reviewed with stakeholders',
  example_how_much = 'Low-cost team workshop; high ROI in terms of clarity and alignment',
  example_summary = 'A startup team used the Value Proposition Canvas during early planning to align their product with real user needs. In a remote session, they mapped customer pains, gains, and jobs against product features to refine their offering and reduce risk. The session helped unify the team and sharpen product direction.'
WHERE slug = 'value-proposition-canvas' OR name ILIKE '%value proposition%';

-- Update Business Model Canvas with sample data
UPDATE public.knowledge_items 
SET 
  generic_who = 'Entrepreneurs, Business Strategists, Product Managers, Innovation Teams',
  generic_what = 'Create a visual representation of business model components and their relationships',
  generic_when = 'During business planning, strategy sessions, or business model innovation',
  generic_where = 'In collaborative workshops, strategy meetings, or design thinking sessions',
  generic_why = 'To understand, design, and communicate business models clearly and systematically',
  generic_how = 'Fill out the nine building blocks of the canvas collaboratively, iterating and validating assumptions',
  generic_how_much = 'Low cost workshop activity with high strategic value and clarity benefits',
  generic_summary = 'Teams use the Business Model Canvas to visualize and design business models through nine interconnected building blocks. The canvas facilitates strategic thinking, identifies gaps, and enables rapid iteration of business concepts.',
  example_use_case = 'A fintech startup uses the Business Model Canvas to design their digital banking platform business model before seeking investment.',
  example_who = 'Fintech startup founding team and advisors',
  example_what = 'Design and validate the business model for a digital banking platform',
  example_when = 'Pre-funding phase during business model development',
  example_where = 'Startup office using physical canvas and sticky notes',
  example_why = 'To create a clear, investable business model for funding rounds',
  example_how = 'Mapped customer segments, value propositions, channels, and revenue streams iteratively',
  example_how_much = 'Two-day workshop investment with significant strategic clarity return',
  example_summary = 'A fintech startup used the Business Model Canvas over two intensive workshops to design their digital banking business model. The visual approach helped align the founding team, identify critical assumptions, and create a compelling narrative for investors.'
WHERE slug = 'business-model-canvas' OR name ILIKE '%business model%';

-- Add some sample data for other techniques (this would normally come from your Excel import)
UPDATE public.knowledge_items 
SET 
  generic_who = 'Scrum Masters, Product Owners, Development Teams, Agile Coaches',
  generic_what = 'Plan and organize work for upcoming sprints using structured ceremonies',
  generic_when = 'At the beginning of each sprint cycle in Scrum methodology',
  generic_where = 'In dedicated meeting rooms or virtual collaboration spaces',
  generic_why = 'To ensure team alignment, work prioritization, and capacity planning',
  generic_how = 'Conduct sprint planning meetings with story estimation and task breakdown',
  generic_how_much = 'Time-boxed to 2-4 hours depending on sprint length'
WHERE slug ILIKE '%sprint%' AND slug ILIKE '%planning%';