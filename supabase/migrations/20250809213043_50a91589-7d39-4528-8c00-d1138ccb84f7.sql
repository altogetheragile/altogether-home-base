-- Create sample learning paths and steps
INSERT INTO learning_paths (title, description, difficulty_level, estimated_duration_minutes, is_published, created_by) VALUES
  ('Agile Fundamentals', 'Master the basics of Agile methodology and learn essential practices for effective team collaboration.', 'beginner', 120, true, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
  ('UX Research Mastery', 'Comprehensive guide to user experience research methods and techniques for product development.', 'intermediate', 180, true, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
  ('Product Strategy Deep Dive', 'Advanced concepts in product strategy, roadmapping, and stakeholder management.', 'advanced', 240, true, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- Create sample learning path steps (using existing techniques if available)
-- First, let's get some technique IDs
DO $$
DECLARE
  agile_path_id uuid;
  ux_path_id uuid;
  strategy_path_id uuid;
  tech_ids uuid[];
BEGIN
  -- Get the learning path IDs
  SELECT id INTO agile_path_id FROM learning_paths WHERE title = 'Agile Fundamentals';
  SELECT id INTO ux_path_id FROM learning_paths WHERE title = 'UX Research Mastery';
  SELECT id INTO strategy_path_id FROM learning_paths WHERE title = 'Product Strategy Deep Dive';
  
  -- Get some technique IDs (if any exist)
  SELECT ARRAY(SELECT id FROM knowledge_techniques WHERE is_published = true LIMIT 10) INTO tech_ids;
  
  -- Only create steps if we have techniques
  IF array_length(tech_ids, 1) > 0 THEN
    -- Create steps for Agile Fundamentals
    INSERT INTO learning_path_steps (path_id, technique_id, step_order, description, estimated_minutes, is_optional) VALUES
      (agile_path_id, tech_ids[1], 1, 'Introduction to Agile principles', 30, false),
      (agile_path_id, tech_ids[2], 2, 'Scrum framework basics', 45, false),
      (agile_path_id, tech_ids[3], 3, 'Sprint planning techniques', 45, false);
    
    -- Create steps for UX Research (if we have enough techniques)
    IF array_length(tech_ids, 1) > 3 THEN
      INSERT INTO learning_path_steps (path_id, technique_id, step_order, description, estimated_minutes, is_optional) VALUES
        (ux_path_id, tech_ids[4], 1, 'User research fundamentals', 60, false),
        (ux_path_id, tech_ids[5], 2, 'Interview techniques', 60, false),
        (ux_path_id, tech_ids[6], 3, 'Data analysis methods', 60, false);
    END IF;
    
    -- Create steps for Product Strategy (if we have enough techniques)
    IF array_length(tech_ids, 1) > 6 THEN
      INSERT INTO learning_path_steps (path_id, technique_id, step_order, description, estimated_minutes, is_optional) VALUES
        (strategy_path_id, tech_ids[7], 1, 'Strategic thinking frameworks', 80, false),
        (strategy_path_id, tech_ids[8], 2, 'Market analysis techniques', 80, false),
        (strategy_path_id, tech_ids[9], 3, 'Roadmap development', 80, false);
    END IF;
  END IF;
END $$;