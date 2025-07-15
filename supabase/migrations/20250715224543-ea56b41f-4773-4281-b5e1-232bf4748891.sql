-- Create function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_view_count(technique_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_techniques 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = technique_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;