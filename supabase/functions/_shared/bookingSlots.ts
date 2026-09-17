// Slot building for the booking tool, Layer 1.
//
// Pure functions, no I/O and no dependencies. It lives in _shared so the
// booking-slots and booking-create edge functions can both import it, and it is
// unit tested from src/lib/bookingSlots.test.ts (the same trick
// pattern-grounding.ts uses).
//
// Time zones are handled with Intl rather than a library on purpose: the edge
// functions run on Deno, where pulling in date-fns is awkward, and Intl behaves
// the same there, in the browser and under Vitest.
//
// The rule from the spec: availability is authored in the booking type's local
// time, all maths happens here, and everything crossing a boundary is UTC.

export interface BookingTypeRules {
  durationMinutes: number;
  /** Minutes held before the meeting; part of the blocking window. */
  bufferBefore: number;
  /** Minutes held after the meeting; part of the blocking window. */
  bufferAfter: number;
  /** How soon from now a guest may book. */
  minNoticeMinutes: number;
  /** How far ahead a guest may book. */
  maxDaysAhead: number;
  /** IANA zone the weekly windows are written in, e.g. 'Europe/London'. */
  timezone: string;
  /**
   * Gap between slot starts. Defaults to the duration, giving back-to-back
   * slots. Set it smaller for overlapping offers, larger for a sparser grid.
   */
  stepMinutes?: number;
}

/** A weekly window, in the booking type's local time. weekday 0 = Sunday. */
export interface WeeklyWindow {
  weekday: number;
  startLocal: string; // 'HH:MM' or 'HH:MM:SS'
  endLocal: string;
}

/**
 * A date-level exception. `closed` blocks the whole day; otherwise the window
 * replaces that day's weekly rules. One per date per booking type, which the
 * migration enforces.
 */
export interface DateOverride {
  onDate: string; // 'YYYY-MM-DD'
  closed: boolean;
  startLocal?: string | null;
  endLocal?: string | null;
}

/** A period that is not bookable: a calendar busy block, or an existing booking. */
export interface BusyBlock {
  start: string | Date;
  end: string | Date;
}

export interface Slot {
  /** Meeting start, UTC ISO. */
  startsAt: string;
  /** Meeting end, UTC ISO. */
  endsAt: string;
  /** Start minus bufferBefore, UTC ISO. Written to bookings.blocks_from. */
  blocksFrom: string;
  /** End plus bufferAfter, UTC ISO. Written to bookings.blocks_until. */
  blocksUntil: string;
}

export interface BuildSlotsInput {
  rules: BookingTypeRules;
  weekly: WeeklyWindow[];
  overrides?: DateOverride[];
  /** Calendar busy blocks and existing bookings' blocking windows. */
  busy?: BusyBlock[];
  /** First calendar date to consider, 'YYYY-MM-DD', in the type's zone. */
  from: string;
  /** Last calendar date to consider, inclusive, 'YYYY-MM-DD'. */
  to: string;
  /** Injectable clock so tests are not at the mercy of the wall clock. */
  now: Date;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * How far `tz` is ahead of UTC at this instant, in milliseconds.
 *
 * Formats the instant in the zone, reads the pieces back as if they were UTC,
 * and takes the difference. Negative west of Greenwich.
 */
function tzOffsetMs(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);

  const f: Record<string, number> = {};
  for (const p of parts) if (p.type !== 'literal') f[p.type] = Number(p.value);

  // Some engines render midnight as hour 24.
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour % 24, f.minute, f.second);
  return asIfUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * The UTC instant for a wall-clock time in `tz`.
 *
 * Two passes, because the offset depends on the very instant being solved for.
 * The first pass lands close enough that the second reads the correct offset,
 * which is what makes the clock-change days come out right.
 *
 * Local times that a spring-forward skips do not exist; this resolves them
 * forward, the same way most calendars do.
 */
export function wallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  tz: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let ts = naive - tzOffsetMs(new Date(naive), tz);
  ts = naive - tzOffsetMs(new Date(ts), tz);
  return new Date(ts);
}

/** 'HH:MM' or 'HH:MM:SS' to minutes past local midnight. */
function parseLocalTime(value: string): number {
  const [h, m] = value.split(':');
  return Number(h) * 60 + Number(m);
}

/** 'YYYY-MM-DD' to its parts. */
function parseDate(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

/** Calendar dates from `from` to `to` inclusive, as 'YYYY-MM-DD'. */
function eachDate(from: string, to: string): string[] {
  const start = parseDate(from);
  const end = parseDate(to);
  const startTs = Date.UTC(start.year, start.month - 1, start.day);
  const endTs = Date.UTC(end.year, end.month - 1, end.day);

  const out: string[] = [];
  for (let ts = startTs; ts <= endTs; ts += DAY) {
    out.push(new Date(ts).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Day of week for a calendar date, 0 = Sunday.
 *
 * Read off the date itself rather than an instant, so it does not shift with
 * the zone. Matches Postgres extract(dow) and JavaScript Date.getDay(), which
 * is the convention booking_availability.weekday is seeded with.
 */
function weekdayOf(date: string): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The local windows that apply on a date: an override if there is one, else the weekly rules. */
function windowsForDate(
  date: string,
  weekly: WeeklyWindow[],
  overrides: DateOverride[],
): Array<{ startMin: number; endMin: number }> {
  const override = overrides.find((o) => o.onDate === date);

  if (override) {
    if (override.closed || !override.startLocal || !override.endLocal) return [];
    return [{
      startMin: parseLocalTime(override.startLocal),
      endMin: parseLocalTime(override.endLocal),
    }];
  }

  const dow = weekdayOf(date);
  return weekly
    .filter((w) => w.weekday === dow)
    .map((w) => ({ startMin: parseLocalTime(w.startLocal), endMin: parseLocalTime(w.endLocal) }));
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Free slots between two dates, as UTC instants.
 *
 * A slot survives when it sits inside a window, is far enough away to respect
 * the notice period, is not beyond the horizon, and its blocking window (the
 * meeting plus its buffers) touches nothing busy.
 *
 * Checking the buffered window rather than the meeting is what stops a slot
 * being offered in the gap the previous booking is still holding. The database
 * enforces the same rule, so a race that slips past this check is still caught
 * on insert.
 */
export function buildSlots(input: BuildSlotsInput): Slot[] {
  const { rules, weekly, from, to, now } = input;
  const overrides = input.overrides ?? [];
  const busy = input.busy ?? [];

  const step = rules.stepMinutes ?? rules.durationMinutes;
  if (step <= 0 || rules.durationMinutes <= 0) return [];

  const earliest = now.getTime() + rules.minNoticeMinutes * MINUTE;
  const latest = now.getTime() + rules.maxDaysAhead * DAY;

  const busyRanges = busy.map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));

  const slots: Slot[] = [];

  for (const date of eachDate(from, to)) {
    const { year, month, day } = parseDate(date);

    for (const window of windowsForDate(date, weekly, overrides)) {
      for (let startMin = window.startMin; startMin + rules.durationMinutes <= window.endMin; startMin += step) {
        const start = wallTimeToUtc(
          year,
          month,
          day,
          Math.floor(startMin / 60),
          startMin % 60,
          rules.timezone,
        ).getTime();

        const end = start + rules.durationMinutes * MINUTE;
        const blocksFrom = start - rules.bufferBefore * MINUTE;
        const blocksUntil = end + rules.bufferAfter * MINUTE;

        if (start < earliest) continue;
        if (start > latest) continue;
        if (busyRanges.some((b) => overlaps(blocksFrom, blocksUntil, b.start, b.end))) continue;

        slots.push({
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          blocksFrom: new Date(blocksFrom).toISOString(),
          blocksUntil: new Date(blocksUntil).toISOString(),
        });
      }
    }
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return slots;
}

/**
 * Whether one specific start is still free.
 *
 * booking-create calls this instead of trusting the list the browser posted
 * back. Same inputs, same rules, one answer.
 */
export function isSlotAvailable(input: BuildSlotsInput & { startsAt: string | Date }): Slot | null {
  const wanted = new Date(input.startsAt).toISOString();
  const date = wanted.slice(0, 10);

  // Widen by a day either side so a slot near midnight UTC is still generated
  // when the local date it belongs to differs.
  const dayBefore = new Date(new Date(date).getTime() - DAY).toISOString().slice(0, 10);
  const dayAfter = new Date(new Date(date).getTime() + DAY).toISOString().slice(0, 10);

  const slots = buildSlots({ ...input, from: dayBefore, to: dayAfter });
  return slots.find((s) => s.startsAt === wanted) ?? null;
}
