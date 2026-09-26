// Takes a booking.
//
// Public and unauthenticated, so it is guarded before it does anything
// expensive. Three external calls, and the ORDER MATTERS:
//
//   1. re-check the slot server-side        (never trust the posted list)
//   2. insert as pending                    (the constraint is the real guard)
//   3. create the Zoom meeting, WRITE IT    (before the calendar call)
//   4. create the calendar event
//   5. confirm, then email
//
// Step 3's write is not for a retry - a failure at step 4 deletes the meeting
// rather than retrying. It is there for the case nothing can catch: the
// invocation being killed between Zoom and the calendar. Then the meeting id is
// the only record that a meeting exists, and an admin can go and remove it.
//
// Anything after step 2 that fails is ABANDONED rather than left pending: the
// row is cancelled with a failure_reason, and any Zoom meeting already made is
// deleted. A booking that half happened must never vanish silently, but it must
// not squat on the slot either - every non-cancelled row blocks that time in the
// edge function and in the bookings_no_overlap constraint, so a row left pending
// took the slot out of circulation for good.
//
// The attempt is only recorded as 'ok' once step 5 has run. Recording it at
// step 2 counted a booking that never happened against the guest's daily limit,
// which locked them out for a day over our own failure.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { mailFrom } from '../_shared/mailFrom.ts';
import { mailer } from '../_shared/mailer.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isSlotAvailable, type DateOverride, type WeeklyWindow } from '../_shared/bookingSlots.ts';
import { fetchBusy, createCalendarEvent } from '../_shared/googleCalendar.ts';
import { createZoomMeeting, deleteZoomMeeting } from '../_shared/zoom.ts';
import {
  callerIp, hashIp, checkBookingGuards, recordAttempt, escapeHtml,
} from '../_shared/bookingGuards.ts';


/** The shapes read back from Postgres, named so the mapping below is checkable. */
interface AvailabilityRow { weekday: number; start_local: string; end_local: string }
interface OverrideRow { on_date: string; closed: boolean; start_local: string | null; end_local: string | null }
interface BlockedRow { blocks_from: string; blocks_until: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The name and the sending address are this deployment's, not this repository's. A customer of
// another site receiving a booking confirmation signed "Altogether Agile" is the worst version of
// getting this wrong, because it goes out under their name and they only find out from a reply.
//
// Env vars rather than a settings lookup, matching send-contact-email, which already reads
// COMPANY_NAME. The sending address has to be a verified domain in the mail provider anyway, so
// it is deployment configuration either way.
const COMPANY = Deno.env.get('COMPANY_NAME') || 'Altogether Agile';
const FROM = mailFrom(Deno.env);
const OWNER_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'info@altogetheragile.com';
const SITE = Deno.env.get('SITE_URL') || 'https://altogetheragile.com';
const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** A time formatted in a named zone, for the emails. */
function inZone(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

/** Rejects a zone the browser made up, so Intl cannot throw later. */
function safeTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value) return 'Europe/London';
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: value });
    return value;
  } catch {
    return 'Europe/London';
  }
}

/**
 * Gives up on a booking that got part way.
 *
 * Cancelling rather than deleting keeps it visible in admin; failure_reason is
 * what tells a person the system gave up rather than someone changing their
 * mind. Cancelled rows do not block the slot, so the time goes back on sale.
 */
async function abandon(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  reason: 'zoom' | 'calendar',
): Promise<void> {
  // The error is checked rather than ignored. supabase-js returns it instead of
  // throwing, so an update that PostgREST rejects looks exactly like one that
  // worked - and the row stays pending, holding a slot nobody can book while
  // the logs say only that Zoom failed. That cost an afternoon once.
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), failure_reason: reason })
    .eq('id', bookingId);

  if (error) {
    console.error(
      `[booking-create] COULD NOT ABANDON booking ${bookingId} (${reason}). ` +
        'It is still pending and is holding its slot. ' +
        `If this says the column is not in the schema cache, run: notify pgrst, 'reload schema'. ` +
        `Error: ${JSON.stringify(error)}`,
    );
  }
}

/**
 * Abandons bookings stuck at pending.
 *
 * The failure paths below cover the cases we can see. They cannot cover the
 * function being killed between the insert and the Zoom call - a timeout, or a
 * cold start giving up - which leaves a row nothing will ever revisit. Fifteen
 * minutes is far longer than a successful call takes and far shorter than a
 * slot anyone would wait for.
 */
async function sweepStalePending(supabase: ReturnType<typeof createClient>): Promise<void> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), failure_reason: 'timeout' })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 15 * 60_000).toISOString());

    // Logged, not thrown: housekeeping must never stop a booking being taken.
    // But a sweep that silently does nothing leaves stale rows holding slots,
    // which looks to a guest exactly like a full diary.
    if (error) console.error('[booking-create] stale sweep rejected:', JSON.stringify(error));
  } catch (e) {
    console.error('[booking-create] stale sweep failed:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let ipHash = 'unknown';
  let email = '';

  try {
    const body = await req.json().catch(() => ({}));
    const slug: string = body.type ?? '';
    const startsAtRaw: string = body.starts_at ?? '';
    const name: string = (body.name ?? '').trim();
    email = (body.email ?? '').trim().toLowerCase();
    const notes: string | null = body.notes ? String(body.notes).trim() : null;
    const guestTimezone = safeTimezone(body.timezone);

    ipHash = await hashIp(callerIp(req));

    // ── Guards, before anything costs money or sends mail ──
    const guard = await checkBookingGuards(supabase, {
      ipHash, email, name, notes, honeypot: body.company ?? null,
    });
    if (!guard.ok) {
      console.warn(`[booking-create] refused (${guard.reason}) for ${email || 'no email'}`);
      await recordAttempt(supabase, ipHash, email, 'blocked');
      return json({ error: guard.message }, guard.reason === 'ip-limit' ? 429 : 400);
    }

    if (!slug) return json({ error: 'Missing booking type' }, 400);
    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) return json({ error: 'Invalid start time' }, 400);

    // Before the slot re-check: a row abandoned by a killed invocation would
    // otherwise make a free slot look taken.
    await sweepStalePending(supabase);

    // ── 1. Re-check the slot ourselves ──
    const { data: type, error: typeError } = await supabase
      .from('booking_types')
      .select('id, slug, name, description, duration_minutes, buffer_before, buffer_after, min_notice_minutes, max_days_ahead, timezone, active')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (typeError) throw typeError;
    if (!type) return json({ error: 'Unknown booking type' }, 404);

    const dayBefore = new Date(startsAt.getTime() - DAY_MS).toISOString().slice(0, 10);
    const dayAfter = new Date(startsAt.getTime() + DAY_MS).toISOString().slice(0, 10);

    const [{ data: availability }, { data: overrides }] = await Promise.all([
      supabase.from('booking_availability').select('weekday, start_local, end_local').eq('booking_type_id', type.id),
      supabase.from('booking_overrides').select('on_date, closed, start_local, end_local')
        .eq('booking_type_id', type.id).gte('on_date', dayBefore).lte('on_date', dayAfter),
    ]);

    const weekly: WeeklyWindow[] = (availability ?? []).map((w: AvailabilityRow) => ({
      weekday: w.weekday, startLocal: w.start_local, endLocal: w.end_local,
    }));
    const dateOverrides: DateOverride[] = (overrides ?? []).map((o: OverrideRow) => ({
      onDate: o.on_date, closed: o.closed, startLocal: o.start_local, endLocal: o.end_local,
    }));

    const timeMin = new Date(startsAt.getTime() - 2 * DAY_MS).toISOString();
    const timeMax = new Date(startsAt.getTime() + 2 * DAY_MS).toISOString();

    let calendarBusy: { start: string; end: string }[] = [];
    try {
      calendarBusy = await fetchBusy(timeMin, timeMax);
    } catch (e) {
      console.error('[booking-create] free/busy failed:', e);
      return json({ error: 'Could not confirm availability. Please try again shortly.' }, 503);
    }

    const { data: booked } = await supabase
      .from('bookings')
      .select('blocks_from, blocks_until')
      .neq('status', 'cancelled')
      .gte('blocks_until', timeMin)
      .lte('blocks_from', timeMax);

    const slot = isSlotAvailable({
      rules: {
        durationMinutes: type.duration_minutes,
        bufferBefore: type.buffer_before,
        bufferAfter: type.buffer_after,
        minNoticeMinutes: type.min_notice_minutes,
        maxDaysAhead: type.max_days_ahead,
        timezone: type.timezone,
      },
      weekly,
      overrides: dateOverrides,
      busy: [
        ...calendarBusy,
        ...(booked ?? []).map((b: BlockedRow) => ({ start: b.blocks_from, end: b.blocks_until })),
      ],
      from: dayBefore,
      to: dayAfter,
      now: new Date(),
      startsAt: startsAt.toISOString(),
    });

    if (!slot) {
      return json({ error: 'That time is no longer available. Please pick another.' }, 409);
    }

    // ── 2. Insert as pending. The exclusion constraint is the real guard: two
    // callers can both reach here, only one can commit. ──
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        booking_type_id: type.id,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        blocks_from: slot.blocksFrom,
        blocks_until: slot.blocksUntil,
        guest_name: name,
        guest_email: email,
        guest_timezone: guestTimezone,
        notes,
        status: 'pending',
      })
      .select('id, manage_token')
      .single();

    if (insertError) {
      // 23P01 is exclusion_violation: someone took the slot between the check
      // and the insert. That is the race working as designed, not an error.
      if (insertError.code === '23P01' || insertError.code === '23505') {
        return json({ error: 'That time was just taken. Please pick another.' }, 409);
      }
      throw insertError;
    }

    // ── 3. Zoom, then write the id straight away ──
    let meeting;
    try {
      meeting = await createZoomMeeting({
        topic: `${type.name}: ${name}`,
        startsAt: slot.startsAt,
        durationMinutes: type.duration_minutes,
        agenda: notes ?? '',
      });
    } catch (e) {
      console.error(`[booking-create] Zoom failed for booking ${booking.id}:`, e);
      await abandon(supabase, booking.id, 'zoom');
      await recordAttempt(supabase, ipHash, email, 'failed');
      return json({
        error: 'Sorry, the video link could not be created. Please try again, or use the contact form.',
        bookingId: booking.id,
      }, 502);
    }

    // Written before the calendar call so that an invocation killed between the
    // two still leaves a record of the meeting. Every failure we can see deletes
    // it instead; this covers the one we cannot.
    const { error: meetingWriteError } = await supabase
      .from('bookings')
      .update({
        meeting_id: meeting.meetingId,
        meeting_url: meeting.joinUrl,
        meeting_passcode: meeting.passcode,
      })
      .eq('id', booking.id);

    if (meetingWriteError) {
      console.error(
        `[booking-create] could not store the Zoom meeting for booking ${booking.id}. ` +
          `The meeting EXISTS in Zoom but nothing records it: ${JSON.stringify(meetingWriteError)}`,
      );
    }

    // ── 4. Calendar ──
    const passcodeLine = meeting.passcode ? `\nPasscode: ${meeting.passcode}` : '';
    let calendarEventId: string | null = null;
    try {
      const event = await createCalendarEvent({
        summary: `${type.name}: ${name}`,
        description:
          `${type.name} with ${name} (${email}).\n\n` +
          `Join: ${meeting.joinUrl}${passcodeLine}\n\n` +
          (notes ? `What they would like to talk about:\n${notes}\n` : ''),
        location: meeting.joinUrl,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        guestEmail: email,
        guestName: name,
      });
      calendarEventId = event.eventId;
    } catch (e) {
      // Roll the Zoom meeting back. Without this the slot goes back on sale
      // while an orphaned meeting nobody knows about sits in the Zoom account.
      console.error(`[booking-create] calendar failed for booking ${booking.id}:`, e);
      await deleteZoomMeeting(meeting.meetingId);
      await abandon(supabase, booking.id, 'calendar');
      await recordAttempt(supabase, ipHash, email, 'failed');
      return json({
        error: 'Sorry, the calendar invite could not be created. Please try again, or use the contact form.',
        bookingId: booking.id,
      }, 502);
    }

    // ── 5. Confirm ──
    const { error: confirmError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', calendar_event_id: calendarEventId })
      .eq('id', booking.id);

    // Everything worked and only the bookkeeping failed, so the guest keeps
    // their meeting and their invite. But the row is still pending, so admin
    // will show it as stuck and the sweep will eventually cancel a booking that
    // is real. Loud, because it needs a person.
    if (confirmError) {
      console.error(
        `[booking-create] COULD NOT CONFIRM booking ${booking.id}. The guest HAS a Zoom meeting ` +
          `and a calendar invite, but the row is still pending: ${JSON.stringify(confirmError)}`,
      );
    }

    // Recorded here, not at the insert: this is the first moment the booking
    // actually exists, and 'ok' is what the per-email daily cap counts.
    await recordAttempt(supabase, ipHash, email, 'ok');

    // ── Emails. Failing here does not un-book anything, so it must not fail
    // the request - the guest already has the calendar invite from Google. ──
    const safeName = escapeHtml(name);
    const safeNotes = notes ? escapeHtml(notes).replace(/\n/g, '<br>') : '';
    const guestWhen = inZone(slot.startsAt, guestTimezone);
    const ownerWhen = inZone(slot.startsAt, 'Europe/London');

    // No sender configured means no site address to send from, and sending from another site's
    // domain is refused by Resend anyway. The booking itself is already made: this block only
    // decides whether anybody is written to about it.
    const resend = mailer(Deno.env);
    if (!resend || !FROM) {
      // The booking is made either way. This block only decides whether anybody is written to.
      console.error(
        !resend
          ? 'No RESEND_API_KEY on this project: the booking is made, no email sent.'
          : 'No MAIL_FROM and no SITE_URL: the booking is made, no email sent.',
      );
    } else try {
      await resend.emails.send({
        from: FROM,
        to: [email],
        replyTo: OWNER_EMAIL,
        subject: `Your ${type.name} is booked`,
        html: `
          <h1>You are booked in, ${safeName}</h1>
          <p><strong>${escapeHtml(type.name)}</strong><br>
             ${escapeHtml(guestWhen)} (${escapeHtml(guestTimezone)})<br>
             ${type.duration_minutes} minutes</p>
          <p><a href="${meeting.joinUrl}">Join the Zoom meeting</a>
             ${meeting.passcode ? `<br>Passcode: ${escapeHtml(meeting.passcode)}` : ''}</p>
          <p>A calendar invite is on its way separately, so the meeting lands in
             your own diary with the link attached.</p>
          <p>If you need to change or cancel, just reply to this email.</p>
          <p>See you then,<br>${COMPANY}</p>
        `,
      });

      await resend.emails.send({
        from: FROM,
        to: [OWNER_EMAIL],
        replyTo: email,
        subject: `New booking: ${type.name} with ${name}`,
        html: `
          <h2>New booking</h2>
          <p><strong>${safeName}</strong> &lt;${escapeHtml(email)}&gt;</p>
          <p>${escapeHtml(type.name)}<br>
             ${escapeHtml(ownerWhen)} (Europe/London)<br>
             Guest is in ${escapeHtml(guestTimezone)}</p>
          ${safeNotes ? `<p><strong>What they would like to talk about:</strong><br>${safeNotes}</p>` : ''}
          <p><a href="${meeting.joinUrl}">Zoom meeting</a></p>
          <p><a href="${SITE}/admin/bookings">Open in admin</a></p>
        `,
      });
    } catch (e) {
      console.error(`[booking-create] emails failed for booking ${booking.id}:`, e);
    }

    return json({
      ok: true,
      booking: {
        id: booking.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        meetingUrl: meeting.joinUrl,
        passcode: meeting.passcode,
        timezone: guestTimezone,
      },
    });
  } catch (e) {
    console.error('[booking-create] unexpected:', e);
    await recordAttempt(supabase, ipHash, email, 'blocked');
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
