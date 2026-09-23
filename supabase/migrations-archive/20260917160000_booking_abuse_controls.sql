-- Abuse controls for the public booking endpoint.
--
-- booking-create is unauthenticated and, for each call, writes to a calendar,
-- creates a Zoom meeting and sends mail from the Resend domain. Without a limit
-- a bot can fill the diary and use the endpoint to relay mail to any address it
-- likes. The existing check_ai_rate_limit RPC is per signed-in user, so it does
-- not help here; this is the anonymous equivalent.

create table booking_attempts (
  id         uuid primary key default gen_random_uuid(),
  -- SHA-256 of the caller's IP, never the address itself. Enough to count
  -- repeats without keeping a log of who visited the booking page.
  ip_hash    text,
  email      text,
  -- 'ok' when a booking was made, 'blocked' when a guard turned it away. Both
  -- count towards the per-IP limit so probing is not free.
  outcome    text not null default 'ok',
  created_at timestamptz not null default now()
);

create index booking_attempts_ip_idx    on booking_attempts (ip_hash, created_at desc);
create index booking_attempts_email_idx on booking_attempts (lower(email), created_at desc);

alter table booking_attempts enable row level security;

-- No policies at all: only the service role inside the edge function touches
-- this, and RLS with no policy denies everyone else. Admins do not need to read
-- it, and it holds enough to be worth not exposing.

-- Housekeeping. Nothing here matters after a day, and an unbounded log of
-- attempts is a liability rather than an asset.
create or replace function prune_booking_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from booking_attempts where created_at < now() - interval '2 days';
$$;

-- Revoking from PUBLIC is enough and is portable: EXECUTE on a new function is
-- granted to PUBLIC by default, and anon and authenticated inherit that rather
-- than holding a grant of their own. Naming those roles explicitly would also
-- break this file anywhere they do not exist.
revoke all on function prune_booking_attempts() from public;
