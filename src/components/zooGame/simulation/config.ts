import type { SimulationConfig, VisitorSegment } from './types';

// Tuning defaults. Expect these to change: that is what the emergence acceptance
// tests are for. Families are hungry and need the toilet often; Comfort Seekers
// need to rest and are the ones who suffer at inaccessible exhibits; Enthusiasts
// are hardy and mostly want good animals.
export const DEFAULT_SEGMENTS: VisitorSegment[] = [
  { id: 'families', label: 'Families', baseAttendance: 220, timeBudget: 8, needRates: { food: 0.18, toilet: 0.12, rest: 0.05 } },
  { id: 'enthusiasts', label: 'Enthusiasts', baseAttendance: 150, timeBudget: 8, needRates: { food: 0.07, toilet: 0.06, rest: 0.04 } },
  { id: 'comfortSeekers', label: 'Comfort Seekers', baseAttendance: 130, timeBudget: 8, needRates: { food: 0.09, toilet: 0.09, rest: 0.14 } },
];

/** v1 crowding curve: full joy up to capacity, falling linearly to 0.5 at 3x. */
export function defaultCrowdingCurve(load: number): number {
  if (load <= 1) return 1;
  if (load >= 3) return 0.5;
  return 1 - (load - 1) * 0.25;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  segments: DEFAULT_SEGMENTS,
  cohortSampleSize: 50,
  needServiceTimeCost: 0.5,
  unmetNeedHappinessPenalty: 15,
  unmetNeedLeaveChance: 0.55,
  accessibilityPenalty: 0.4,
  crowdingCurve: defaultCrowdingCurve,
  wordOfMouthWeight: 0.3,
  wordOfMouthFloor: 0.4,
  tasteJitter: 0.15,
  attendanceDrift: 0.2,
  referenceAppeal: 5.5,
};

export function baseAttendance(config: SimulationConfig): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of config.segments) out[s.id] = s.baseAttendance;
  return out;
}
