-- Create search analytics table
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  user_id UUID,
  session_id TEXT,
  ip_address TEXT,
  clicked_technique_id UUID,
  search_filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert search analytics" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (is_admin());

-- Add indexes for performance
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);
CREATE INDEX idx_search_analytics_user_id ON public.search_analytics(user_id) WHERE user_id IS NOT NULL;

-- Add full-text search indexes to knowledge_techniques
CREATE INDEX idx_knowledge_techniques_fts ON public.knowledge_techniques 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(summary, '')));

-- Add indexes for better filtering performance
CREATE INDEX idx_knowledge_techniques_category_published ON public.knowledge_techniques(category_id, is_published) WHERE is_published = true;
CREATE INDEX idx_knowledge_techniques_difficulty_published ON public.knowledge_techniques(difficulty_level, is_published) WHERE is_published = true;
CREATE INDEX idx_knowledge_techniques_featured_published ON public.knowledge_techniques(is_featured, is_published) WHERE is_published = true;

-- Create function for search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term TEXT, suggestion_limit INTEGER DEFAULT 5)
RETURNS TABLE(suggestion TEXT, type TEXT, count INTEGER) AS $$
BEGIN
  RETURN QUERY
  -- Technique names
  SELECT 
    t.name as suggestion,
    'technique'::TEXT as type,
    1 as count
  FROM knowledge_techniques t
  WHERE t.is_published = true 
    AND t.name ILIKE search_term || '%'
  ORDER BY t.popularity_score DESC, t.name
  LIMIT suggestion_limit
  
  UNION ALL
  
  -- Category names
  SELECT 
    c.name as suggestion,
    'category'::TEXT as type,
    COUNT(t.id)::INTEGER as count
  FROM knowledge_categories c
  LEFT JOIN knowledge_techniques t ON c.id = t.category_id AND t.is_published = true
  WHERE c.name ILIKE search_term || '%'
  GROUP BY c.name
  HAVING COUNT(t.id) > 0
  ORDER BY count DESC, c.name
  LIMIT suggestion_limit
  
  UNION ALL
  
  -- Popular tags
  SELECT 
    tag.name as suggestion,
    'tag'::TEXT as type,
    tag.usage_count::INTEGER as count
  FROM knowledge_tags tag
  WHERE tag.name ILIKE search_term || '%'
    AND tag.usage_count > 0
  ORDER BY tag.usage_count DESC, tag.name
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql STABLE;