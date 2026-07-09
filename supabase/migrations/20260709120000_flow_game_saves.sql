-- Flow Game saves: let a signed-in player save a game in progress and resume it
-- later from any device. The whole game is a single serialisable object, stored
-- as jsonb in `state`; phase/round/day are denormalised for the saved-games list.
-- Private, single-player data - RLS scopes every row to its owner.

create table if not exists public.flow_game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  state jsonb not null,
  -- Denormalised from state for the list view ("Round 2, Day 9") without parsing jsonb.
  phase text,
  round_number int,
  day int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flow_game_saves_user
  on public.flow_game_saves(user_id, updated_at desc);

alter table public.flow_game_saves enable row level security;

-- Owner-only: a private save has no sharing, so one FOR ALL policy covers
-- select / insert / update / delete.
create policy "Users manage their own flow game saves"
  on public.flow_game_saves
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger update_flow_game_saves_updated_at
  before update on public.flow_game_saves
  for each row execute function public.update_updated_at_column();
