-- Insert missing reference data based on the Excel file content

-- Insert missing knowledge categories
INSERT INTO knowledge_categories (name, slug, description, color)
VALUES 
  ('Strategy & Direction', 'strategy-direction', 'Set the long-term ''why'' and ''where to play/how to win'': vision, goals, OKRs, and value propositions that align products and initiatives with organisational outcomes.', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING;

-- Insert missing activity domains  
INSERT INTO activity_domains (name, slug, description, color)
VALUES 
  ('Value Ownership', 'value-ownership', 'This domain is concerned with understanding stakeholders to ensure their needs and constraints are reflected in the solution to maximise value and benefits.', '#10B981')
ON CONFLICT (slug) DO NOTHING;

-- Insert missing activity focus
INSERT INTO activity_focus (name, slug, description, color)
VALUES 
  ('Long-term business goals and direction', 'long-term-business-goals-direction', 'Focus on strategic planning and long-term business direction.', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;