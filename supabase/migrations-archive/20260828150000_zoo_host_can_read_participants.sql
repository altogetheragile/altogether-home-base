-- The host still could not create their own participant row, and the security-definer
-- helper in the previous migration was not the reason. The insert's WITH CHECK passed all
-- along: is_zoo_session_host returns true and user_id = auth.uid() holds.
--
-- The refusal came from the SELECT policy, not the INSERT one. PostgREST inserts with
-- RETURNING, and under RLS an INSERT ... RETURNING also requires the new row to be visible
-- through the table's SELECT policies - otherwise it raises 42501 with the same "new row
-- violates row-level security policy" message an INSERT check failure gives, which is what
-- made this look like an insert problem for two attempts.
--
-- Reading participants required membership, and the host is not a member until the very row
-- they are inserting exists. The first participant row of every session was unwritable.
--
-- So the host may read the participants of a session they host, membership or not. Nobody
-- else gains anything: a non-member is neither a member nor the host.

drop policy if exists "Members read the participants" on public.zoo_session_participants;
create policy "Members read the participants" on public.zoo_session_participants
  for select using (
    public.is_zoo_session_member(session_id)
    or public.is_zoo_session_host(session_id)
  );
