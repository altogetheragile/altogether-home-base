-- Create admin_logs table for storing application logs
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all logs" 
ON public.admin_logs 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert logs" 
ON public.admin_logs 
FOR INSERT 
WITH CHECK (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_created_by ON public.admin_logs(created_by);