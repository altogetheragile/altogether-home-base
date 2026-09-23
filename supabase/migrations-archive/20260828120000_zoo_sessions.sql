-- Build A Zoo, played together. See docs/ZOO_MULTIPLAYER_PLAN.md.
--
-- Four tables, because a training session is not one run of the game:
--
--   zoo_sessions              persists over days, holds the join code and the people
--   zoo_session_participants  the people, for the whole session
--   zoo_games                 ONE run toward one Product Goal; a session has several
--   zoo_game_seats            who sat where, for ONE game
--
-- Seats belong to the GAME, not the session, which is what makes rotation between games
-- fall out for free rather than needing an operation of its own.
--
-- Postgres is the authority and the browser is a cache: a session outlives every tab, so
-- the truth cannot live in one. `zoo_games.version` carries optimistic concurrency - a
-- writer updates WHERE version = the value it read, and a zero-row result means somebody
-- got there first, so re-read and re-apply. Realtime only says "there is a new version".

-- ============ sessions ============

create table if not exists public.zoo_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Ownership, not authority: the host may invite and hand the session on, but facilitating
  -- is a separate grant (see participants.can_facilitate) so an elected learner host cannot
  -- inject an impediment into their own team's Sprint.
  host_user_id uuid not null references auth.users(id) on delete cascade,
  -- A trainer's session hangs off a course; a group of teammates' session hangs off nothing.
  event_id uuid references public.events(id) on delete set null,
  -- Short and readable aloud, so a trainer can read it to a room.
  join_code text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'live', 'paused', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ participants: the people ============

create table if not exists public.zoo_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.zoo_sessions(id) on delete cascade,
  -- A participant is always a person. AI is not a participant; it occupies a seat with no
  -- participant behind it (see zoo_game_seats.is_ai).
  user_id uuid not null references auth.users(id) on delete cascade,
  -- What you may do IN the game. An observer holds no seat and acts on nothing.
  role text not null default 'player' check (role in ('player', 'observer')),
  -- Whether you may act ON the session rather than in it: pause, inject, rewind, look
  -- across teams. This is what a trainer has. Orthogonal to role, so a trainer can take
  -- the Product Owner seat without a special case.
  can_facilitate boolean not null default false,
  display_name text not null,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists idx_zoo_participants_session
  on public.zoo_session_participants(session_id);

-- ============ games: one run toward one Product Goal ============

create table if not exists public.zoo_games (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.zoo_sessions(id) on delete cascade,
  seq int not null,
  -- The seam for a resort or a city later. The item ontology is already generic; only the
  -- words are zoo. Free to carry now, awkward to add once games exist.
  theme text not null default 'zoo',
  seed bigint not null,
  -- The whole game, the same serialisable ZooGameState the single-player saves use.
  state jsonb not null,
  -- Optimistic concurrency. Bumped on every accepted write.
  version int not null default 0,
  status text not null default 'live' check (status in ('live', 'paused', 'done')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (session_id, seq)
);

create index if not exists idx_zoo_games_session
  on public.zoo_games(session_id, seq);

-- ============ seats: who sat where, for ONE game ============

create table if not exists public.zoo_game_seats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.zoo_games(id) on delete cascade,
  seat text not null check (seat in ('product_owner', 'scrum_master', 'developer')),
  -- There is one Product Owner and one Scrum Master; there are several Developers.
  seat_no int not null default 1,
  -- Null and is_ai false is an empty seat waiting in the lobby.
  participant_id uuid references public.zoo_session_participants(id) on delete set null,
  is_ai boolean not null default false,
  claimed_at timestamptz,
  unique (game_id, seat, seat_no),
  -- A seat is a person or an AI, never both.
  constraint zoo_seat_person_or_ai check (not (is_ai and participant_id is not null))
);

-- Nobody holds two seats in the same game.
create unique index if not exists idx_zoo_seat_one_per_participant
  on public.zoo_game_seats(game_id, participant_id)
  where participant_id is not null;

-- ============ membership helpers ============
-- Security definer, because a policy on participants that reads participants recurses.

create or replace function public.is_zoo_session_member(_session_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.zoo_session_participants p
    where p.session_id = _session_id and p.user_id = auth.uid()
  )
$$;

-- Observers may read everything and change nothing, so writes ask this instead.
create or replace function public.can_play_zoo_session(_session_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.zoo_session_participants p
    where p.session_id = _session_id
      and p.user_id = auth.uid()
      and p.role = 'player'
  )
$$;

-- ============ RLS ============

alter table public.zoo_sessions enable row level security;
alter table public.zoo_session_participants enable row level security;
alter table public.zoo_games enable row level security;
alter table public.zoo_game_seats enable row level security;

-- Sessions: members read; the host owns. Joining by code does not go through here - a
-- non-member cannot see the row yet - it goes through join_zoo_session below.
create policy "Members read their sessions" on public.zoo_sessions
  for select using (public.is_zoo_session_member(id) or host_user_id = auth.uid());
create policy "A host creates a session" on public.zoo_sessions
  for insert with check (host_user_id = auth.uid());
create policy "The host updates the session" on public.zoo_sessions
  for update using (host_user_id = auth.uid()) with check (host_user_id = auth.uid());
create policy "The host deletes the session" on public.zoo_sessions
  for delete using (host_user_id = auth.uid());

-- Participants: everyone in a session can see who else is in it.
create policy "Members read the participants" on public.zoo_session_participants
  for select using (public.is_zoo_session_member(session_id));
-- The host creates their own participant row when they open the session. Everyone else
-- arrives through join_zoo_session, so knowing a session id is not a way in.
create policy "The host joins their own session" on public.zoo_session_participants
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.zoo_sessions s
                 where s.id = session_id and s.host_user_id = auth.uid()));
create policy "You update your own participation" on public.zoo_session_participants
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Ownership may delegate: the host grants can_facilitate, typically to a trainer. The host
-- does not hold it by default - that is the difference between owning and facilitating.
create policy "The host manages participants" on public.zoo_session_participants
  for update using (exists (select 1 from public.zoo_sessions s
                             where s.id = session_id and s.host_user_id = auth.uid()));
create policy "You can leave" on public.zoo_session_participants
  for delete using (user_id = auth.uid());

-- Games: members read, players write. An observer is a member and not a player, which is
-- exactly the trainer watching a team they are not seated in.
create policy "Members read the games" on public.zoo_games
  for select using (public.is_zoo_session_member(session_id));
create policy "Players write the game" on public.zoo_games
  for update using (public.can_play_zoo_session(session_id))
  with check (public.can_play_zoo_session(session_id));
create policy "Players start a game" on public.zoo_games
  for insert with check (public.can_play_zoo_session(session_id));

-- Seats: read within the session, claimed by players.
create policy "Members read the seats" on public.zoo_game_seats
  for select using (exists (
    select 1 from public.zoo_games g
    where g.id = game_id and public.is_zoo_session_member(g.session_id)));
create policy "Players manage seats" on public.zoo_game_seats
  for all using (exists (
    select 1 from public.zoo_games g
    where g.id = game_id and public.can_play_zoo_session(g.session_id)))
  with check (exists (
    select 1 from public.zoo_games g
    where g.id = game_id and public.can_play_zoo_session(g.session_id)));

-- ============ joining by code ============
-- A joiner cannot select the session yet, so RLS cannot let them in. This does the lookup
-- and the insert under definer rights, and returns the session it joined.

create or replace function public.join_zoo_session(_join_code text, _display_name text)
returns uuid
language plpgsql volatile security definer
set search_path = public
as $$
declare
  _session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to join a session';
  end if;

  select id into _session_id from public.zoo_sessions
   where upper(join_code) = upper(_join_code) and status <> 'done';
  if _session_id is null then
    raise exception 'no open session with that code';
  end if;

  insert into public.zoo_session_participants (session_id, user_id, display_name)
  values (_session_id, auth.uid(), _display_name)
  on conflict (session_id, user_id)
    do update set last_seen_at = now(), display_name = excluded.display_name;

  return _session_id;
end;
$$;

-- Without this, "you update your own participation" is a permission escalation: a player
-- could grant themselves can_facilitate and start injecting impediments into their own
-- Sprint. RLS cannot scope an UPDATE to particular columns, so a trigger does it.
create or replace function public.zoo_guard_participant_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if (new.can_facilitate is distinct from old.can_facilitate
      or new.role is distinct from old.role)
     and not exists (select 1 from public.zoo_sessions s
                      where s.id = new.session_id and s.host_user_id = auth.uid())
  then
    raise exception 'only the host may change a participant''s role or facilitator grant';
  end if;
  return new;
end;
$$;

create trigger zoo_guard_participant_update
  before update on public.zoo_session_participants
  for each row execute function public.zoo_guard_participant_update();

-- ============ housekeeping ============

create trigger update_zoo_sessions_updated_at
  before update on public.zoo_sessions
  for each row execute function public.update_updated_at_column();

-- Realtime carries "there is a new version" and the client re-reads the row it is allowed
-- to see. Nothing to configure: this project's supabase_realtime publication is FOR ALL
-- TABLES, so these are already published and adding them explicitly is rejected.
