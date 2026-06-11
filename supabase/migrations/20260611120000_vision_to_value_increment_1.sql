-- Vision to Value, Increment 1: provenance links, initiative container fields,
-- and the backlog fields the pipeline needs.
-- See docs/VISION_TO_VALUE.md sections 4.1 and 4.2.

-- 1. Initiative container fields on projects.
--    kind drives neutral vocabulary (Project / Product / Initiative);
--    intent_statement captures the one-question-upstream answer.
alter table public.projects
  add column if not exists intent_statement text,
  add column if not exists kind text not null default 'project';

-- 2. Backlog fields used by CSV export (Epic Link) and Persona Studio (Increment 2).
alter table public.backlog_items
  add column if not exists user_persona text,
  add column if not exists epic text;

-- 3. Provenance links between artifacts. Backlog items are relational while
--    impact-map nodes live inside artifact JSON, so from_id/to_id are text and
--    may be a composite path, e.g. '<artifact_id>#deliverable:<node_id>'.
create table if not exists public.project_artifact_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  from_type text not null,
  from_id text not null,
  to_type text not null,
  to_id text not null,
  link_kind text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_pal_project on public.project_artifact_links(project_id);
create index if not exists idx_pal_from on public.project_artifact_links(from_type, from_id);
create index if not exists idx_pal_to on public.project_artifact_links(to_type, to_id);

-- RLS: mirror project_artifacts (owner via projects.created_by, admin bypass).
alter table public.project_artifact_links enable row level security;

create policy "Admins can manage all artifact links"
  on public.project_artifact_links
  using (is_admin())
  with check (is_admin());

create policy "Users can view their project artifact links"
  on public.project_artifact_links
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_artifact_links.project_id
        and p.created_by = auth.uid()
    )
  );

create policy "Users can create artifact links in their projects"
  on public.project_artifact_links
  for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_artifact_links.project_id
        and p.created_by = auth.uid()
    )
  );

create policy "Users can delete their project artifact links"
  on public.project_artifact_links
  for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_artifact_links.project_id
        and p.created_by = auth.uid()
    )
  );
