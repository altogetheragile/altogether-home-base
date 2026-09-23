-- Fix difficulty_level constraint to accept lowercase values
ALTER TABLE public.knowledge_techniques 
DROP CONSTRAINT IF EXISTS knowledge_techniques_difficulty_level_check;

ALTER TABLE public.knowledge_techniques 
ADD CONSTRAINT knowledge_techniques_difficulty_level_check 
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'Beginner', 'Intermediate', 'Advanced'));