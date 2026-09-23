-- Populate activity_domain_id for knowledge items based on technique names and context
UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'business-analysis')
WHERE slug IN (
  '5-whys', 'assumption-mapping', 'business-case', 'business-model-canvas', 
  'cost-benefit-analysis', 'impact-mapping', 'stakeholder-analysis', 
  'value-stream-mapping', 'process-mapping', 'requirements-gathering'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'design')
WHERE slug IN (
  'contextual-inquiry', 'user-persona', 'user-journey-mapping', 'wireframing',
  'prototyping', 'design-thinking', 'card-sorting', 'affinity-diagramming',
  'storyboarding', 'design-sprint'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'product-management')
WHERE slug IN (
  'a-b-testing', 'acceptance-criteria', 'cost-of-delay', 'feature-prioritization',
  'roadmapping', 'product-backlog', 'user-story-writing', 'kano-model',
  'release-planning', 'market-research'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'project-management')
WHERE slug IN (
  'sprint-planning', 'daily-standup', 'sprint-retrospective', 'sprint-review',
  'estimation-planning-poker', 'kanban', 'scrum', 'risk-assessment',
  'project-charter', 'gantt-charts'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'quality-assurance')
WHERE slug IN (
  'accessibility-audit', 'accessibility-audits', 'testing-strategy', 'test-planning',
  'bug-triage', 'code-review', 'performance-testing', 'security-testing',
  'usability-testing', 'acceptance-testing'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'engineering')
WHERE slug IN (
  'code-review', 'pair-programming', 'technical-debt-assessment', 
  'architecture-review', 'refactoring', 'continuous-integration',
  'deployment-strategy', 'monitoring', 'debugging', 'technical-documentation'
);

UPDATE knowledge_items 
SET activity_domain_id = (SELECT id FROM activity_domains WHERE slug = 'leadership')
WHERE slug IN (
  'team-building', 'one-on-one', 'performance-review', 'mentoring',
  'conflict-resolution', 'change-management', 'team-charter',
  'leadership-assessment', 'coaching', 'delegation'
);

-- Populate planning layer relationships for knowledge items
-- Strategy level techniques
INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, true
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'strategy'
AND ki.slug IN (
  'business-case', 'business-model-canvas', 'cost-of-delay', 'impact-mapping',
  'stakeholder-analysis', 'value-stream-mapping', 'roadmapping', 'market-research',
  'risk-assessment', 'change-management', 'project-charter'
);

-- Product & Project level techniques  
INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, true
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'product-project'
AND ki.slug IN (
  'acceptance-criteria', 'feature-prioritization', 'product-backlog', 'user-story-writing',
  'release-planning', 'sprint-planning', 'estimation-planning-poker', 'assumption-mapping',
  '5-whys', 'kano-model', 'user-persona', 'user-journey-mapping', 'contextual-inquiry'
);

-- Team & Sprint level techniques
INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, true
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'team-sprint'
AND ki.slug IN (
  'daily-standup', 'sprint-retrospective', 'sprint-review', 'kanban', 'scrum',
  'team-building', 'one-on-one', 'conflict-resolution', 'team-charter',
  'a-b-testing', 'testing-strategy', 'code-review', 'pair-programming'
);

-- Individual & Task level techniques
INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, true
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'individual-task'
AND ki.slug IN (
  'accessibility-audit', 'accessibility-audits', 'bug-triage', 'performance-testing',
  'usability-testing', 'wireframing', 'prototyping', 'card-sorting',
  'debugging', 'technical-documentation', 'mentoring', 'coaching'
);

-- Add secondary planning layer relationships where techniques span multiple layers
INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, false
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'team-sprint'
AND ki.slug IN ('user-story-writing', 'acceptance-criteria', 'estimation-planning-poker')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_item_planning_layers (knowledge_item_id, planning_layer_id, is_primary)
SELECT ki.id, pl.id, false
FROM knowledge_items ki, planning_layers pl
WHERE pl.slug = 'individual-task'
AND ki.slug IN ('code-review', 'testing-strategy', 'technical-debt-assessment')
ON CONFLICT DO NOTHING;