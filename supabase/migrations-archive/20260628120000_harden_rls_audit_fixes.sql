-- ============================================================================
-- RLS hardening: fix the exposures found in the Phase 0 security audit (28 Jun
-- 2026). Three confirmed anon-readable leaks plus over-permissive write policies.
--
-- Verified live with the public anon key:
--   * course_feedback   - 81 rows readable by anyone (PII: names + comments).
--                         A policy named "approved" used USING (true).
--   * ai_rate_limits    - 11 rows readable by anyone (internal table).
--   * epics / user_stories / features - readable by anyone, and any authenticated
--                         user could read/write ALL rows (blanket USING (true)).
--   * backlog_items     - any authenticated user could read/write another user's
--                         backlog (red-team finding; see 20260613130000).
--
-- Strategy: for each table, drop EVERY existing policy (years of accumulated,
-- conflicting ones) and recreate a clean, minimal, owner/role-scoped set. Service
-- role and SECURITY DEFINER functions bypass RLS and are unaffected, so the
-- rate-limit function and prerender/build scripts keep working.
-- ============================================================================

-- Helper: drop all policies on a public table by name.
create or replace function public._drop_all_policies(tbl text)
returns void language plpgsql as $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = tbl loop
    execute format('drop policy if exists %I on public.%I', r.policyname, tbl);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- course_feedback: the public sees APPROVED feedback only; users submit their
-- own; admins manage everything (including approving).
-- ---------------------------------------------------------------------------
select public._drop_all_policies('course_feedback');
alter table public.course_feedback enable row level security;

create policy "Public can view approved feedback" on public.course_feedback
  for select using (is_approved = true);

create policy "Users submit own feedback" on public.course_feedback
  for insert to authenticated with check (auth.uid() = created_by);

create policy "Admins manage feedback" on public.course_feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ai_rate_limits: internal. Written only by a SECURITY DEFINER function and the
-- service role, both of which bypass RLS. No public or authenticated access;
-- admins may read for support.
-- ---------------------------------------------------------------------------
select public._drop_all_policies('ai_rate_limits');
alter table public.ai_rate_limits enable row level security;

create policy "Admins view rate limits" on public.ai_rate_limits
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- epics / user_stories / features: private to the owner of the parent project
-- (or the row's creator), with admins able to manage all. Each table has both
-- project_id (-> projects.created_by) and created_by.
-- ---------------------------------------------------------------------------
select public._drop_all_policies('epics');
alter table public.epics enable row level security;
create policy "Owners manage epics" on public.epics
  for all to authenticated
  using (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = epics.project_id and p.created_by = auth.uid()))
  )
  with check (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = epics.project_id and p.created_by = auth.uid()))
  );
create policy "Admins manage epics" on public.epics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

select public._drop_all_policies('features');
alter table public.features enable row level security;
create policy "Owners manage features" on public.features
  for all to authenticated
  using (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = features.project_id and p.created_by = auth.uid()))
  )
  with check (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = features.project_id and p.created_by = auth.uid()))
  );
create policy "Admins manage features" on public.features
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

select public._drop_all_policies('user_stories');
alter table public.user_stories enable row level security;
create policy "Owners manage user_stories" on public.user_stories
  for all to authenticated
  using (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = user_stories.project_id and p.created_by = auth.uid()))
  )
  with check (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = user_stories.project_id and p.created_by = auth.uid()))
  );
create policy "Admins manage user_stories" on public.user_stories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- backlog_items: owner via project OR product (supersedes 20260613130000), with
-- admins able to manage all.
-- ---------------------------------------------------------------------------
select public._drop_all_policies('backlog_items');
alter table public.backlog_items enable row level security;
create policy "Owners manage backlog_items" on public.backlog_items
  for all to authenticated
  using (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = backlog_items.project_id and p.created_by = auth.uid()))
    or (product_id is not null and exists (
      select 1 from public.products pr where pr.id = backlog_items.product_id and pr.created_by = auth.uid()))
  )
  with check (
    created_by = auth.uid()
    or (project_id is not null and exists (
      select 1 from public.projects p where p.id = backlog_items.project_id and p.created_by = auth.uid()))
    or (product_id is not null and exists (
      select 1 from public.products pr where pr.id = backlog_items.product_id and pr.created_by = auth.uid()))
  );
create policy "Admins manage backlog_items" on public.backlog_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop function if exists public._drop_all_policies(text);
