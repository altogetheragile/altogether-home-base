-- Scope backlog_items to its owner (red-team finding: the baseline policy was
-- `USING (true) WITH CHECK (true)`, so any authenticated user could read or write
-- another user's backlog by passing that project's id in a tool URL). Replace it
-- with project- or product-ownership, mirroring the project_artifact_links policy.
-- Both project_id and product_id paths are preserved; the service-role scripts
-- bypass RLS and are unaffected.

drop policy if exists "Authenticated can manage backlog_items" on public.backlog_items;

create policy "Owners manage backlog_items" on public.backlog_items
  for all to authenticated
  using (
    (project_id is not null and exists (
      select 1 from public.projects p where p.id = backlog_items.project_id and p.created_by = auth.uid()
    ))
    or (product_id is not null and exists (
      select 1 from public.products pr where pr.id = backlog_items.product_id and pr.created_by = auth.uid()
    ))
  )
  with check (
    (project_id is not null and exists (
      select 1 from public.projects p where p.id = backlog_items.project_id and p.created_by = auth.uid()
    ))
    or (product_id is not null and exists (
      select 1 from public.products pr where pr.id = backlog_items.product_id and pr.created_by = auth.uid()
    ))
  );
