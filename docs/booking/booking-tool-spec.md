# Booking Tool: Layer 1 Brief For Claude Code

Date: 17 September 2026
Owner: Alun Davies-Baker
Status: Draft for build
Revision: 2 - Zoom replaces Google Meet for conferencing; repo facts corrected

## Goal

Replace the Calendly link with a booking flow that lives on altogetheragile.com.
Layer 1 covers free one-to-one bookings only. Paid sessions, reminders and
reschedule links come in later layers.

Definition of done for Layer 1: a visitor books a 30-minute chemistry session
from the Coaching page, the event appears in Al's Google Calendar with a Zoom
join link, both parties get a confirmation email, and Al sees the booking in the
admin. Then Calendly can be cancelled.

## Conferencing: Zoom, Not Google Meet

Zoom hosts the meeting. Google Calendar still holds the diary.

Those are two separate jobs and only one of them changes:

- **Google Calendar** stays for the free/busy query and for the calendar event
  with the guest as an attendee. Al's diary is Google. That does not move.
- **Zoom** creates the meeting and supplies the join link. That link goes into
  the calendar event's `location` and description, and into the guest email.

This also matches the rest of the site. Events already store a Zoom link by hand
in `meeting_link` (see the placeholder in
`src/components/admin/events/EventFormFields.tsx:315`). Nothing in the repo talks
to the Zoom API yet, so this is the first automated use of it.

## Must Fix Before Build

These came out of reading the brief against the current repo. They are not Zoom
changes; they are corrections. Settle them before anyone writes code.

1. **The Coaching page is not in this app.** See "Coaching Page Change" below.
   The original brief's "change one constant" plan does not work in production.
2. **`booking-create` is a public, unauthenticated endpoint that writes to Al's
   calendar, creates Zoom meetings and sends mail from Al's Resend domain.** It
   needs abuse controls before go-live. See "Abuse Controls".
3. **The double-booking guard only catches identical start times**, and the
   obvious fix still misses back-to-back bookings that eat the buffer. See
   "Rules" under Data Model.
4. **The nav toggle needs a database column.** See "Feature Flag".

## What Exists Already

Repo: `altogetheragile/altogether-home-base` (current as of PR #644). Read
`CLAUDE.md` first. Reuse, do not rebuild:

- `supabase/functions/seo-search-console` authenticates to Google with a refresh
  token. Copy that pattern. Its secrets are named `GSC_CLIENT_ID`,
  `GSC_CLIENT_SECRET` and `GSC_REFRESH_TOKEN`; the booking functions get their
  own `BOOKING_GOOGLE_REFRESH_TOKEN` but reuse the same OAuth client.
- `supabase/functions/send-contact-email` sends through Resend
  (`RESEND_API_KEY`), and carries spam detection and HTML escaping worth copying.
- `supabase/functions/create-checkout` and `verify-payment` already do Stripe
  Checkout. Layer 3 plugs into these.
- `is_admin()` exists (migrations from June 2025). Use it in RLS.
- Admin shell: `src/components/admin/AdminLayout.tsx` holds the sidebar. Add
  Bookings under the existing Training group.
- Site Settings toggles features with boolean columns on `site_settings`
  (`show_flow_game`, `show_exams`), read through `src/hooks/useSiteSettings.ts`
  and consumed in `src/components/Navigation.tsx`.
- `react-day-picker` (^9.8.0) and `date-fns` (^4.1.0) are already dependencies.
- Migrations are timestamped `YYYYMMDDHHMMSS_name.sql` in `supabase/migrations/`.

Note: `supabase/config.toml` says `project_id = "tdfbqmjmrqcovwnptiux"`, while
`CLAUDE.md`, the CSP in `vercel.json` and the deploy commands all say
`wqaplkypnetifpqrungv`. Reconcile that before anyone runs a deploy.

## Scope Of Layer 1

In:

- One booking type, seeded: Chemistry Session, 30 minutes, free, Zoom.
- Weekly availability rules and date overrides, editable in admin.
- Public page `/book/:slug` showing free slots in the visitor's time zone.
- Google Calendar free/busy check across Al's calendars.
- Zoom meeting creation per booking.
- Google Calendar event carrying the Zoom link, with the guest invited.
- Confirmation email to guest and to Al.
- Admin list of bookings with status, Zoom link and calendar link.

Out (later layers):

- Reminders (Layer 2)
- Reschedule and cancel links (Layer 2)
- Stripe payment for paid sessions (Layer 3)
- Group capacity for courses (Layer 4, may never be needed, Events covers it)

## Data Model

See `booking_layer1.sql`. Four tables, all under RLS.

- `booking_types`: what can be booked (name, slug, duration, buffers, notice,
  horizon, price, provider, timezone).
- `booking_availability`: weekly windows per type, in the type's timezone. Seeded
  Mon to Fri, 09:00 to 17:00.
- `booking_overrides`: date-level exceptions (closed days, extra hours).
- `bookings`: the record. Start and end in UTC. Status: `pending`, `confirmed`,
  `cancelled`. A secret `manage_token` for Layer 2 links. Zoom meeting id, join
  URL and passcode, plus the Google calendar event id, stored once created.

Rules:

- **Overlap guard.** The original brief used a unique index on
  `(booking_type_id, starts_at)`. That stops two bookings at the same instant but
  not two that overlap, so use a `tstzrange` exclusion constraint instead.
- **The constraint must range over the buffered window, not the meeting.**
  `buffer_after` defaults to 15 minutes, so a 30-minute session at 10:00 really
  blocks until 10:45. But 10:00-10:30 and 10:30-11:00 do not overlap, so a
  constraint over `(starts_at, ends_at)` still lets a 10:30 booking eat the
  buffer, and two concurrent requests for 10:00 and 10:30 both pass the edge
  function's read-side check and both commit. `booking-create` therefore writes
  `blocks_from` and `blocks_until` (start minus `buffer_before`, end plus
  `buffer_after`) and the constraint ranges over those. The database enforces the
  buffers rather than trusting the function to have checked them.
- **Scope: the whole diary, not one booking type.** There is one of Al, so two
  different types must not land on him at once. This costs nothing while Layer 1
  has a single type and is already right when Layer 3 adds paid sessions.
- All time maths happens server-side in the edge functions. The browser only
  displays.
- Store UTC. Compute availability in the booking type's timezone
  (`Europe/London`). Display in the guest's browser zone.

## Edge Functions

Three new functions in `supabase/functions/`. Add both public ones to
`supabase/config.toml` so their JWT posture is explicit rather than inherited.

### `booking-slots`

GET with `type` (slug), `from`, `to` (ISO dates).

1. Load the booking type, availability and overrides.
2. Build candidate slots from the weekly windows for each date in range, in the
   type's timezone.
3. Drop slots inside `min_notice_minutes` or beyond `max_days_ahead`.
4. Call Google Calendar `freeBusy.query` for the range across the calendar IDs in
   `BOOKING_BUSY_CALENDARS`.
5. Drop slots that overlap busy blocks, allowing for `buffer_before` and
   `buffer_after`.
6. Drop slots that overlap existing non-cancelled rows in `bookings`.
7. Return slots as UTC ISO strings.

Cache nothing. Availability must be live.

### `booking-create`

POST with `type`, `starts_at` (UTC ISO), `name`, `email`, `notes`.

Three external calls now, so order matters:

1. Re-run the slot check for that one slot. Never trust the client's list.
2. Insert the booking as `pending`, computing `blocks_from` and `blocks_until`
   from the type's buffers. If the overlap constraint fails, return 409.
3. Create the Zoom meeting. **Write `meeting_id`, `meeting_url` and
   `meeting_passcode` to the row immediately, before anything else.**
4. Create the Google Calendar event on Al's primary calendar: title
   `Chemistry Session: {name}`, attendee = guest email, `location` = the Zoom
   join URL, description carrying the link and the guest's notes. Pass
   `sendUpdates=all` so the guest actually receives the invite. Write
   `calendar_event_id`.
5. Update the booking to `confirmed`.
6. Send confirmation emails via Resend.
7. If step 3 or 4 fails, leave the row as `pending` and log it. Admin sees it and
   can retry. Do not silently drop it.

Step 3's write is the part that matters. Zoom has no idempotency key on meeting
creation. If Zoom succeeds, Google fails, and someone retries, an unwritten
`meeting_id` means a second Zoom meeting and an orphaned first one. Writing it
first makes the retry safe: a retry that finds `meeting_id` already set reuses
that meeting rather than creating another.

Create a **scheduled meeting per booking**. Do not use Al's Personal Meeting
Room - with back-to-back bookings the 10:30 guest walks in on the 10:00 one. Set
`waiting_room: true` for the same reason.

### Zoom Auth

No new function. Use a **Server-to-Server OAuth** app from the Zoom Marketplace.
No refresh token to mint, no consent screen, no OAuth UI. Three secrets:
`ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.

Exchange them per invocation:

```
POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id={ZOOM_ACCOUNT_ID}
Authorization: Basic base64(ZOOM_CLIENT_ID:ZOOM_CLIENT_SECRET)
```

The token lasts about an hour. Mint one per invocation and move on.

Two things to confirm on the Zoom side before building, because a Marketplace app
needs a Zoom account admin to create it:

- The app needs meeting **write** and **delete** scopes. Zoom moved to granular
  scope names, so read the exact strings off the Marketplace page rather than
  copying an older example.
- The account is paid, so the free tier's 40-minute cap does not apply. Session
  length is a product decision, not a platform limit.

**Never store Zoom's `start_url`.** It carries an embedded host token - anyone
holding it can start the meeting as Al. It also expires in roughly two hours, so
it is useless as a stored value. Al starts the meeting from his own calendar or
Zoom client.

### Google Auth

No new function. Mint a refresh token once for Al's Google account with scopes
`https://www.googleapis.com/auth/calendar.events` and
`https://www.googleapis.com/auth/calendar.readonly`, store it as the Supabase
secret `BOOKING_GOOGLE_REFRESH_TOKEN`, and exchange it for an access token inside
`booking-slots` and `booking-create` exactly as `seo-search-console` does, reusing
`GSC_CLIENT_ID` and `GSC_CLIENT_SECRET`. Calendar IDs that count as busy go in a
`BOOKING_BUSY_CALENDARS` secret (comma-separated) for Layer 1; move them to admin
settings later.

There is no `conferenceData` work. Zoom supplies the link, so the
`conferenceDataVersion=1` and `createRequest` handling the earlier draft called
for is gone.

Use a service-role client inside the functions. The public page calls them with
the anon key only.

## Abuse Controls

`booking-create` is public and unauthenticated. Without controls a bot can fill
the diary, create unlimited Zoom meetings, and relay mail through Al's Resend
domain to any address it likes. `send-contact-email` already carries spam
detection for this reason, and `recommend-pattern` does its own rate limiting.

Minimum before go-live:

- Per-IP and per-email throttle.
- A honeypot field on the form.
- Hold the Zoom meeting and the calendar invite until the guest clicks a
  verification link in their email. If that is too much friction for Layer 1, at
  least cap bookings per email per day.

## Public Page

Route `/book/:slug`. Reuse existing card and button styles.

- Left: booking type name, duration, "Video call via Zoom", short description.
- Middle: month calendar (react-day-picker). Days with no slots are disabled.
- Right: slot list for the chosen day, shown in the visitor's zone with the zone
  named below.
- Form: name, email, "What would you like to talk about?" (optional). One button:
  Confirm booking.
- Success state: date, time in their zone, Zoom join link, "Calendar invite sent
  to {email}".

Mobile: stack the three columns.

No CSP change is needed. The page links out to Zoom; it does not embed it. Do not
embed the Zoom Web SDK.

`/book/:slug` is not in the Next.js cut-over list, so it stays on the Vite SPA.
Add a `/book` entry to `scripts/prerender.mjs`, or decide deliberately to leave it
out of the sitemap. `CLAUDE.md` is clear that `<Helmet>` does not reach crawlers.

## Feature Flag

Follow the existing mechanism: add a `show_bookings boolean` column to
`site_settings` in the migration, add it to the `SiteSettings` type in
`src/hooks/useSiteSettings.ts`, and to `FLAG_DEFAULTS` in
`src/components/Navigation.tsx`.

If `show_bookings` is off, `/book/:slug` 404s and the Coaching page buttons fall
back to the enquiry form anchor.

## Admin

New section: Training > Bookings.

- List: guest, type, start (Europe/London), status, Zoom link, calendar link,
  created.
- Filters: upcoming, past, pending, cancelled.
- Row actions: open in Google Calendar; mark cancelled.
- **Cancelling now deletes two things**: the Zoom meeting
  (`DELETE /v2/meetings/{meeting_id}`) and the calendar event. Then set status to
  `cancelled`. If one of the two fails, say which in the admin and leave the
  other alone. Do not swallow it.
- Retry action for rows stuck at `pending`: reuse `meeting_id` if it is already
  set, otherwise create the Zoom meeting first.
- Settings tab: edit weekly hours and overrides for each booking type. (Google
  and Zoom credentials are secrets in Layer 1.)

Write to the audit log the same way other admin actions do.

## Emails

Two Resend templates, following `send-contact-email` (including its HTML
escaping):

- `booking-confirmation-guest`: what, when (in their zone), the Zoom join link
  and passcode, what happens next.
- `booking-confirmation-owner`: who, when, notes, Zoom link, link to admin.

Because `sendUpdates=all` is set, Google also emails the guest a calendar invite
carrying the same Zoom link. That is deliberate: the invite is what puts the
meeting in their diary, and the Resend mail is the friendly one. Two emails, both
useful. Keep the Resend copy short so it does not read as a duplicate.

## Coaching Page Change

**The Coaching page is not served by this Vite app.** `vercel.json` rewrites
`/coaching` to a separate Next.js app:

```
{ "source": "/coaching", "destination": "https://altogether-home-base-web-next.vercel.app/coaching" }
```

`/`, `/about`, `/contact`, `/events`, `/blog`, `/exams`, `/testimonials` and
`/courses/*` are cut over too. `src/pages/Coaching.tsx` is dead in production.

The live page is `apps/web/src/app/coaching/page.tsx`, and the Next app does not
import the shared flag. It hardcodes its own copy of the Calendly URL in six
files:

- `apps/web/src/app/coaching/page.tsx:11`
- `apps/web/src/app/about/page.tsx:11`
- `apps/web/src/app/contact/page.tsx:8`
- `apps/web/src/app/events/page.tsx:10`
- `apps/web/src/app/page.tsx:17`
- `apps/web/src/components/AboutSection.tsx:4`

So it is seven constants, not one - those six plus `BOOKING_URL` in
`src/config/featureFlags.ts`.

Do this as a Layer 0 step: hoist a single shared constant in `apps/web`, then
change it once.

Two knock-ons:

- Every button is `target="_blank" rel="noopener noreferrer"`. A relative
  `/book/chemistry-session` in those opens a new tab and does a full page load.
  Change the markup, not just the string.
- Cancelling Calendly also means stripping `assets.calendly.com` and
  `*.calendly.com` from the CSP in `vercel.json`, and updating
  `src/pages/Privacy.tsx:62`. Check the Next app's privacy copy too.

Separately, change "doing the ceremonies" to "running the events" in the Team
Coaching section. The **current** text breaks the content rule in `CLAUDE.md`;
the change fixes it. The string appears in `apps/web/src/app/coaching/page.tsx:38`
(the live one) and `src/pages/Coaching.tsx:128`. Check
`apps/web/src/app/events/page.tsx` and `apps/web/src/app/about/page.tsx` as well.

## Testing

- Unit test the slot builder with a fixed clock: a Monday in March, a Sunday in
  October, a bank holiday override, a busy block that cuts a slot in half.
- Two concurrent `booking-create` calls for the same slot: one succeeds, one gets
  409.
- Two concurrent calls for **overlapping** start times (10:00 and 10:15): one
  succeeds, one gets 409. The old unique index missed this.
- Two concurrent calls for **back-to-back** start times (10:00 and 10:30, with a
  15-minute `buffer_after`): one succeeds, one gets 409, because 10:30 sits
  inside the first booking's blocking window. A constraint over the meeting times
  alone would let both through.
- Two **different booking types** at the same time: one succeeds, one gets 409.
  The constraint covers the whole diary, so this holds from Layer 3 onward.
- A 10:45 start against a 10:00 booking succeeds - clear of the buffer.
- Booking from a browser in New York shows the same UTC instant as London.
- Zoom fails: the row stays `pending` with no `meeting_id`, and the admin sees it.
- Zoom succeeds, Google fails: the row stays `pending` **with** `meeting_id` set,
  and a retry reuses that meeting rather than creating a second one.
- Cancel deletes both the Zoom meeting and the calendar event.

## Environment

Supabase secrets:

- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
- `ZOOM_HOST_EMAIL` (see Open Questions)
- `BOOKING_GOOGLE_REFRESH_TOKEN`, `BOOKING_BUSY_CALENDARS`
- `GSC_CLIENT_ID` and `GSC_CLIENT_SECRET` (already set, reused)
- `RESEND_API_KEY` (already set)

Deploy:

```
npx supabase functions deploy booking-slots --project-ref wqaplkypnetifpqrungv
npx supabase functions deploy booking-create --project-ref wqaplkypnetifpqrungv
```

## Open Questions For Al

1. Should the chemistry session also be bookable by logged-in users from their
   dashboard, or public only?
2. Which calendars count as busy? Personal as well as work?
3. **Which Zoom user hosts?** The API's `me` resolves to whoever owns the
   Server-to-Server app credentials. If the Altogether Agile Zoom account ever
   grows past one user, name Al's address explicitly in `ZOOM_HOST_EMAIL` rather
   than relying on `me`.

Settled on 17 September 2026:

- The Zoom account is paid. No 40-minute cap.
- The overlap constraint is scoped to the whole diary, not to the booking type.
- Seeded working hours: Mon to Fri, 09:00 to 17:00, Europe/London. The migration
  is correct as written and needs no edit before running.
