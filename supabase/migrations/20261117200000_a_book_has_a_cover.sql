-- A book on the reading list can have a cover.
--
-- The picture lives in this project's own storage (the assets bucket, under reading-covers/), never
-- hotlinked from anywhere else: either fetched once from Open Library by
-- scripts/fetch-reading-covers.mjs, or uploaded in Admin. Empty means the tile shows no picture,
-- which is how every book looked before this.
--
-- Where it came from is kept, so the fetch script never replaces a cover somebody chose by hand.

alter table public.reading_books
  add column if not exists cover_url text
    check (cover_url is null or cover_url ~ '^https://'),
  add column if not exists cover_source text
    check (cover_source is null or cover_source in ('openlibrary', 'upload'));
