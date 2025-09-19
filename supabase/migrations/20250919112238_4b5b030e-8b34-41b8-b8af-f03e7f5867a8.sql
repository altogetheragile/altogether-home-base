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

-- Add unique constraint to prevent exact duplicates of same title + version
ALTER TABLE public.knowledge_templates 
ADD CONSTRAINT unique_template_title_version 
UNIQUE (title, version);