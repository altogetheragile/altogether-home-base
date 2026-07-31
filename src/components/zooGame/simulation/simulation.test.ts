import { describe, it, expect } from 'vitest';
import { simulateSprint, jitterItems, driftAttendance } from './simulate';
import { DEFAULT_CONFIG, DEFAULT_SEGMENTS } from './config';
import type { ZooItem, ZooState, SegmentId, SegmentResult, FeedbackQuote } from './types';

// ---- builders ----
function exhibit(id: string, name: string, appeal: [number, number, number], capacity = 320, accessible = true): ZooItem {
  return { id, name, category: 'exhibit', appeal: { families: appeal[0], enthusiasts: appeal[1], comfortSeekers: appeal[2] }, capacity, accessible };
}
function amenity(id: string, name: string, services: 'food' | 'toilet' | 'rest', serviceCapacity = 500): ZooItem {
  return { id, name, category: 'amenity', services, serviceCapacity, accessible: true };
}
const zoo = (items: ZooItem[], sprintNumber = 1): ZooState => ({ items, sprintNumber });
const baseAtt = (): Record<SegmentId, number> => ({ families: DEFAULT_SEGMENTS[0].baseAttendance, enthusiasts: DEFAULT_SEGMENTS[1].baseAttendance, comfortSeekers: DEFAULT_SEGMENTS[2].baseAttendance });
const totalAtt = (a: Record<SegmentId, number>) => a.families + a.enthusiasts + a.comfortSeekers;

const POOL: ZooItem[] = [
  exhibit('penguins', 'Penguins', [8, 6, 6]),
  exhibit('lions', 'Lions', [7, 8, 6]),
  exhibit('reptiles', 'Reptile House', [5, 9, 4]),
  exhibit('meerkats', 'Meerkats', [8, 6, 7]),
  exhibit('aviary', 'Aviary', [6, 7, 7]),
  exhibit('insects', 'Insect World', [4, 7, 4]),
];
const CAFE = amenity('cafe', 'Cafe', 'food');
const WC = amenity('wc', 'Toilets', 'toilet');
const SEATING = amenity('seating', 'Seating', 'rest');

// ================= Acceptance tests (see the Visitor Simulation Spec) =================

describe('3. Feedback is honest', () => {
  function statMeetsThreshold(q: FeedbackQuote, seg: SegmentResult, exhibitCount: number): boolean {
    if (q.cause.startsWith('loved:')) return seg.topExhibit === q.cause.slice(6) && seg.topExhibitShare > 0.35;
    if (q.cause === 'unmet:food') return seg.unmetNeedRate.food > 0.2;
    if (q.cause === 'unmet:toilet') return seg.unmetNeedRate.toilet > 0.15;
    if (q.cause === 'unmet:rest') return seg.unmetNeedRate.rest > 0.15;
    if (q.cause === 'truncation') return seg.truncationRate > 0.3;
    if (q.cause === 'crowding') return seg.crowdingLoss > 0.25;
    if (q.cause === 'accessibility') return seg.segmentId === 'comfortSeekers' && seg.accessibilityLoss > 0.2;
    if (q.cause === 'thin') return exhibitCount < 3 && seg.happiness < 50;
    return false;
  }
  it('every emitted quote is justified by the stat named in its cause', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const n = 1 + (seed % 6);
      const items: ZooItem[] = POOL.slice(0, n).map((e, i) => (seed % 3 === 0 && i === 0 ? { ...e, accessible: false } : e));
      if (seed % 2 === 0) items.push(CAFE);
      if (seed % 4 === 0) items.push(WC);
      const res = simulateSprint(zoo(items), DEFAULT_CONFIG, baseAtt(), seed * 7919);
      const bySeg = new Map(res.segments.map((s) => [s.segmentId, s]));
      const exCount = items.filter((x) => x.category === 'exhibit').length;
      for (const q of res.quotes) expect(statMeetsThreshold(q, bySeg.get(q.segmentId)!, exCount)).toBe(true);
    }
  });
});

describe('4. Determinism', () => {
  it('same zoo, config, attendance and seed produce identical results', () => {
    const items = [POOL[0], POOL[1], POOL[2], CAFE, WC];
    const a = simulateSprint(zoo(items), DEFAULT_CONFIG, baseAtt(), 12345);
    const b = simulateSprint(zoo(items), DEFAULT_CONFIG, baseAtt(), 12345);
    expect(a).toEqual(b);
  });
});

describe('5. No script', () => {
  it('two games (different seeds), identical build, produce different quotes most of the time', () => {
    const items = POOL.slice(0, 5); // enough exhibits that taste jitter can reorder the favourite
    let differ = 0;
    for (let pair = 0; pair < 100; pair++) {
      const gA = pair * 2 + 1, gB = pair * 2 + 2;
      const rA = simulateSprint(zoo(jitterItems(items, DEFAULT_CONFIG, gA)), DEFAULT_CONFIG, driftAttendance(DEFAULT_CONFIG, gA), gA);
      const rB = simulateSprint(zoo(jitterItems(items, DEFAULT_CONFIG, gB)), DEFAULT_CONFIG, driftAttendance(DEFAULT_CONFIG, gB), gB);
      const seq = (r: typeof rA) => r.quotes.map((q) => q.cause + '|' + q.text).join(';;');
      if (seq(rA) !== seq(rB)) differ++;
    }
    expect(differ).toBeGreaterThanOrEqual(95);
  });
});

describe('1. Combinations beat piles', () => {
  it('4 exhibits + 2 amenities outscore 6 exhibits + 0 amenities on happiness', () => {
    const combo = [POOL[0], POOL[1], POOL[2], POOL[3], CAFE, WC];
    const pile = POOL.slice(0, 6);
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const c = simulateSprint(zoo(combo), DEFAULT_CONFIG, baseAtt(), seed * 131);
      const p = simulateSprint(zoo(pile), DEFAULT_CONFIG, baseAtt(), seed * 131);
      if (c.overallHappiness > p.overallHappiness) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(90);
  });
});

describe('2. Truncation is real', () => {
  it('removing all food raises Families truncation and cuts Families happiness', () => {
    const served = [POOL[0], POOL[1], POOL[2], POOL[3], CAFE, WC, SEATING];
    const noFood = [POOL[0], POOL[1], POOL[2], POOL[3], WC, SEATING];
    let sumTruncUp = 0, sumHapDrop = 0;
    const N = 40;
    for (let seed = 1; seed <= N; seed++) {
      const s = simulateSprint(zoo(served), DEFAULT_CONFIG, baseAtt(), seed * 977);
      const nf = simulateSprint(zoo(noFood), DEFAULT_CONFIG, baseAtt(), seed * 977);
      const sf = s.segments.find((x) => x.segmentId === 'families')!;
      const nff = nf.segments.find((x) => x.segmentId === 'families')!;
      sumTruncUp += nff.truncationRate;
      sumHapDrop += sf.happiness - nff.happiness;
    }
    expect(sumTruncUp / N).toBeGreaterThan(0.3);
    expect(sumHapDrop / N).toBeGreaterThanOrEqual(20);
  });
});

describe('6. Word of mouth compounds', () => {
  it('a great zoo grows attendance over 3 Sprints; a poor one shrinks it', () => {
    const great = [...POOL, CAFE, WC, SEATING];
    let att = baseAtt();
    const start = totalAtt(att);
    let lastH = 0;
    for (let s = 1; s <= 3; s++) {
      const r = simulateSprint(zoo(great, s), DEFAULT_CONFIG, att, s * 101);
      lastH = r.overallHappiness; att = r.nextAttendance;
    }
    expect(lastH).toBeGreaterThan(60);
    expect(totalAtt(att)).toBeGreaterThan(start * 1.15);

    const poor = [{ ...POOL[5] }]; // one weak exhibit, nothing served
    let att2 = baseAtt();
    const start2 = totalAtt(att2);
    for (let s = 1; s <= 3; s++) {
      const r = simulateSprint(zoo(poor, s), DEFAULT_CONFIG, att2, s * 103);
      att2 = r.nextAttendance;
    }
    expect(totalAtt(att2)).toBeLessThan(start2);
  });
});

describe('7. Crowding bites', () => {
  it('doubling attendance against fixed capacity lowers happiness', () => {
    const small = [exhibit('star', 'Star Attraction', [9, 9, 9], 200), exhibit('side', 'Side Show', [6, 6, 6], 200), CAFE, WC, SEATING];
    let worse = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const a = baseAtt();
      const a2 = { families: a.families * 2, enthusiasts: a.enthusiasts * 2, comfortSeekers: a.comfortSeekers * 2 };
      const one = simulateSprint(zoo(small), DEFAULT_CONFIG, a, seed * 311);
      const two = simulateSprint(zoo(small), DEFAULT_CONFIG, a2, seed * 311);
      if (two.overallHappiness < one.overallHappiness) worse++;
    }
    expect(worse).toBeGreaterThanOrEqual(38);
  });
});
