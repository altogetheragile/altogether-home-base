-- A reading list: books, grouped by category, each with a link to Amazon.
--
-- The public page at /resources/reading-list reads the first two tables. The internal notes, what
-- format a book is owned in and where it was found, are in a third table that only an admin can
-- read. They are not columns on reading_books because row level security decides which ROWS a
-- reader sees, not which columns: anyone could ask the API for owned_format on a visible book, and
-- the page not asking for it would protect nothing.
--
-- Switched by site_settings.show_reading_list, off unless a site turns it on. The Amazon
-- Associates tag is a setting too, so a link is never built with somebody else's tag in it.

create table public.reading_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reading_books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (trim(title) <> ''),
  author text not null default '',
  -- Restrict, so a category cannot be deleted out from under its books. Admin offers to move
  -- them first; this is what holds if it does not.
  category_id uuid not null references public.reading_categories(id) on delete restrict,
  asin text check (asin ~ '^[A-Z0-9]{10}$'),
  -- A full product link, used instead of the ASIN when set. The tag is put on it when the link
  -- is built, never stored here.
  amazon_url text check (amazon_url is null or amazon_url ~* '^https://([a-z0-9-]+\.)*amazon\.[a-z.]+/'),
  blurb text,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- What a CSV import matches on, so importing the same file twice updates rather than duplicates.
create unique index reading_books_title_author
  on public.reading_books (lower(trim(title)), lower(trim(author)));
create index reading_books_category on public.reading_books (category_id, sort_order);

create table public.reading_book_notes (
  book_id uuid primary key references public.reading_books(id) on delete cascade,
  -- The CSV's "Owned": Kindle, Audible, Kindle + Audible, Not found.
  owned_format text,
  -- The CSV's "Agile Centre List".
  source_note text,
  updated_at timestamptz not null default now()
);

create trigger reading_categories_updated_at before update on public.reading_categories
  for each row execute function public.update_updated_at_column();
create trigger reading_books_updated_at before update on public.reading_books
  for each row execute function public.update_updated_at_column();
create trigger reading_book_notes_updated_at before update on public.reading_book_notes
  for each row execute function public.update_updated_at_column();

alter table public.site_settings
  add column if not exists show_reading_list boolean,
  add column if not exists amazon_associate_tag text;

-- ── Who sees what ────────────────────────────────────────────────────────────────────────────────

alter table public.reading_categories enable row level security;
alter table public.reading_books enable row level security;
alter table public.reading_book_notes enable row level security;

create policy "Visible reading categories are public" on public.reading_categories
  for select using (is_visible);

-- A book is public only when it AND its category are visible. Hiding a category hides its books
-- here, in the database, rather than trusting every page that lists them to remember.
create policy "Visible books in visible categories are public" on public.reading_books
  for select using (
    is_visible and exists (
      select 1 from public.reading_categories c where c.id = category_id and c.is_visible
    )
  );

create policy "Admins manage reading categories" on public.reading_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage reading books" on public.reading_books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- No public policy at all: nobody but an admin reads these.
create policy "Admins manage reading notes" on public.reading_book_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A new table gets no grants by default since 30 October 2026. The grant opens the door to the
-- API; the policies above still decide who gets through it.
grant select on public.reading_categories to anon;
grant select on public.reading_books to anon;
grant select, insert, update, delete on public.reading_categories to authenticated, service_role;
grant select, insert, update, delete on public.reading_books to authenticated, service_role;
grant select, insert, update, delete on public.reading_book_notes to authenticated, service_role;
