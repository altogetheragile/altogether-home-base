// Free slots for a booking type, as UTC instants.
//
// Public: the booking page calls this with the anon key. It reads only what the
// page needs and returns no personal data - existing bookings become anonymous
// busy blocks, never rows.
//
// Caches nothing. Availability that is a minute stale is availability that
// double-books.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildSlots, type DateOverride, type WeeklyWindow } from '../_shared/bookingSlots.ts';
import { fetchBusy } from '../_shared/googleCalendar.ts';

/** The shapes read back from Postgres, named so the mapping below is checkable. */
interface AvailabilityRow { weekday: number; start_local: string; end_local: string }
interface OverrideRow { on_date: string; closed: boolean; start_local: string | null; end_local: string | null }
interface BlockedRow { blocks_from: string; blocks_until: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** 'YYYY-MM-DD', and a real date rather than merely the right shape. */
function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** A window wider than this is someone probing, not a calendar being drawn. */
const MAX_RANGE_DAYS = 120;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);

    const slug = body.type ?? url.searchParams.get('type');
    const from = body.from ?? url.searchParams.get('from');
    const to = body.to ?? url.searchParams.get('to');

    if (typeof slug !== 'string' || !slug) return json({ error: 'Missing booking type' }, 400);
    if (!isIsoDate(from) || !isIsoDate(to)) return json({ error: 'from and to must be YYYY-MM-DD' }, 400);
    if (Date.parse(`${to}T00:00:00Z`) < Date.parse(`${from}T00:00:00Z`)) {
      return json({ error: 'to must not be before from' }, 400);
    }
    if (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) > MAX_RANGE_DAYS * DAY_MS) {
      return json({ error: `Range must be ${MAX_RANGE_DAYS} days or fewer` }, 400);
    }

    // Service role: availability and overrides are admin-only under RLS, and
    // existing bookings must be counted without being exposed.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data: type, error: typeError } = await supabase
      .from('booking_types')
      .select('id, slug, name, duration_minutes, buffer_before, buffer_after, min_notice_minutes, max_days_ahead, timezone, active')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (typeError) throw typeError;
    if (!type) return json({ error: 'Unknown booking type' }, 404);

    const [{ data: availability, error: availError }, { data: overrides, error: overrideError }] =
      await Promise.all([
        supabase
          .from('booking_availability')
          .select('weekday, start_local, end_local')
          .eq('booking_type_id', type.id),
        supabase
          .from('booking_overrides')
          .select('on_date, closed, start_local, end_local')
          .eq('booking_type_id', type.id)
          .gte('on_date', from)
          .lte('on_date', to),
      ]);

    if (availError) throw availError;
    if (overrideError) throw overrideError;

    const weekly: WeeklyWindow[] = (availability ?? []).map((w: AvailabilityRow) => ({
      weekday: w.weekday,
      startLocal: w.start_local,
      endLocal: w.end_local,
    }));

    const dateOverrides: DateOverride[] = (overrides ?? []).map((o: OverrideRow) => ({
      onDate: o.on_date,
      closed: o.closed,
      startLocal: o.start_local,
      endLocal: o.end_local,
    }));

    // Widen the window by a day either side so a block that straddles midnight
    // in the local zone is still seen.
    const timeMin = new Date(Date.parse(`${from}T00:00:00Z`) - DAY_MS).toISOString();
    const timeMax = new Date(Date.parse(`${to}T00:00:00Z`) + 2 * DAY_MS).toISOString();

    // Existing bookings block by their buffered window, which is exactly what
    // the database's exclusion constraint enforces on insert. Same rule in both
    // places, so the page cannot offer something the insert would reject.
    const { data: booked, error: bookedError } = await supabase
      .from('bookings')
      .select('blocks_from, blocks_until')
      .neq('status', 'cancelled')
      .gte('blocks_until', timeMin)
      .lte('blocks_from', timeMax);

    if (bookedError) throw bookedError;

    let calendarBusy: { start: string; end: string }[] = [];
    try {
      calendarBusy = await fetchBusy(timeMin, timeMax);
    } catch (e) {
      // Offering a slot over something already in the diary is worse than
      // offering nothing, so a broken calendar read fails the request rather
      // than quietly returning an over-optimistic list.
      console.error('[booking-slots] free/busy failed:', e);
      return json({ error: 'Could not read availability. Please try again shortly.' }, 503);
    }

    const busy = [
      ...calendarBusy,
      ...(booked ?? []).map((b: BlockedRow) => ({ start: b.blocks_from, end: b.blocks_until })),
    ];

    const slots = buildSlots({
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
      busy,
      from,
      to,
      now: new Date(),
    });

    return json({
      type: { slug: type.slug, name: type.name, durationMinutes: type.duration_minutes },
      // blocksFrom and blocksUntil are deliberately not returned: they are the
      // server's business, and booking-create recomputes them anyway.
      slots: slots.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt })),
    });
  } catch (e) {
    console.error('[booking-slots] unexpected:', e);
    return json({ error: 'Something went wrong' }, 500);
  }
});
