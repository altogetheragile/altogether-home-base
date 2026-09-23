
-- Allow admins to delete any registration
create policy "Admins can delete any registration"
  on public.event_registrations
  for delete
  using (is_admin());
