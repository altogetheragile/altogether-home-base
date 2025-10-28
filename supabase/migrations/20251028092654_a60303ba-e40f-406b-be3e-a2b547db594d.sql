-- Add support for anonymous AI generation

-- Add is_anonymous column to ai_generation_audit
ALTER TABLE public.ai_generation_audit
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Make user_id nullable for anonymous generations
ALTER TABLE public.ai_generation_audit
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for anonymous generations
CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_anonymous
  ON public.ai_generation_audit(is_anonymous, created_at DESC)
  WHERE is_anonymous = true;

-- Create function for anonymous rate limiting (3 requests per 24 hours by IP)
CREATE OR REPLACE FUNCTION public.check_anonymous_ai_rate_limit(
  p_ip_address text,
  p_endpoint text,
  p_max_requests integer DEFAULT 3,
  p_window_hours integer DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
BEGIN
  -- Count requests from this IP in the time window
  SELECT COUNT(*) INTO v_current_count
  FROM public.anonymous_usage
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at > now() - make_interval(hours => p_window_hours);
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Log this request
  INSERT INTO public.anonymous_usage (ip_address, endpoint, user_agent)
  VALUES (p_ip_address, p_endpoint, 'ai-generation');
  
  RETURN true;
END;
$$;