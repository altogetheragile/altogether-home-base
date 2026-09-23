-- A player may manage their OWN seat, not anybody else's.
--
-- "Players manage seats" was `for all` scoped to `can_play_zoo_session`: any player in the session
-- could vacate, claim or hand to AI any seat in it, including one somebody else was sitting in. The
-- client stopped doing it - `leaveSeat` and `fillWithAi` both refuse a seat held by another player
-- unless the caller is hosting - but a policy the client politely declines to exercise is still a
-- policy, and the review asked for two layers rather than one.
--
-- What a player may write:
--   * an EMPTY seat, or one the AI is covering - claiming it
--   * a seat they are sitting in - leaving it, or handing it to the AI
-- What the host may write: any seat in their own session. Running the table is the host's job and it
-- includes standing somebody up who has walked away from it.

-- Which participant row the caller is, in this session. A security-definer helper for the same
-- reason `can_play_zoo_session` is one: a policy on one table that reads another is evaluated under
-- the querying user's rights and the other table's RLS, which is the trap those helpers exist to
-- avoid. Learned here once already - see 20260828140000.
create or replace function public.my_zoo_participant_id(_session_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select p.id from public.zoo_session_participants p
  where p.session_id = _session_id and p.user_id = auth.uid()
  limit 1
$$;

drop policy if exists "Players manage seats" on public.zoo_game_seats;

create policy "Players manage their own seat" on public.zoo_game_seats
  for all using (exists (
    select 1 from public.zoo_games g
    where g.id = game_id
      and public.can_play_zoo_session(g.session_id)
      and (
        -- Their own seat, or one nobody is sitting in.
        participant_id is null
        or participant_id = public.my_zoo_participant_id(g.session_id)
        or public.is_zoo_session_host(g.session_id)
      )))
  with check (exists (
    select 1 from public.zoo_games g
    where g.id = game_id
      and public.can_play_zoo_session(g.session_id)
      and (
        participant_id is null
        or participant_id = public.my_zoo_participant_id(g.session_id)
        or public.is_zoo_session_host(g.session_id)
      )));
