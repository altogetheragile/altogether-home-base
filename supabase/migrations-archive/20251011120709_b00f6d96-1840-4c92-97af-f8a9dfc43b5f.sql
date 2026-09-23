-- Create table to track anonymous API usage for rate limiting
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  request_count INTEGER DEFAULT 1
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_endpoint_created 
  ON public.anonymous_usage(ip_address, endpoint, created_at DESC);

-- Enable RLS
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (edge functions)
CREATE POLICY "Service role can insert anonymous usage"
  ON public.anonymous_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Admins can view all anonymous usage
CREATE POLICY "Admins can view anonymous usage"
  ON public.anonymous_usage
  FOR SELECT
  USING (is_admin());

-- Function to clean up old records (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.anonymous_usage
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;