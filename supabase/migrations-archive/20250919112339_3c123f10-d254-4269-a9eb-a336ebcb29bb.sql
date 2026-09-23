-- First, update duplicate templates to have incremental versions
WITH numbered_duplicates AS (
  SELECT id, title, version,
    ROW_NUMBER() OVER (PARTITION BY title, version ORDER BY created_at) as rn
  FROM public.knowledge_templates
  WHERE (title, version) IN (
    SELECT title, version 
    FROM public.knowledge_templates 
    GROUP BY title, version 
    HAVING COUNT(*) > 1
  )
)
UPDATE public.knowledge_templates 
SET version = CASE 
  WHEN rn = 1 THEN version -- Keep first one as is
  ELSE version || '.' || rn::text -- Add suffix to duplicates
END
FROM numbered_duplicates 
WHERE knowledge_templates.id = numbered_duplicates.id;

-- Add function to get next version for a template title
CREATE OR REPLACE FUNCTION public.get_next_template_version(template_title text)
RETURNS text AS $$
DECLARE
  max_version text;
  version_parts text[];
  major_version integer;
  minor_version integer;
BEGIN
  -- Get the highest version for this template title
  SELECT version INTO max_version
  FROM public.knowledge_templates 
  WHERE title = template_title 
  ORDER BY 
    CASE 
      WHEN version ~ '^\d+\.\d+$' THEN 
        (split_part(version, '.', 1)::integer * 1000 + split_part(version, '.', 2)::integer)
      ELSE 0 
    END DESC
  LIMIT 1;
  
  -- If no existing version found, start with 1.0
  IF max_version IS NULL THEN
    RETURN '1.0';
  END IF;
  
  -- Parse version (assume format is major.minor)
  version_parts := string_to_array(max_version, '.');
  
  -- If version format is invalid, return 1.0
  IF array_length(version_parts, 1) < 2 THEN
    RETURN '1.0';
  END IF;
  
  major_version := version_parts[1]::integer;
  minor_version := version_parts[2]::integer;
  
  -- Increment minor version
  minor_version := minor_version + 1;
  
  RETURN major_version || '.' || minor_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Now add unique constraint to prevent future duplicates
ALTER TABLE public.knowledge_templates 
ADD CONSTRAINT unique_template_title_version 
UNIQUE (title, version);