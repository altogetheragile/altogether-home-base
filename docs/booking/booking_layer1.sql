-- Booking tool, Layer 1
-- Revision 2: Zoom replaces Google Meet for conferencing.
--
-- DRAFT. Not yet a migration. When the open questions in booking-tool-spec.md
-- are settled, copy this to:
--   supabase/migrations/20260917100000_booking_layer1.sql
-- Check the seeded working hours at the bottom BEFORE running it.
--
-- Assumes is_admin() already exists (it does, June 2025 migrations).

-- Needed for the overlap exclusion constraint on bookings (gist over a scalar
-- column alongside a range).
create extension if not exists btree_gist;

create type booking_status as enum ('pending', 'confirmed', 'cancelled');

create table booking_types (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  description        text,
  duration_minutes   int  not null check (duration_minutes > 0),
  buffer_before      int  not null default 0,
  buffer_after       int  not null default 15,
  min_notice_minutes int  not null default 1440,   -- 24 hours
  max_days_ahead     int  not null default 30,
  price_pence        int  not null default 0,      -- Layer 3
  video_provider     text not null default 'zoom',
  -- The zone the weekly windows below are written in. Hardcoding this in the
  -- edge functions instead would cost a migration the first time it changes.
  timezone           text not null default 'Europe/London',
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- Weekly windows, local time in the booking type's timezone
create table booking_availability (
  id               uuid primary key default gen_random_uuid(),
  booking_type_id  uuid not null references booking_types(id) on delete cascade,
  weekday          int  not null check (weekday between 0 and 6), -- 0 = Sunday
  start_local      time not null,
  end_local        time not null,
  check (end_local > start_local)
);

create index booking_availability_type_idx
  on booking_availability (booking_type_id, weekday);

-- Date-level exceptions. No row for a date means "use weekly rules".
-- closed = true blocks the whole day. Otherwise the window replaces the weekly
-- rule, so exactly one row per type per date.
create table booking_overrides (
  id               uuid primary key default gen_random_uuid(),
  booking_type_id  uuid not null references booking_types(id) on delete cascade,
  on_date          date not null,
  closed           boolean not null default true,
  start_local      time,
  end_local        time,
  note             text,
  unique (booking_type_id, on_date),
  -- An open override must carry a usable window; a closed one must not.
  check (
    (closed and start_local is null and end_local is null)
    or (not closed and start_local is not null and end_local is not null
        and end_local > start_local)
  )
);

create table bookings (
  id                uuid primary key default gen_random_uuid(),
  booking_type_id   uuid not null references booking_types(id),
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,

  -- The real blocking window: the meeting plus its buffers. Written by
  -- booking-create as (starts_at - buffer_before, ends_at + buffer_after) from
  -- the booking type. It exists as stored columns rather than a generated one
  -- because the buffers live on booking_types and a generated column cannot
  -- reach another table. The overlap constraint below ranges over THIS, not over
  -- the meeting itself, so the database enforces buffers rather than trusting
  -- the edge function to have checked them.
  blocks_from       timestamptz not null,
  blocks_until      timestamptz not null,
  guest_name        text not null,
  guest_email       text not null,
  guest_timezone    text not null,
  notes             text,
  status            booking_status not null default 'pending',
  manage_token      uuid not null default gen_random_uuid(), -- Layer 2 links

  -- Conferencing. Provider-neutral names: Layer 3 or a future client may want
  -- something other than Zoom, and a column called meet_url holding a Zoom link
  -- is the kind of thing nobody fixes for three years.
  -- meeting_id is Zoom's numeric meeting id, needed to cancel the meeting and
  -- to make a retry after a partial failure reuse it instead of creating a
  -- second one. It is written BEFORE the calendar call for exactly that reason.
  --
  -- Zoom's start_url is deliberately NOT stored. It embeds a host token, so
  -- anyone holding it can start the meeting as Al, and it expires in about two
  -- hours anyway. Al starts the meeting from his own calendar or Zoom client.
  meeting_id        text,
  meeting_url       text,
  meeting_passcode  text,

  calendar_event_id text,
  payment_ref       text,                                   -- Layer 3
  user_id           uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  cancelled_at      timestamptz,
  check (ends_at > starts_at),
  check (blocks_from <= starts_at and blocks_until >= ends_at)
);

-- Double-booking guard.
--
-- The obvious index is not enough:
--     create unique index bookings_one_per_slot
--       on bookings (booking_type_id, starts_at) where status <> 'cancelled';
-- That stops two bookings at the SAME instant but not two that overlap.
--
-- Ranging over (starts_at, ends_at) is also not enough. buffer_after defaults to
-- 15 minutes, so a 30-minute session at 10:00 really blocks until 10:45 - but
-- 10:00-10:30 and 10:30-11:00 do not overlap, so the constraint would allow a
-- booking that eats the buffer. Two concurrent requests for 10:00 and 10:30 both
-- pass the edge function's read-side buffer check and both commit.
--
-- Ranging over the buffered window closes that. Verified against Postgres 16:
-- a 10:30 start is rejected against a 10:00-10:45 blocking window, and a 10:45
-- start is accepted.
--
-- Open question 6 in the spec: this is scoped to booking_type_id. That is right
-- for Layer 1's single type and wrong from Layer 3, when two types could
-- double-book one person. Drop the booking_type_id term to scope it to the whole
-- diary instead.
alter table bookings add constraint bookings_no_overlap
  exclude using gist (
    booking_type_id with =,
    tstzrange(blocks_from, blocks_until) with &&
  ) where (status <> 'cancelled');

create index bookings_starts_at_idx on bookings (starts_at);
create index bookings_manage_token_idx on bookings (manage_token); -- Layer 2

-- RLS
alter table booking_types        enable row level security;
alter table booking_availability enable row level security;
alter table booking_overrides    enable row level security;
alter table bookings             enable row level security;

-- Public can read active types (needed for the booking page)
create policy "public read active booking types"
  on booking_types for select using (active);

-- Availability and overrides are read server-side only; admins manage them
create policy "admin manage booking types"
  on booking_types for all using (is_admin()) with check (is_admin());
create policy "admin manage availability"
  on booking_availability for all using (is_admin()) with check (is_admin());
create policy "admin manage overrides"
  on booking_overrides for all using (is_admin()) with check (is_admin());

-- Bookings: admins see all; a logged-in guest sees their own; inserts go via the
-- edge function (service role, which bypasses RLS)
create policy "admin manage bookings"
  on bookings for all using (is_admin()) with check (is_admin());
create policy "guest reads own bookings"
  on bookings for select using (auth.uid() = user_id);

-- Navigation toggle, following the existing show_* convention on site_settings
-- (show_flow_game, show_exams). Also add it to the SiteSettings type in
-- src/hooks/useSiteSettings.ts and to FLAG_DEFAULTS in
-- src/components/Navigation.tsx.
alter table site_settings add column if not exists show_bookings boolean default false;

-- Seed: chemistry session, Mon to Fri 09:00 to 17:00 (CHANGE BEFORE RUNNING)
insert into booking_types (slug, name, description, duration_minutes)
values ('chemistry-session', 'Chemistry Session',
        'A free 30-minute conversation. No agenda, no commitment.', 30);

insert into booking_availability (booking_type_id, weekday, start_local, end_local)
select id, d, '09:00', '17:00'
from booking_types, generate_series(1, 5) as d
where slug = 'chemistry-session';
