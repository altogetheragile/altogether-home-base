
-- Allow admins to view all profiles (needed to show names/emails in admin registrations UI)
create policy "Admins can view all profiles"
on public.profiles
for select
using (is_admin());
