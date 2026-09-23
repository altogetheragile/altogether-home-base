-- Fix security warning: Set search_path for function
CREATE OR REPLACE FUNCTION public.create_knowledge_slug(input_text TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN lower(trim(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'))) 
         ||'-'|| 
         substr(md5(random()::text), 1, 8);
END;
$$;