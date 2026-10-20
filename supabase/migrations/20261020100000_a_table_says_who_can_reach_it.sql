-- Who may reach a table through the API, said out loud.
--
-- Until 30 October 2026 Supabase granted the API roles access to every new table in public by
-- default, so no migration here ever wrote a grant: the baseline carries the ones production had
-- when it was dumped, and the two tables added since leaned on the default. From that date a new
-- table gets nothing, and supabase-js answers "permission denied" until a grant says otherwise.
--
-- Production is unaffected: these two tables were created before the change and already have
-- their grants, so this is a no-op there. It is for every database built from nothing - CI, a
-- reset, a new site - which would otherwise depend on a default that is going away.
--
-- Both tables are admin-only under row level security, so anon gets nothing. The grant opens the
-- door to the API; the policies still decide who gets through it.
--
-- From here on, a migration that creates a table grants on it in the same file. The Schema job
-- fails on a public table that authenticated cannot reach.

grant select, insert, update, delete on public.site_copy_revisions to authenticated;
grant select, insert, update, delete on public.site_copy_revisions to service_role;

grant select, insert, update, delete on public.site_copy_drafts to authenticated;
grant select, insert, update, delete on public.site_copy_drafts to service_role;
