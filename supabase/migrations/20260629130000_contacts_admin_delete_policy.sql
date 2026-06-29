-- Ensure admins can delete leads from the contacts table. A delete policy existed in
-- early migrations, but the consolidated 20260318010151 baseline recreated the table
-- with only insert/select/update policies, so a live DB built from that baseline has no
-- DELETE policy (RLS then denies all deletes). This is idempotent: safe to run whether
-- or not the policy already exists.

DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;

CREATE POLICY "Admins can delete contacts"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (is_admin());
