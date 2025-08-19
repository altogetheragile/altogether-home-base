-- Create Business Model Canvas knowledge technique
INSERT INTO public.knowledge_techniques (
  name,
  slug,
  summary,
  description,
  purpose,
  difficulty_level,
  estimated_reading_time,
  is_published,
  is_featured,
  content_type,
  category_id,
  seo_title,
  seo_description,
  seo_keywords,
  created_by
) VALUES (
  'Business Model Canvas',
  'business-model-canvas',
  'A strategic management template for developing new or documenting existing business models. The BMC is a visual chart with elements describing a firm''s value propositions, infrastructure, customers, and finances.',
  'The Business Model Canvas is a strategic management and lean startup template for developing new or documenting existing business models. It is a visual chart with elements describing a firm''s or product''s value propositions, infrastructure, customers, and finances, assisting businesses to align their activities by illustrating potential trade-offs.

## The 9 Building Blocks

### 1. Key Partners
Who are your key partners and suppliers? What key resources are you acquiring from partners? What key activities do partners perform?

### 2. Key Activities  
What key activities does your value proposition require? Your distribution channels? Customer relationships? Revenue streams?

### 3. Key Resources
What key resources does your value proposition require? Your distribution channels? Customer relationships? Revenue streams?

### 4. Value Propositions
What value do you deliver to the customer? Which customer problems are you solving? What bundles of products and services are you offering?

### 5. Customer Relationships
What type of relationship does each customer segment expect you to establish and maintain with them?

### 6. Channels
Through which channels do your customer segments want to be reached? Which ones work best? Which ones are most cost-efficient?

### 7. Customer Segments
For whom are you creating value? Who are your most important customers?

### 8. Cost Structure
What are the most important costs inherent in your business model? Which key resources are most expensive? Which key activities are most expensive?

### 9. Revenue Streams
For what value are your customers really willing to pay? For what do they currently pay? What is each revenue stream''s contribution to overall revenues?',
  'To provide a comprehensive framework for developing and analyzing business models across all industries and business types.',
  'Intermediate',
  15,
  true,
  true,
  'technique',
  (SELECT id FROM knowledge_categories WHERE name = 'Strategy' LIMIT 1),
  'Business Model Canvas - Strategic Planning Template | Knowledge Base',
  'Learn how to create and use the Business Model Canvas for strategic planning. Complete guide with AI-powered generation tools.',
  ARRAY['business model canvas', 'bmc', 'strategic planning', 'lean startup', 'value proposition', 'business strategy'],
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Add some example media for the BMC technique
INSERT INTO public.knowledge_media (
  technique_id,
  title,
  description,
  type,
  url,
  position
) VALUES (
  (SELECT id FROM knowledge_techniques WHERE slug = 'business-model-canvas'),
  'Business Model Canvas Template',
  'Visual template showing the 9 building blocks of the Business Model Canvas',
  'image',
  '/placeholder.svg',
  1
);

-- Add some practical examples
INSERT INTO public.knowledge_examples (
  technique_id,
  title,
  description,
  context,
  outcome,
  industry,
  company_size,
  position
) VALUES 
(
  (SELECT id FROM knowledge_techniques WHERE slug = 'business-model-canvas'),
  'Netflix Business Model Canvas',
  'How Netflix uses the BMC to structure their streaming and content creation business model',
  'Netflix needed to pivot from DVD-by-mail to streaming and eventually content creation',
  'Clear visualization of how different business components work together, leading to strategic decisions about original content investment',
  'Entertainment',
  'Large',
  1
),
(
  (SELECT id FROM knowledge_techniques WHERE slug = 'business-model-canvas'),
  'Local Coffee Shop BMC',
  'Small business application of BMC for strategic planning and investor presentations',
  'New coffee shop owner needed to clarify business model for loan application',
  'Secured funding and clear operational strategy, identified key partnerships with local suppliers',
  'Retail',
  'Small',
  2
);

-- Add relevant tags
INSERT INTO public.knowledge_technique_tags (technique_id, tag_id)
SELECT 
  (SELECT id FROM knowledge_techniques WHERE slug = 'business-model-canvas'),
  kt.id
FROM knowledge_tags kt 
WHERE kt.name IN ('strategy', 'planning', 'business', 'framework')
ON CONFLICT DO NOTHING;