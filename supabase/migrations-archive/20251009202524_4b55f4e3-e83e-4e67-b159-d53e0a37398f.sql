-- Fix RLS policy gaps for admin_audit_log
-- Add DELETE and UPDATE policies (even though we typically don't delete/update audit logs)
CREATE POLICY "Admins cannot modify audit logs"
ON public.admin_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "Admins cannot delete audit logs"
ON public.admin_audit_log
FOR DELETE
USING (false);

-- Ensure all other tables have comprehensive policies
-- Check if there are any tables with RLS enabled but incomplete policies