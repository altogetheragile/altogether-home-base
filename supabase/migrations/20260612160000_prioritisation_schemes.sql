-- Prioritisation Schemes (VISION_TO_VALUE.md 6.14).
-- Per-journey scheme setting on the project (nullable: the app computes the
-- default from projects.kind, project -> moscow, otherwise simple), and a jsonb
-- bag on backlog items for scheme-specific scores (WSJF's four numbers), so we do
-- not add a column per scheme.

alter table public.projects
  add column if not exists prioritisation_scheme text;

alter table public.backlog_items
  add column if not exists priority_data jsonb not null default '{}'::jsonb;
