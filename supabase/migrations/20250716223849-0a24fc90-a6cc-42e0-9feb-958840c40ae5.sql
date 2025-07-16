-- Create admin logs tables for system monitoring

-- Create postgres_logs table for database logs
CREATE TABLE IF NOT EXISTS public.postgres_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  identifier TEXT,
  event_message TEXT,
  error_severity TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create auth_logs table for authentication logs  
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.postgres_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view postgres logs"
ON public.postgres_logs
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view auth logs"
ON public.auth_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_postgres_logs_timestamp ON public.postgres_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON public.auth_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_postgres_logs_severity ON public.postgres_logs(error_severity);