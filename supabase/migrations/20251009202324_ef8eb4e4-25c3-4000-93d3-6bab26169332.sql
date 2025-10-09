-- Phase 1: Create Admin Audit Log System
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_table, target_id);

-- Phase 2: Harden Event Registrations Payment Security
-- Prevent users from modifying payment_status directly
DROP POLICY IF EXISTS "Users can update own registrations" ON public.event_registrations;

CREATE POLICY "Users can update registration details only"
ON public.event_registrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent modification of payment_status by users
  payment_status = (SELECT payment_status FROM public.event_registrations WHERE id = event_registrations.id)
);

-- Only service role can update payment status
CREATE POLICY "Service role can update payment status"
ON public.event_registrations
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Phase 3: Add Contact Form Rate Limiting & Security
-- Add IP tracking to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if same IP submitted in last 5 minutes
  IF EXISTS (
    SELECT 1 
    FROM public.contacts
    WHERE ip_address = NEW.ip_address
      AND submitted_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 5 minutes before submitting again.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add rate limiting trigger
DROP TRIGGER IF EXISTS check_contact_rate_limit_trigger ON public.contacts;
CREATE TRIGGER check_contact_rate_limit_trigger
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contact_rate_limit();

-- Phase 4: Add Missing RLS Policies
-- Ensure staging_data has proper policies
CREATE POLICY "Admins can manage staging data"
ON public.staging_data
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Phase 5: Create Admin Action Logging Functions
-- Log admin profile views
CREATE OR REPLACE FUNCTION public.log_admin_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if viewer is admin and viewing someone else's profile
  IF public.has_role(auth.uid(), 'admin') AND auth.uid() != NEW.id THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      metadata
    ) VALUES (
      auth.uid(),
      'VIEW_PROFILE',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'viewed_user_email', (SELECT email FROM auth.users WHERE id = NEW.id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Log admin modifications to sensitive tables
CREATE OR REPLACE FUNCTION public.log_admin_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      metadata
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE
        WHEN TG_OP = 'UPDATE' THEN 
          jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        WHEN TG_OP = 'DELETE' THEN 
          to_jsonb(OLD)
        ELSE 
          to_jsonb(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit logging to event_registrations
DROP TRIGGER IF EXISTS audit_event_registrations ON public.event_registrations;
CREATE TRIGGER audit_event_registrations
  AFTER UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_modification();

-- Add audit logging to user_roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_modification();