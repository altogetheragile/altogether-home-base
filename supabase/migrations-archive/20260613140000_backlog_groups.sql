-- Multiple product backlogs per project. A "product backlog" is a project_artifacts
-- row of artifact_type 'product-backlog' (so it shows as a card on the project page
-- and opens in the ArtifactViewer). Each backlog_item optionally belongs to one via
-- backlog_artifact_id. Nullable for back-compat: existing items stay ungrouped and
-- show in the project's "all items" view. ON DELETE SET NULL so removing a backlog
-- card does not delete its items (they fall back to ungrouped).

alter table public.backlog_items
  add column if not exists backlog_artifact_id uuid
    references public.project_artifacts(id) on delete set null;

create index if not exists idx_backlog_items_backlog_artifact
  on public.backlog_items(backlog_artifact_id);
