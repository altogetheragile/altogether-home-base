-- Update the existing import record to use the correct target entity
UPDATE data_imports 
SET target_entity = 'knowledge_items' 
WHERE target_entity = 'knowledge_techniques';

-- Also ensure the check constraint allows knowledge_items
-- First check what constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'data_imports'::regclass 
AND contype = 'c';

-- Update the constraint to include knowledge_items instead of knowledge_techniques
ALTER TABLE data_imports DROP CONSTRAINT IF EXISTS data_imports_target_entity_check;

ALTER TABLE data_imports ADD CONSTRAINT data_imports_target_entity_check 
CHECK (target_entity IN ('knowledge_items', 'events', 'instructors', 'categories', 'tags', 'learning_paths'));