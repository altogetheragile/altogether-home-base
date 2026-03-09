-- Clean up duplicate and overlapping knowledge categories

-- First, update any techniques using the duplicate categories to use the primary ones
UPDATE knowledge_techniques 
SET category_id = (SELECT id FROM knowledge_categories WHERE slug = 'discovery-problem-framing' LIMIT 1)
WHERE category_id IN (
  SELECT id FROM knowledge_categories WHERE slug = 'discovery-&-problem-framing'
);

UPDATE knowledge_techniques 
SET category_id = (SELECT id FROM knowledge_categories WHERE slug = 'design-solution-ideation' LIMIT 1) 
WHERE category_id IN (
  SELECT id FROM knowledge_categories WHERE slug = 'design-&-solution-ideation'
);

-- Delete the duplicate categories
DELETE FROM knowledge_categories WHERE slug IN (
  'discovery-&-problem-framing',
  'design-&-solution-ideation'
);

-- Update category names and descriptions to be more distinct and comprehensive
UPDATE knowledge_categories SET 
  name = 'Discovery & Problem Framing',
  description = 'Techniques for understanding problems, user needs, and defining the right problems to solve'
WHERE slug = 'discovery-problem-framing';

UPDATE knowledge_categories SET 
  name = 'Design & Solution Ideation', 
  description = 'Methods for generating, evaluating, and developing creative solutions to problems'
WHERE slug = 'design-solution-ideation';

UPDATE knowledge_categories SET
  description = 'Core design methods for creating user experiences and interfaces'
WHERE slug = 'design';

UPDATE knowledge_categories SET 
  name = 'Delivery & Implementation',
  description = 'Practices for building, shipping, and deploying products and features'
WHERE slug = 'delivery-implementation';

UPDATE knowledge_categories SET
  name = 'Prototyping & Testing',
  description = 'Techniques for creating and testing early versions of solutions'
WHERE slug = 'delivery-prototyping';

UPDATE knowledge_categories SET
  description = 'Methods for understanding users, problems, and opportunities before designing solutions'
WHERE slug = 'discovery';

UPDATE knowledge_categories SET
  name = 'Growth & Scaling',
  description = 'Strategies for growing products, teams, and improving processes at scale'
WHERE slug = 'iteration-scaling';