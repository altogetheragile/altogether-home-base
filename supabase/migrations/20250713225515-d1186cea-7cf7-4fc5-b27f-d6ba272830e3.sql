-- Populate knowledge tags
INSERT INTO public.knowledge_tags (name, slug, usage_count) VALUES
('Product Strategy', 'product-strategy', 5),
('User Research', 'user-research', 8),
('Agile Methodology', 'agile-methodology', 12),
('Team Collaboration', 'team-collaboration', 15),
('Stakeholder Management', 'stakeholder-management', 7),
('Requirements Gathering', 'requirements-gathering', 10),
('Risk Management', 'risk-management', 6),
('Communication', 'communication', 20),
('Planning', 'planning', 18),
('Execution', 'execution', 14),
('Measurement', 'measurement', 9),
('Innovation', 'innovation', 8),
('Leadership', 'leadership', 11),
('Process Improvement', 'process-improvement', 13),
('Customer Focus', 'customer-focus', 16),
('Quality Assurance', 'quality-assurance', 7),
('Data Analysis', 'data-analysis', 9),
('Problem Solving', 'problem-solving', 17),
('Change Management', 'change-management', 8),
('Decision Making', 'decision-making', 12)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for referencing
WITH category_mapping AS (
  SELECT id, name FROM public.knowledge_categories
)

-- Populate more knowledge techniques
INSERT INTO public.knowledge_techniques (
  name, slug, summary, description, difficulty_level, estimated_reading_time,
  category_id, is_published, is_featured, originator, purpose, popularity_score
)
SELECT 
  technique.name,
  technique.slug,
  technique.summary,
  technique.description,
  technique.difficulty_level,
  technique.estimated_reading_time,
  cm.id as category_id,
  technique.is_published,
  technique.is_featured,
  technique.originator,
  technique.purpose,
  technique.popularity_score
FROM (
  VALUES 
    ('User Story Mapping', 'user-story-mapping', 'Visual technique for organizing user stories and building shared understanding of product features.', 'User Story Mapping is a collaborative technique that helps teams organize user stories spatially to build shared understanding of the product and identify gaps in the backlog. The technique involves creating a visual map that shows the user journey horizontally and story details vertically, enabling teams to see the big picture while planning releases and iterations.', 'Intermediate', 15, 'Product Management', true, true, 'Jeff Patton', 'To build shared understanding of product features and organize user stories effectively', 85),
    
    ('Design Sprint', 'design-sprint', 'Five-day process for solving critical business questions through design, prototyping, and testing.', 'The Design Sprint is a five-day process developed at Google Ventures for solving critical business questions through design, prototyping, and user testing. This time-constrained process helps teams validate ideas quickly before committing significant resources to development. Each day has a specific focus: Map, Sketch, Decide, Prototype, and Test.', 'Advanced', 25, 'Product Management', true, false, 'Jake Knapp (Google Ventures)', 'To validate product ideas quickly and reduce risk through rapid prototyping and testing', 78),
    
    ('Story Point Estimation', 'story-point-estimation', 'Relative estimation technique using Fibonacci sequence for sizing user stories.', 'Story Point Estimation is an agile estimation technique that uses relative sizing rather than time-based estimates. Teams assign story points using the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) to represent the relative effort, complexity, and uncertainty of user stories. This approach helps teams plan sprints more effectively and improves estimation accuracy over time.', 'Beginner', 8, 'Agile & Scrum', true, false, 'Agile Community', 'To provide relative estimates for user stories that improve planning accuracy', 72),
    
    ('Stakeholder Analysis Matrix', 'stakeholder-analysis-matrix', 'Visual tool for mapping stakeholder influence and interest levels to inform engagement strategies.', 'The Stakeholder Analysis Matrix is a strategic tool that helps product managers identify, categorize, and prioritize stakeholders based on their level of influence and interest in the project. By plotting stakeholders on a grid with influence on one axis and interest on the other, teams can develop appropriate engagement strategies for each stakeholder group.', 'Intermediate', 12, 'Stakeholder Management', true, true, 'Project Management Institute', 'To systematically analyze and engage stakeholders based on their influence and interest', 68),
    
    ('Lean Canvas', 'lean-canvas', 'One-page business model canvas adapted for lean startups and new product development.', 'The Lean Canvas is a one-page business model template adapted from the Business Model Canvas specifically for lean startups and new product development. It focuses on problems, solutions, key metrics, and competitive advantages rather than traditional business plan elements. This tool helps entrepreneurs and product teams quickly capture and test their business model assumptions.', 'Beginner', 10, 'Strategy & Planning', true, false, 'Ash Maurya', 'To quickly capture and validate business model assumptions for new products', 82),
    
    ('Kano Model Analysis', 'kano-model-analysis', 'Customer satisfaction framework for prioritizing product features based on user delight.', 'The Kano Model is a framework for understanding customer satisfaction and feature prioritization developed by Professor Noriaki Kano. It categorizes product features into five types: Must-haves, Performance features, Delighters, Indifferent, and Reverse features. This analysis helps product teams prioritize features that will have the greatest impact on customer satisfaction.', 'Advanced', 20, 'Customer Research', true, true, 'Noriaki Kano', 'To prioritize product features based on their impact on customer satisfaction and delight', 75),
    
    ('Retrospective Techniques', 'retrospective-techniques', 'Collection of facilitation methods for team reflection and continuous improvement.', 'Retrospective Techniques encompass various facilitation methods used in agile teams to reflect on their processes, identify what is working well, and determine what needs improvement. Common techniques include Start-Stop-Continue, 4Ls (Liked, Learned, Lacked, Longed for), and Mad-Sad-Glad. These techniques promote team learning and continuous improvement.', 'Beginner', 12, 'Team & Leadership', true, false, 'Agile Community', 'To facilitate team reflection and drive continuous improvement in processes and collaboration', 90),
    
    ('Jobs-to-be-Done Framework', 'jobs-to-be-done-framework', 'Customer-centric approach focusing on the underlying jobs customers hire products to do.', 'The Jobs-to-be-Done (JTBD) Framework is a customer-centric approach that focuses on understanding the underlying "jobs" that customers are trying to accomplish when they "hire" a product or service. Rather than focusing on customer demographics or product features, JTBD examines the progress customers are trying to make in specific circumstances.', 'Intermediate', 18, 'Customer Research', true, true, 'Clayton Christensen', 'To understand customer motivations and develop products that help customers accomplish their desired outcomes', 87),
    
    ('OKRs (Objectives and Key Results)', 'okrs-objectives-key-results', 'Goal-setting framework that helps organizations set and track measurable objectives.', 'Objectives and Key Results (OKRs) is a goal-setting framework that helps organizations set challenging, ambitious goals and track their progress through measurable key results. Originally developed at Intel and popularized by Google, OKRs align teams around common objectives while maintaining focus on measurable outcomes rather than activities.', 'Intermediate', 15, 'Strategy & Planning', true, true, 'Andy Grove (Intel)', 'To align teams around ambitious objectives and track progress through measurable key results', 93)
) AS technique(name, slug, summary, description, difficulty_level, estimated_reading_time, category_name, is_published, is_featured, originator, purpose, popularity_score)
JOIN category_mapping cm ON cm.name = technique.category_name
ON CONFLICT (slug) DO NOTHING;

-- Link techniques to tags
INSERT INTO public.knowledge_technique_tags (technique_id, tag_id)
SELECT kt.id as technique_id, ktag.id as tag_id
FROM public.knowledge_techniques kt
JOIN public.knowledge_tags ktag ON TRUE
WHERE 
  -- User Story Mapping tags
  (kt.slug = 'user-story-mapping' AND ktag.slug IN ('product-strategy', 'user-research', 'agile-methodology', 'team-collaboration', 'planning')) OR
  -- Design Sprint tags  
  (kt.slug = 'design-sprint' AND ktag.slug IN ('product-strategy', 'user-research', 'innovation', 'team-collaboration', 'problem-solving')) OR
  -- Story Point Estimation tags
  (kt.slug = 'story-point-estimation' AND ktag.slug IN ('agile-methodology', 'planning', 'team-collaboration', 'execution')) OR
  -- Stakeholder Analysis Matrix tags
  (kt.slug = 'stakeholder-analysis-matrix' AND ktag.slug IN ('stakeholder-management', 'communication', 'planning', 'leadership')) OR
  -- Lean Canvas tags
  (kt.slug = 'lean-canvas' AND ktag.slug IN ('product-strategy', 'innovation', 'planning', 'decision-making')) OR
  -- Kano Model Analysis tags
  (kt.slug = 'kano-model-analysis' AND ktag.slug IN ('customer-focus', 'user-research', 'product-strategy', 'data-analysis', 'decision-making')) OR
  -- Retrospective Techniques tags
  (kt.slug = 'retrospective-techniques' AND ktag.slug IN ('team-collaboration', 'process-improvement', 'communication', 'leadership', 'change-management')) OR
  -- Jobs-to-be-Done Framework tags
  (kt.slug = 'jobs-to-be-done-framework' AND ktag.slug IN ('customer-focus', 'user-research', 'product-strategy', 'innovation')) OR
  -- OKRs tags
  (kt.slug = 'okrs-objectives-key-results' AND ktag.slug IN ('planning', 'measurement', 'leadership', 'execution', 'decision-making'))
ON CONFLICT (technique_id, tag_id) DO NOTHING;

-- Add some knowledge examples
INSERT INTO public.knowledge_examples (
  technique_id, title, description, context, outcome, industry, company_size, position
)
SELECT kt.id, ex.title, ex.description, ex.context, ex.outcome, ex.industry, ex.company_size, ex.position
FROM public.knowledge_techniques kt
JOIN (
  VALUES 
    ('user-story-mapping', 'E-commerce Checkout Redesign', 'Used story mapping to redesign a complex checkout process that had high abandonment rates.', 'Online retailer with 15% cart abandonment wanted to simplify their checkout flow.', 'Reduced cart abandonment by 8% and improved user satisfaction scores by 25%.', 'E-commerce', 'Medium', 1),
    ('design-sprint', 'Banking Mobile App Feature', 'Five-day design sprint to validate a new mobile banking feature before development.', 'Regional bank wanted to add bill splitting functionality but wasn''t sure about user adoption.', 'Validated core concept and identified 3 critical usability issues before development, saving estimated 2 months of rework.', 'Financial Services', 'Large', 1),
    ('story-point-estimation', 'Development Team Velocity', 'Implemented story point estimation to improve sprint planning accuracy.', 'Development team struggled with sprint commitments and frequently over or under-committed.', 'Improved sprint commitment accuracy from 60% to 85% over 6 sprints.', 'Technology', 'Small', 1),
    ('lean-canvas', 'SaaS Product Validation', 'Used Lean Canvas to validate business model assumptions for new productivity software.', 'Startup had an idea for productivity software but needed to validate market fit.', 'Identified key assumptions, ran experiments, and pivoted business model based on learnings before building MVP.', 'Software', 'Startup', 1),
    ('okrs-objectives-key-results', 'Product Team Alignment', 'Implemented OKRs to align product team around customer satisfaction goals.', 'Product team lacked clear direction and metrics for success.', 'Improved team alignment and delivered 3 major features that increased NPS by 15 points.', 'Technology', 'Medium', 1)
) AS ex(technique_slug, title, description, context, outcome, industry, company_size, position)
ON ex.technique_slug = kt.slug;

-- Add some technique relations for related content
INSERT INTO public.knowledge_technique_relations (
  technique_id, related_technique_id, relation_type, strength
)
SELECT 
  kt1.id as technique_id, 
  kt2.id as related_technique_id, 
  'related' as relation_type,
  3 as strength
FROM public.knowledge_techniques kt1
JOIN public.knowledge_techniques kt2 ON kt1.id != kt2.id
WHERE 
  -- User Story Mapping related to other planning techniques
  (kt1.slug = 'user-story-mapping' AND kt2.slug IN ('story-point-estimation', 'design-sprint', 'jobs-to-be-done-framework')) OR
  -- Design Sprint related to research and strategy techniques  
  (kt1.slug = 'design-sprint' AND kt2.slug IN ('user-story-mapping', 'kano-model-analysis', 'jobs-to-be-done-framework')) OR
  -- Lean Canvas related to strategy techniques
  (kt1.slug = 'lean-canvas' AND kt2.slug IN ('kano-model-analysis', 'jobs-to-be-done-framework', 'okrs-objectives-key-results')) OR
  -- OKRs related to planning and measurement
  (kt1.slug = 'okrs-objectives-key-results' AND kt2.slug IN ('retrospective-techniques', 'stakeholder-analysis-matrix', 'lean-canvas'))
ON CONFLICT DO NOTHING;