-- A public bucket for user-uploaded images (persona avatars, and future tool
-- images). Existing buckets are admin-insert only; signed-in users need somewhere
-- to upload their own images. Public read; authenticated insert; owner-scoped
-- update/delete.

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload to user-uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'user-uploads');

create policy "Public read for user-uploads"
  on storage.objects for select
  using (bucket_id = 'user-uploads');

create policy "Owners can update their user-uploads"
  on storage.objects for update to authenticated
  using (bucket_id = 'user-uploads' and owner = auth.uid());

create policy "Owners can delete their user-uploads"
  on storage.objects for delete to authenticated
  using (bucket_id = 'user-uploads' and owner = auth.uid());
