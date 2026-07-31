import type {
  ZooState, ZooItem, SimulationConfig, SimulationResult, SegmentResult,
  VisitorSegment, SegmentId, NeedType,
} from './types';
import { makeRng, hashStr, type SeededRng } from './rng';
import { generateQuotes, generateSignals } from './feedback';

const NEEDS: NeedType[] = ['food', 'toilet', 'rest'];
const SEGMENT_IDS: SegmentId[] = ['families', 'enthusiasts', 'comfortSeekers'];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ============= Per-game variation (anti-scripting) =============
// Applied ONCE at game start, from a stable game seed, so a build that works in one
// game is not guaranteed in the next: the player must read the feedback, not recall
// a winning order. Within a game these are fixed, so learning still pays off.

/** Multiply each (exhibit, segment) appeal by a seeded factor in 1 +/- tasteJitter. */
export function jitterItems(items: ZooItem[], config: SimulationConfig, gameSeed: number): ZooItem[] {
  return items.map((it) => {
    if (it.category !== 'exhibit' || !it.appeal) return it;
    const appeal = { ...it.appeal };
    for (const sid of SEGMENT_IDS) {
      const r = makeRng(hashStr(it.id + ':' + sid, gameSeed)).next();
      appeal[sid] = clamp(appeal[sid] * (1 + (r * 2 - 1) * config.tasteJitter), 0, 10);
    }
    return { ...it, appeal };
  });
}

/** Drift each segment's base attendance by a seeded factor in 1 +/- attendanceDrift. */
export function driftAttendance(config: SimulationConfig, gameSeed: number): Record<SegmentId, number> {
  const out = {} as Record<SegmentId, number>;
  for (const seg of config.segments) {
    const r = makeRng(hashStr('att:' + seg.id, gameSeed)).next();
    out[seg.id] = Math.round(seg.baseAttendance * (1 + (r * 2 - 1) * config.attendanceDrift));
  }
  return out;
}

// ============= Crowding =============
// Popular exhibits get busy. Expected visits are shared across exhibits in
// proportion to their (attendance-weighted) appeal; an exhibit over its capacity
// loses joy per the crowding curve.

function computeCrowding(exhibits: ZooItem[], attendance: Record<string, number>, config: SimulationConfig): Record<string, number> {
  const mult: Record<string, number> = {};
  const totalVisits = config.segments.reduce((s, seg) => s + (attendance[seg.id] || 0) * Math.min(seg.timeBudget, Math.max(1, exhibits.length)), 0);
  let sumScore = 0;
  const score: Record<string, number> = {};
  for (const e of exhibits) {
    let sc = 0;
    for (const seg of config.segments) sc += (attendance[seg.id] || 0) * (e.appeal ? e.appeal[seg.id] : 0);
    score[e.id] = sc; sumScore += sc;
  }
  for (const e of exhibits) {
    if (!e.capacity || sumScore <= 0) { mult[e.id] = 1; continue; }
    const expectedVisits = totalVisits * (score[e.id] / sumScore);
    mult[e.id] = config.crowdingCurve(expectedVisits / e.capacity);
  }
  return mult;
}

// ============= One segment's cohort =============

interface NeedPool { remaining: Record<NeedType, number>; }

function makeNeedPools(amenities: ZooItem[]): NeedPool {
  const remaining = { food: 0, toilet: 0, rest: 0 } as Record<NeedType, number>;
  for (const a of amenities) if (a.services && a.serviceCapacity) remaining[a.services] += a.serviceCapacity;
  return { remaining };
}

function simulateSegment(
  seg: VisitorSegment, exhibits: ZooItem[], crowd: Record<string, number>,
  pools: NeedPool, attendance: number, config: SimulationConfig, rng: SeededRng,
): SegmentResult {
  const sample = config.cohortSampleSize;
  const scale = attendance / sample;
  const joyByExhibit: Record<string, number> = {};
  const unmetScaled = { food: 0, toilet: 0, rest: 0 } as Record<NeedType, number>;
  const unmetEvents = { food: 0, toilet: 0, rest: 0 } as Record<NeedType, number>;
  let sumHappiness = 0, truncated = 0, visits = 0, potentialJoy = 0, crowdLoss = 0, accessLoss = 0;

  for (let v = 0; v < sample; v++) {
    let time = seg.timeBudget, joy = 0, leftEarly = false;
    const seen = new Set<string>();
    while (time > 0) {
      // Choose the most appealing exhibit not yet visited.
      let best: ZooItem | null = null, bestA = -1;
      for (const e of exhibits) {
        if (seen.has(e.id)) continue;
        const a = e.appeal ? e.appeal[seg.id] : 0;
        if (a > bestA) { bestA = a; best = e; }
      }
      if (!best) break; // seen everything: leave contentedly
      seen.add(best.id); time -= 1;
      const cm = crowd[best.id] ?? 1;
      const am = seg.id === 'comfortSeekers' && !best.accessible ? config.accessibilityPenalty : 1;
      const gain = bestA * cm * am;
      joy += gain; visits += 1; potentialJoy += bestA;
      joyByExhibit[best.id] = (joyByExhibit[best.id] || 0) + gain;
      crowdLoss += bestA * (1 - cm);
      accessLoss += bestA * cm * (1 - am);

      for (const need of NEEDS) {
        if (rng.next() >= seg.needRates[need]) continue;
        if (pools.remaining[need] > 0) {
          pools.remaining[need] -= scale; time -= config.needServiceTimeCost; // served
        } else {
          joy -= config.unmetNeedHappinessPenalty;
          unmetScaled[need] += scale; unmetEvents[need] += 1;
          if (rng.next() < config.unmetNeedLeaveChance) { leftEarly = true; break; }
        }
      }
      if (leftEarly) { truncated += 1; break; }
    }
    sumHappiness += clamp((100 * joy) / (seg.timeBudget * config.referenceAppeal), 0, 100);
  }

  let topExhibit: string | null = null, topJoy = 0, sumJoy = 0;
  for (const e of exhibits) { const j = joyByExhibit[e.id] || 0; sumJoy += j; if (j > topJoy) { topJoy = j; topExhibit = e.name; } }
  const rate = (n: NeedType) => (visits > 0 ? unmetEvents[n] / visits : 0);

  return {
    segmentId: seg.id, attendance, happiness: Math.round(sumHappiness / sample),
    topExhibit, topExhibitShare: sumJoy > 0 ? topJoy / sumJoy : 0,
    truncationRate: truncated / sample,
    unmetNeeds: unmetScaled, unmetNeedRate: { food: rate('food'), toilet: rate('toilet'), rest: rate('rest') },
    crowdingLoss: potentialJoy > 0 ? crowdLoss / potentialJoy : 0,
    accessibilityLoss: potentialJoy > 0 ? accessLoss / potentialJoy : 0,
    visits,
  };
}

// ============= Entry point =============

/** Simulate one Sprint's worth of visits. Pure and deterministic given the seed. */
export function simulateSprint(
  zoo: ZooState, config: SimulationConfig, attendance: Record<SegmentId, number>, seed: number,
): SimulationResult {
  const rng = makeRng(seed);
  const exhibits = zoo.items.filter((i) => i.category === 'exhibit');
  const amenities = zoo.items.filter((i) => i.category === 'amenity');
  const crowd = computeCrowding(exhibits, attendance, config);
  const pools = makeNeedPools(amenities);

  const segments = config.segments.map((seg) => simulateSegment(seg, exhibits, crowd, pools, attendance[seg.id] || 0, config, rng));
  const totalAttendance = config.segments.reduce((s, seg) => s + (attendance[seg.id] || 0), 0);
  const overallHappiness = totalAttendance > 0
    ? Math.round(segments.reduce((s, r) => s + r.happiness * r.attendance, 0) / totalAttendance) : 0;

  const nextAttendance = {} as Record<SegmentId, number>;
  for (const seg of config.segments) {
    const r = segments.find((x) => x.segmentId === seg.id)!;
    const grown = (attendance[seg.id] || 0) * (1 + config.wordOfMouthWeight * (r.happiness - 50) / 50);
    nextAttendance[seg.id] = Math.round(Math.max(seg.baseAttendance * config.wordOfMouthFloor, grown));
  }

  const quotes = generateQuotes(segments, exhibits.length, rng);
  const signals = generateSignals(segments, config);

  return { sprintNumber: zoo.sprintNumber, totalAttendance, overallHappiness, segments, quotes, signals, nextAttendance };
}
