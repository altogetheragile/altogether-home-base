-- Reset usage counts to reflect actual technique-tag associations
UPDATE knowledge_tags 
SET usage_count = (
  SELECT COUNT(*) 
  FROM knowledge_technique_tags 
  WHERE knowledge_technique_tags.tag_id = knowledge_tags.id
);

-- Create a function to automatically update usage counts when tags are added/removed
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM knowledge_technique_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM knowledge_technique_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically maintain usage counts
DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON knowledge_technique_tags;
CREATE TRIGGER trigger_update_tag_usage_count
  AFTER INSERT OR DELETE ON knowledge_technique_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();