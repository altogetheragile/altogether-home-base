-- Fix RLS on admin_audit_log: restrict INSERT to admins only.
-- The previous "System can insert audit logs" policy used WITH CHECK (true),
-- allowing any authenticated or anonymous user to insert audit log rows.
-- Since audit log writes happen in the context of admin actions, restrict to admins.

DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

CREATE POLICY "Only admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (public.is_admin());
