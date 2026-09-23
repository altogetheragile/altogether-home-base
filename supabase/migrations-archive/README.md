# Archived Migrations

These 232 files are the history up to 23 September 2026. They are kept for reading, not for
running, and the CLI does not see them here.

They could never build a database from nothing. The earliest ones alter tables that nothing in
this repository creates, because those tables were made through the Supabase UI before migrations
were tracked. `supabase start` against a clean database failed on the first file:

    Applying migration 20250621215408_...sql
    ERROR: relation "public.events" does not exist (SQLSTATE 42P01)

Ten tables were in that state, including events, profiles, contacts and knowledge_items. The
schema they describe is now in `supabase/migrations/00000000000000_baseline.sql`, dumped from
production, which does build from nothing and is tested in CI.

Write new migrations in `supabase/migrations/` as usual. Nothing needs to be moved back.
