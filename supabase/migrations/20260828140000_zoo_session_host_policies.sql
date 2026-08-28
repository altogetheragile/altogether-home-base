-- The host could not create their own participant row: the insert was refused with 42501.
--
-- Both policies added for the host used a cross-table subquery inside the policy body,
-- unlike the read and write policies, which go through security-definer helpers. A policy
-- on one table that reads another is evaluated under the querying user's rights and the
-- other table's RLS, which is exactly the trap is_zoo_session_member was written to avoid.
-- So do the same thing here, rather than a different thing that happens to be shorter.

create or replace function public.is_zoo_session_host(_session_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.zoo_sessions s
    where s.id = _session_id and s.host_user_id = auth.uid()
  )
$$;

drop policy if exists "The host joins their own session" on public.zoo_session_participants;
create policy "The host joins their own session" on public.zoo_session_participants
  for insert with check (user_id = auth.uid() and public.is_zoo_session_host(session_id));

drop policy if exists "The host manages participants" on public.zoo_session_participants;
create policy "The host manages participants" on public.zoo_session_participants
  for update using (public.is_zoo_session_host(session_id));

-- The guard trigger had the same shape, so it would have refused the host their own grant.
create or replace function public.zoo_guard_participant_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if (new.can_facilitate is distinct from old.can_facilitate
      or new.role is distinct from old.role)
     and not public.is_zoo_session_host(new.session_id)
  then
    raise exception 'only the host may change a participant''s role or facilitator grant';
  end if;
  return new;
end;
$$;
