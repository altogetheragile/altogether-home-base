import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { betReading, betVerdict, betLine, setSprintBet } from './engine';
import type { ZooGameState } from './types';

// The bet: a Sprint with a question in it.
//
// Evidence-Based Management's experiment loop, in the shape of a Sprint. A Sprint without one is a
// list of work that got finished or did not. A Sprint with one has a question somebody wants the
// answer to, and the visitor simulation stops being scenery.
//
// The rule these tests hold: the Review answers with a fact. Whether the bet came off, by how much
// it actually moved, and from what - because "it rose by 13" is the sentence worth reading, and it
// cannot be said without knowing where it started.

/** A game with a Sprint Review behind it, so there is something to read from. */
const withReview = (happiness: number, attendance: number, famHappiness = happiness): ZooGameState => ({
  ...initialZooState(3),
  lastReview: {
    overallHappiness: happiness,
    totalAttendance: attendance,
    segments: [
      { segmentId: 'families', attendance: attendance / 2, happiness: famHappiness, topExhibit: null, topExhibitShare: 0, truncationRate: 0, unmetNeeds: {} },
      { segmentId: 'enthusiasts', attendance: attendance / 4, happiness, topExhibit: null, topExhibitShare: 0, truncationRate: 0, unmetNeeds: {} },
      { segmentId: 'comfortSeekers', attendance: attendance / 4, happiness, topExhibit: null, topExhibitShare: 0, truncationRate: 0, unmetNeeds: {} },
    ],
    quotes: [], signals: [], nextAttendance: {},
  } as unknown as ZooGameState['lastReview'],
} as ZooGameState);

describe('making a bet', () => {
  it('keeps what the measure stood at, so the Review can say what happened', () => {
    const s = setSprintBet(withReview(42, 600, 38), { who: 'families', metric: 'happiness', by: 10 });
    expect(s.sprintBet).toMatchObject({ who: 'families', metric: 'happiness', by: 10, from: 38, sprint: 1 });
  });

  it('reads the measure the bet is about, not whichever one is to hand', () => {
    const s = withReview(42, 600, 38);
    expect(betReading(s, 'families', 'happiness'), 'a segment bet read the overall number').toBe(38);
    expect(betReading(s, 'all', 'happiness')).toBe(42);
    expect(betReading(s, 'all', 'visitors')).toBe(600);
    expect(betReading(s, 'families', 'visitors')).toBe(300);
  });

  it('starts from zero before there has been a Review to read', () => {
    // Sprint one has no history, and saying so is better than inventing a baseline.
    expect(betReading(initialZooState(1), 'families', 'happiness')).toBe(0);
  });

  it('says itself in one line, in words', () => {
    expect(betLine({ who: 'families', metric: 'happiness', by: 10 })).toBe('families’ happiness rises by 10');
    expect(betLine({ who: 'all', metric: 'visitors', by: 20 })).toBe('everybody coming rises by 20');
  });
});

describe('answering it at the Review', () => {
  it('says by how much it moved, not only whether the bet came off', () => {
    let s = setSprintBet(withReview(42, 600, 38), { who: 'families', metric: 'happiness', by: 10 });
    // The Sprint runs, and the visitors come back happier than that.
    s = { ...s, lastReview: { ...s.lastReview!, segments: s.lastReview!.segments.map((seg) => (seg.segmentId === 'families' ? { ...seg, happiness: 51 } : seg)) } };
    const v = betVerdict(s)!;
    expect(v.met, 'a rise of 13 did not settle a bet of 10').toBe(true);
    expect(v.moved).toBe(13);
    expect(v.now).toBe(51);
  });

  it('is honest when it goes the other way', () => {
    let s = setSprintBet(withReview(42, 600, 38), { who: 'families', metric: 'happiness', by: 10 });
    s = { ...s, lastReview: { ...s.lastReview!, segments: s.lastReview!.segments.map((seg) => (seg.segmentId === 'families' ? { ...seg, happiness: 30 } : seg)) } };
    const v = betVerdict(s)!;
    expect(v.met).toBe(false);
    expect(v.moved, 'a fall was not reported as a fall').toBe(-8);
  });

  it('says nothing when no bet was made', () => {
    expect(betVerdict(withReview(42, 600)), 'the Review invented a bet nobody made').toBeNull();
  });

  it('does not answer last Sprint’s bet again', () => {
    // A bet belongs to the Sprint it was made for. Carrying one forward would have the Review
    // grading work it was not about.
    const s = setSprintBet(withReview(42, 600, 38), { who: 'families', metric: 'happiness', by: 10 });
    expect(betVerdict({ ...s, sprintNumber: s.sprintNumber + 1 })).toBeNull();
  });

  it('can be taken back', () => {
    const s = reducer(setSprintBet(withReview(42, 600), { who: 'all', metric: 'visitors', by: 20 }),
      { type: 'SET_SPRINT_BET', bet: null });
    expect(s.sprintBet).toBeNull();
    expect(betVerdict(s)).toBeNull();
  });
});
