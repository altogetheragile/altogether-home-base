-- Create audit log table for AI story generation
CREATE TABLE IF NOT EXISTS public.ai_generation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  story_level text NOT NULL,
  input_data jsonb NOT NULL,
  output_data jsonb,
  token_count integer,
  execution_time_ms integer,
  success boolean NOT NULL,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS idx_ai_audit_user_created ON public.ai_generation_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_level ON public.ai_generation_audit(story_level);

-- Enable RLS on audit table
ALTER TABLE public.ai_generation_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.ai_generation_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.ai_generation_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON public.ai_generation_audit
  FOR INSERT
  WITH CHECK (true);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
  ON public.ai_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 50,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamp with time zone;
BEGIN
  -- Get current window start (round down to the hour)
  v_window_start := date_trunc('hour', now());
  
  -- Try to get existing rate limit record
  SELECT request_count INTO v_current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start
    AND window_start > now() - make_interval(mins => p_window_minutes);
  
  -- If no record exists or window expired, create new one
  IF v_current_count IS NULL THEN
    INSERT INTO public.ai_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, v_window_start)
    ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET request_count = ai_rate_limits.request_count + 1;
    
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE public.ai_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start;
  
  RETURN true;
END;
$$;

-- Drop and recreate RLS policies for epics
DROP POLICY IF EXISTS "Users can view epics" ON public.epics;
DROP POLICY IF EXISTS "Authenticated users can create epics" ON public.epics;
DROP POLICY IF EXISTS "Users can update own epics" ON public.epics;
DROP POLICY IF EXISTS "Users can delete own epics" ON public.epics;
DROP POLICY IF EXISTS "Users can view all epics" ON public.epics;
DROP POLICY IF EXISTS "Users can create own epics" ON public.epics;

-- Epics: Users can view all, but only manage their own
CREATE POLICY "Users can view all epics"
  ON public.epics
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own epics"
  ON public.epics
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own epics"
  ON public.epics
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own epics"
  ON public.epics
  FOR DELETE
  USING (auth.uid() = created_by);

-- Drop and recreate RLS policies for features
DROP POLICY IF EXISTS "Users can view features" ON public.features;
DROP POLICY IF EXISTS "Authenticated users can create features" ON public.features;
DROP POLICY IF EXISTS "Users can update own features" ON public.features;
DROP POLICY IF EXISTS "Users can delete own features" ON public.features;
DROP POLICY IF EXISTS "Users can view all features" ON public.features;
DROP POLICY IF EXISTS "Users can create own features" ON public.features;

-- Features: Users can view all, but only manage their own
CREATE POLICY "Users can view all features"
  ON public.features
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own features"
  ON public.features
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own features"
  ON public.features
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own features"
  ON public.features
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add comments for documentation
COMMENT ON TABLE public.ai_generation_audit IS 'Audit log for AI story generation requests';
COMMENT ON TABLE public.ai_rate_limits IS 'Rate limiting for AI generation endpoints';
COMMENT ON FUNCTION public.check_ai_rate_limit IS 'Check if user has exceeded rate limit for AI generation';
