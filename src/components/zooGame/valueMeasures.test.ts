import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { valueMeasures } from './engine';
import type { BacklogItem, ZooGameState } from './types';

// The four questions Evidence-Based Management asks, answered from the zoo rather than invented.
//
// Current Value is what visitors are getting now. Unrealized Value is what they are not - and it is
// the worst-served group that says so, because an average hides the people who left early. Time to
// Market is how long work takes to reach anybody. Ability to Innovate is how much capacity went
// into something new rather than into fixing what was already delivered.
//
// A measure with nothing behind it yet is null, not zero. Zero is a claim; "we have not measured
// that yet" is the truth before the first Review, and the whole point is to teach a team to act on
// evidence rather than on numbers that look like evidence.

const by = (ms: ReturnType<typeof valueMeasures>, key: string) => ms.find((m) => m.key === key)!;

const reviewed = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3),
  lastReview: {
    overallHappiness: 62, totalAttendance: 640,
    segments: [
      { segmentId: 'families', happiness: 71, attendance: 300 },
      { segmentId: 'enthusiasts', happiness: 66, attendance: 190 },
      { segmentId: 'comfortSeekers', happiness: 31, attendance: 150 },
    ],
    quotes: [], signals: [], nextAttendance: {},
  },
  ...over,
} as unknown as ZooGameState);

describe('the four key value measures', () => {
  it('says nothing rather than zero before anything has been measured', () => {
    const fresh = valueMeasures(initialZooState(3));
    expect(by(fresh, 'cv').value, 'Current Value was claimed before a single visitor came').toBeNull();
    expect(by(fresh, 'uv').value).toBeNull();
    expect(by(fresh, 't2m').value, 'a lead time was reported before anything reached visitors').toBeNull();
    expect(by(fresh, 'cv').detail).toMatch(/measured at the first Sprint Review/i);
  });

  it('reads Current Value from what the visitors actually found', () => {
    const cv = by(valueMeasures(reviewed()), 'cv');
    expect(cv.value).toBe(62);
    expect(cv.detail, 'the number arrives without the evidence behind it').toMatch(/happiness 62 · 640 visitors/);
  });

  it('reads Unrealized Value off the group served worst, not the average', () => {
    // An average of 62 hides comfort seekers on 31. They are where the value is not.
    const uv = by(valueMeasures(reviewed()), 'uv');
    expect(uv.value, 'the gap was averaged away').toBe(69);
    expect(uv.detail).toMatch(/Comfort Seekers/);
  });

  it('measures Time to Market in the days work took to reach anybody', () => {
    const state = reviewed({ sprintDays: 3, sprintNumber: 3,
      backlog: [
        // forecast in Sprint 1, live in Sprint 1: one Sprint.
        { id: 'a', name: 'A', status: 'open', estimate: 3, sprintNumber: 1, openedIn: 1 },
        // forecast in Sprint 2, live in Sprint 3: two.
        { id: 'b', name: 'B', status: 'open', estimate: 5, sprintNumber: 2, openedIn: 3 },
      ] as BacklogItem[] });
    // An average of one and two Sprints, three days each.
    expect(by(valueMeasures(state), 't2m').value).toBe(5);
  });

  it('measures Ability to Innovate as capacity that went into something new', () => {
    const state = reviewed({ backlog: [
      { id: 'a', name: 'A', status: 'open', estimate: 8, sprintNumber: 1, openedIn: 1 },
      // an improvement exists because something delivered was not good enough: that is not new work
      { id: 'fix', name: 'Improve A', status: 'open', estimate: 2, sprintNumber: 2, openedIn: 2, enhancesId: 'a' },
    ] as BacklogItem[] });
    const a2i = by(valueMeasures(state), 'a2i');
    expect(a2i.value, '8 of 10 points went into new capability').toBe(80);
    expect(a2i.detail).toMatch(/2 of 10 points went on fixing/);
  });

  it('says so plainly when nothing was lost to rework', () => {
    const state = reviewed({ backlog: [
      { id: 'a', name: 'A', status: 'open', estimate: 8, sprintNumber: 1, openedIn: 1 },
    ] as BacklogItem[] });
    expect(by(valueMeasures(state), 'a2i').value).toBe(100);
    expect(by(valueMeasures(state), 'a2i').detail).toMatch(/no capacity lost to rework/);
  });
});
