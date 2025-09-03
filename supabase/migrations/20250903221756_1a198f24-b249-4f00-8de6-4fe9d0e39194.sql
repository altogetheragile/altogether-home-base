-- Add new fields to knowledge_items table for enhanced structured content
ALTER TABLE public.knowledge_items 
ADD COLUMN common_pitfalls TEXT[],
ADD COLUMN evidence_sources TEXT[],
ADD COLUMN related_techniques TEXT[],
ADD COLUMN learning_value_summary TEXT,
ADD COLUMN key_terminology JSONB DEFAULT '{}',
ADD COLUMN author TEXT,
ADD COLUMN reference_url TEXT,
ADD COLUMN publication_year INTEGER;

-- Add check constraint for publication year
ALTER TABLE public.knowledge_items 
ADD CONSTRAINT check_publication_year 
CHECK (publication_year IS NULL OR (publication_year >= 1900 AND publication_year <= 2030));