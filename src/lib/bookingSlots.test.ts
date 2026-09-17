import { describe, it, expect } from 'vitest';
import {
  buildSlots,
  isSlotAvailable,
  wallTimeToUtc,
  type BookingTypeRules,
  type WeeklyWindow,
} from '../../supabase/functions/_shared/bookingSlots';

// The seeded Chemistry Session: 30 minutes, 15 minutes of buffer after, 24
// hours notice, 30 days ahead, Europe/London.
const RULES: BookingTypeRules = {
  durationMinutes: 30,
  bufferBefore: 0,
  bufferAfter: 15,
  minNoticeMinutes: 1440,
  maxDaysAhead: 30,
  timezone: 'Europe/London',
};

// Mon to Fri, 09:00 to 17:00, as the migration seeds it. weekday 0 = Sunday.
const WEEKDAYS: WeeklyWindow[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startLocal: '09:00',
  endLocal: '17:00',
}));

/** A clock far enough before the test dates that the notice period never bites. */
const NOW_JANUARY = new Date('2027-01-04T09:00:00Z');

const startsOn = (slots: { startsAt: string }[]) => slots.map((s) => s.startsAt);

describe('wallTimeToUtc', () => {
  it('treats London as UTC in winter', () => {
    expect(wallTimeToUtc(2027, 1, 11, 9, 0, 'Europe/London').toISOString())
      .toBe('2027-01-11T09:00:00.000Z');
  });

  it('puts London an hour ahead in summer', () => {
    expect(wallTimeToUtc(2027, 7, 12, 9, 0, 'Europe/London').toISOString())
      .toBe('2027-07-12T08:00:00.000Z');
  });

  it('handles a zone behind UTC', () => {
    expect(wallTimeToUtc(2027, 7, 12, 9, 0, 'America/New_York').toISOString())
      .toBe('2027-07-12T13:00:00.000Z');
  });

  it('resolves a time the spring-forward skips rather than returning garbage', () => {
    // BST starts 2027-03-28; 01:00 to 02:00 local does not exist.
    const resolved = wallTimeToUtc(2027, 3, 28, 1, 30, 'Europe/London');
    expect(Number.isNaN(resolved.getTime())).toBe(false);
    expect(resolved.toISOString()).toBe('2027-03-28T01:30:00.000Z');
  });
});

describe('buildSlots, the seeded weekly rules', () => {
  it('offers a full day of back-to-back slots', () => {
    // Monday 11 January 2027. 09:00 to 17:00 at 30 minutes is 16 slots.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    expect(slots).toHaveLength(16);
    expect(slots[0].startsAt).toBe('2027-01-11T09:00:00.000Z');
    expect(slots[0].endsAt).toBe('2027-01-11T09:30:00.000Z');
    expect(slots[15].startsAt).toBe('2027-01-11T16:30:00.000Z');
  });

  it('offers nothing at the weekend', () => {
    // Saturday and Sunday, 16 and 17 January 2027.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-01-16',
      to: '2027-01-17',
      now: NOW_JANUARY,
    });

    expect(slots).toEqual([]);
  });

  it('carries the buffer into the blocking window but not the meeting', () => {
    const [first] = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    expect(first.startsAt).toBe('2027-01-11T09:00:00.000Z');
    expect(first.endsAt).toBe('2027-01-11T09:30:00.000Z');
    expect(first.blocksFrom).toBe('2027-01-11T09:00:00.000Z');
    expect(first.blocksUntil).toBe('2027-01-11T09:45:00.000Z'); // +15 buffer
  });
});

describe('buildSlots across the British clock changes', () => {
  it('offers 09:00 local as 09:00 UTC on a Monday in March, before BST', () => {
    // BST starts 28 March 2027, so Monday 22 March is still GMT.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-03-22',
      to: '2027-03-22',
      now: new Date('2027-03-01T09:00:00Z'),
    });

    expect(slots[0].startsAt).toBe('2027-03-22T09:00:00.000Z');
  });

  it('offers 09:00 local as 08:00 UTC on a Monday in April, during BST', () => {
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-04-05',
      to: '2027-04-05',
      now: new Date('2027-03-22T09:00:00Z'),
    });

    expect(slots[0].startsAt).toBe('2027-04-05T08:00:00.000Z');
  });

  it('shifts back to GMT after the October change', () => {
    // BST ends 31 October 2027. Monday 1 November is GMT again.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-11-01',
      to: '2027-11-01',
      now: new Date('2027-10-20T09:00:00Z'),
    });

    expect(slots[0].startsAt).toBe('2027-11-01T09:00:00.000Z');
  });

  it('keeps the working day eight hours long on both sides of the change', () => {
    const march = buildSlots({
      rules: RULES, weekly: WEEKDAYS, from: '2027-03-22', to: '2027-03-22',
      now: new Date('2027-03-01T09:00:00Z'),
    });
    const april = buildSlots({
      rules: RULES, weekly: WEEKDAYS, from: '2027-04-05', to: '2027-04-05',
      now: new Date('2027-03-22T09:00:00Z'),
    });

    // The wall clock is what the coach committed to, so the count must not move.
    expect(march).toHaveLength(16);
    expect(april).toHaveLength(16);
  });

  it('offers a Sunday only when a weekly rule covers it', () => {
    // BST ends on Sunday 31 October 2027, the 25-hour day. Nothing is offered
    // with weekday rules alone, so add one to prove the day still works.
    const sundayRule: WeeklyWindow[] = [{ weekday: 0, startLocal: '09:00', endLocal: '12:00' }];

    const none = buildSlots({
      rules: RULES, weekly: WEEKDAYS, from: '2027-10-31', to: '2027-10-31',
      now: new Date('2027-10-20T09:00:00Z'),
    });
    const some = buildSlots({
      rules: RULES, weekly: sundayRule, from: '2027-10-31', to: '2027-10-31',
      now: new Date('2027-10-20T09:00:00Z'),
    });

    expect(none).toEqual([]);
    expect(some).toHaveLength(6); // 09:00 to 12:00 at 30 minutes
    expect(some[0].startsAt).toBe('2027-10-31T09:00:00.000Z'); // GMT by 09:00
  });
});

describe('buildSlots and date overrides', () => {
  it('closes a bank holiday completely', () => {
    // Monday 3 May 2027, early May bank holiday.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      overrides: [{ onDate: '2027-05-03', closed: true, note: 'Early May bank holiday' } as never],
      from: '2027-05-03',
      to: '2027-05-03',
      now: new Date('2027-04-01T09:00:00Z'),
    });

    expect(slots).toEqual([]);
  });

  it('replaces the weekly window rather than adding to it', () => {
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      overrides: [{ onDate: '2027-01-11', closed: false, startLocal: '14:00', endLocal: '16:00' }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    expect(slots).toHaveLength(4); // 14:00 to 16:00, not the full day
    expect(startsOn(slots)).toEqual([
      '2027-01-11T14:00:00.000Z',
      '2027-01-11T14:30:00.000Z',
      '2027-01-11T15:00:00.000Z',
      '2027-01-11T15:30:00.000Z',
    ]);
  });

  it('opens a Saturday that no weekly rule covers', () => {
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      overrides: [{ onDate: '2027-01-16', closed: false, startLocal: '10:00', endLocal: '11:00' }],
      from: '2027-01-16',
      to: '2027-01-16',
      now: NOW_JANUARY,
    });

    expect(startsOn(slots)).toEqual(['2027-01-16T10:00:00.000Z', '2027-01-16T10:30:00.000Z']);
  });
});

describe('buildSlots and busy blocks', () => {
  it('drops a slot a busy block cuts in half', () => {
    // Busy 10:15 to 10:45 knocks out the 10:00 and 10:30 slots.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      busy: [{ start: '2027-01-11T10:15:00Z', end: '2027-01-11T10:45:00Z' }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    const starts = startsOn(slots);
    expect(starts).toContain('2027-01-11T09:30:00.000Z');
    expect(starts).not.toContain('2027-01-11T10:00:00.000Z');
    expect(starts).not.toContain('2027-01-11T10:30:00.000Z');
    expect(starts).toContain('2027-01-11T11:00:00.000Z');
  });

  it('drops the slot immediately after a booking, because the buffer is still held', () => {
    // An existing 10:00 booking blocks 10:00 to 10:45 once buffer_after is
    // counted. The 10:30 slot must not be offered even though the meetings
    // themselves would not overlap. This is the case a naive builder gets wrong.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      busy: [{ start: '2027-01-11T10:00:00Z', end: '2027-01-11T10:45:00Z' }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    const starts = startsOn(slots);
    expect(starts).not.toContain('2027-01-11T10:00:00.000Z');
    expect(starts).not.toContain('2027-01-11T10:30:00.000Z');
    expect(starts).toContain('2027-01-11T11:00:00.000Z');
  });

  it('respects bufferBefore as well', () => {
    const rules = { ...RULES, bufferBefore: 15 };
    // Busy until 10:00 exactly. With 15 minutes held before, the 10:00 slot
    // would need the room from 09:45, so it goes.
    const slots = buildSlots({
      rules,
      weekly: WEEKDAYS,
      busy: [{ start: '2027-01-11T09:30:00Z', end: '2027-01-11T10:00:00Z' }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    const starts = startsOn(slots);
    expect(starts).not.toContain('2027-01-11T10:00:00.000Z');
    expect(starts).toContain('2027-01-11T10:30:00.000Z');
  });

  it('leaves a slot that merely touches a busy block', () => {
    // Busy 08:00 to 09:00, slot 09:00 to 09:30 with no bufferBefore. Touching
    // is not overlapping.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      busy: [{ start: '2027-01-11T08:00:00Z', end: '2027-01-11T09:00:00Z' }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    expect(startsOn(slots)).toContain('2027-01-11T09:00:00.000Z');
  });

  it('accepts Date objects as well as ISO strings', () => {
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      busy: [{ start: new Date('2027-01-11T09:00:00Z'), end: new Date('2027-01-11T09:30:00Z') }],
      from: '2027-01-11',
      to: '2027-01-11',
      now: NOW_JANUARY,
    });

    expect(startsOn(slots)).not.toContain('2027-01-11T09:00:00.000Z');
  });
});

describe('buildSlots, notice and horizon', () => {
  it('hides slots inside the notice period', () => {
    // Standing at 08:00 on Monday with 24 hours notice, nothing on Monday or
    // before 08:00 Tuesday may be offered.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-01-11',
      to: '2027-01-12',
      now: new Date('2027-01-11T08:00:00Z'),
    });

    const starts = startsOn(slots);
    expect(starts.every((s) => s >= '2027-01-12T08:00:00.000Z')).toBe(true);
    expect(starts).toContain('2027-01-12T09:00:00.000Z');
  });

  it('hides slots beyond the horizon', () => {
    const rules = { ...RULES, maxDaysAhead: 7 };
    const slots = buildSlots({
      rules,
      weekly: WEEKDAYS,
      from: '2027-01-11',
      to: '2027-01-29',
      now: new Date('2027-01-11T09:00:00Z'),
    });

    const starts = startsOn(slots);
    expect(starts.length).toBeGreaterThan(0);
    expect(starts.every((s) => s <= '2027-01-18T09:00:00.000Z')).toBe(true);
  });

  it('offers nothing when the horizon is behind the notice period', () => {
    const rules = { ...RULES, minNoticeMinutes: 1440 * 10, maxDaysAhead: 2 };
    const slots = buildSlots({
      rules,
      weekly: WEEKDAYS,
      from: '2027-01-11',
      to: '2027-01-29',
      now: new Date('2027-01-04T09:00:00Z'),
    });

    expect(slots).toEqual([]);
  });
});

describe('buildSlots, the guest time zone does not change the instant', () => {
  it('produces the same UTC instants whatever zone the caller is in', () => {
    // The builder never reads the ambient zone, so a browser in New York and a
    // browser in London are offered the same moments. They render differently;
    // they are not different slots.
    const slots = buildSlots({
      rules: RULES,
      weekly: WEEKDAYS,
      from: '2027-07-12',
      to: '2027-07-12',
      now: new Date('2027-07-01T09:00:00Z'),
    });

    expect(slots[0].startsAt).toBe('2027-07-12T08:00:00.000Z'); // 09:00 BST

    const inNewYork = new Date(slots[0].startsAt).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(inNewYork).toBe('04:00'); // same instant, 04:00 EDT
  });
});

describe('isSlotAvailable', () => {
  const args = {
    rules: RULES,
    weekly: WEEKDAYS,
    from: '2027-01-11',
    to: '2027-01-11',
    now: NOW_JANUARY,
  };

  it('confirms a slot that is genuinely free', () => {
    const slot = isSlotAvailable({ ...args, startsAt: '2027-01-11T09:00:00.000Z' });
    expect(slot).not.toBeNull();
    expect(slot?.blocksUntil).toBe('2027-01-11T09:45:00.000Z');
  });

  it('refuses a start that is not on the grid', () => {
    expect(isSlotAvailable({ ...args, startsAt: '2027-01-11T09:07:00.000Z' })).toBeNull();
  });

  it('refuses a start outside the working day', () => {
    expect(isSlotAvailable({ ...args, startsAt: '2027-01-11T18:00:00.000Z' })).toBeNull();
  });

  it('refuses a start a busy block covers', () => {
    const slot = isSlotAvailable({
      ...args,
      busy: [{ start: '2027-01-11T09:00:00Z', end: '2027-01-11T09:30:00Z' }],
      startsAt: '2027-01-11T09:00:00.000Z',
    });
    expect(slot).toBeNull();
  });

  it('refuses a start inside a previous booking\'s buffer', () => {
    const slot = isSlotAvailable({
      ...args,
      busy: [{ start: '2027-01-11T10:00:00Z', end: '2027-01-11T10:45:00Z' }],
      startsAt: '2027-01-11T10:30:00.000Z',
    });
    expect(slot).toBeNull();
  });

  it('refuses a start on a closed day', () => {
    const slot = isSlotAvailable({
      ...args,
      overrides: [{ onDate: '2027-01-11', closed: true }],
      startsAt: '2027-01-11T09:00:00.000Z',
    });
    expect(slot).toBeNull();
  });
});
