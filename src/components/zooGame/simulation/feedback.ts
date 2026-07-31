import type { SegmentResult, FeedbackQuote, Signal, SimulationConfig, NeedType } from './types';
import type { SeededRng } from './rng';

// Feedback is templated from the stats, never free-typed. A quote only exists when
// the stat named in its `cause` crosses its threshold (acceptance test 3 checks
// this). Each cause has a few phrasings, chosen by the RNG, so repeat playthroughs
// read differently even when the cause is the same.

interface Candidate {
  segmentId: SegmentResult['segmentId'];
  cause: string;
  severity: FeedbackQuote['severity'];
  magnitude: number;
  phrasings: string[];
}

function candidatesFor(r: SegmentResult): Candidate[] {
  const out: Candidate[] = [];
  const seg = r.segmentId;
  if (r.topExhibit && r.topExhibitShare > 0.35) {
    out.push({ segmentId: seg, cause: 'loved:' + r.topExhibit, severity: 'praise', magnitude: r.topExhibitShare,
      phrasings: [`The ${r.topExhibit} was the highlight of our day.`, `We could have watched the ${r.topExhibit} for hours.`, `The ${r.topExhibit} alone was worth the trip.`] });
  }
  if (r.unmetNeedRate.food > 0.2) {
    out.push({ segmentId: seg, cause: 'unmet:food', severity: 'gripe', magnitude: r.unmetNeedRate.food,
      phrasings: ['Lovely morning, but we left at lunchtime. Nowhere to eat.', 'We got hungry and there was nothing to eat, so we headed off.', 'A good visit cut short - not a scrap of food anywhere.'] });
  }
  if (r.unmetNeedRate.toilet > 0.15) {
    out.push({ segmentId: seg, cause: 'unmet:toilet', severity: 'gripe', magnitude: r.unmetNeedRate.toilet,
      phrasings: ['We spent half the visit looking for a toilet.', 'Not enough toilets - a real problem with little ones.', 'Desperate for a loo and could not find one.'] });
  }
  if (r.unmetNeedRate.rest > 0.15) {
    out.push({ segmentId: seg, cause: 'unmet:rest', severity: 'gripe', magnitude: r.unmetNeedRate.rest,
      phrasings: ['Wonderful animals, but nowhere to sit down.', 'We tired out fast - hardly a bench in sight.', 'My feet were aching; there was nowhere to rest.'] });
  }
  if (r.truncationRate > 0.3) {
    out.push({ segmentId: seg, cause: 'truncation', severity: 'warning', magnitude: r.truncationRate,
      phrasings: ['We did not stay as long as we wanted to.', 'We left earlier than planned, sadly.', 'Something kept cutting our visit short.'] });
  }
  if (r.crowdingLoss > 0.25) {
    out.push({ segmentId: seg, cause: 'crowding', severity: 'warning', magnitude: r.crowdingLoss,
      phrasings: ['The queues rather spoiled it.', 'Too packed to see much at the popular exhibits.', 'Shame about the crowds around the best animals.'] });
  }
  if (seg === 'comfortSeekers' && r.accessibilityLoss > 0.2) {
    out.push({ segmentId: seg, cause: 'accessibility', severity: 'gripe', magnitude: r.accessibilityLoss,
      phrasings: ['My mother could not get near the lions.', 'Hard going for anyone less steady on their feet.', 'Not easy to reach some of the enclosures.'] });
  }
  return out;
}

function pick(rng: SeededRng, arr: string[]): string { return arr[Math.floor(rng.next() * arr.length)]; }
const RANK: Record<FeedbackQuote['severity'], number> = { warning: 3, gripe: 2, praise: 1 };

/** At most 3 quotes, at most one per segment where possible, worst problems first. */
export function generateQuotes(segResults: SegmentResult[], exhibitCount: number, rng: SeededRng): FeedbackQuote[] {
  let cands: Candidate[] = [];
  for (const r of segResults) cands = cands.concat(candidatesFor(r));
  // "Not much to see yet" when the zoo is thin and no one is happy.
  const thin = segResults.filter((r) => r.happiness < 50);
  if (exhibitCount < 3 && thin.length) {
    const worst = thin.slice().sort((a, b) => a.happiness - b.happiness)[0];
    cands.push({ segmentId: worst.segmentId, cause: 'thin', severity: 'warning', magnitude: (50 - worst.happiness) / 50,
      phrasings: ['Not much to see yet, is there?', 'A bit thin on the ground so far.', 'We were through it in no time - needs more.'] });
  }
  cands.sort((a, b) => RANK[b.severity] - RANK[a.severity] || b.magnitude - a.magnitude);

  const chosen: Candidate[] = [];
  const usedSeg = new Set<string>();
  for (const c of cands) { if (chosen.length >= 3) break; if (usedSeg.has(c.segmentId)) continue; chosen.push(c); usedSeg.add(c.segmentId); }
  for (const c of cands) { if (chosen.length >= 3) break; if (!chosen.includes(c)) chosen.push(c); }

  return chosen.map((c) => ({ segmentId: c.segmentId, cause: c.cause, severity: c.severity, text: pick(rng, c.phrasings) }));
}

const NEED_SIGNAL: Record<NeedType, { suggestion: string; driver: string }> = {
  food: { suggestion: 'Add somewhere to eat (a cafe or kiosk)', driver: 'unmet:food' },
  toilet: { suggestion: 'Build more toilets', driver: 'unmet:toilet' },
  rest: { suggestion: 'Add seating and shade', driver: 'unmet:rest' },
};

/** At most 2 signals, from the two largest unmet-need or crowding stats. */
export function generateSignals(segResults: SegmentResult[], _config: SimulationConfig): Signal[] {
  const scored: { magnitude: number; suggestion: string; driver: string }[] = [];
  (['food', 'toilet', 'rest'] as NeedType[]).forEach((need) => {
    const total = segResults.reduce((s, r) => s + r.unmetNeeds[need], 0);
    const rate = segResults.reduce((s, r) => Math.max(s, r.unmetNeedRate[need]), 0);
    if (total > 0) scored.push({ magnitude: rate, suggestion: NEED_SIGNAL[need].suggestion, driver: NEED_SIGNAL[need].driver });
  });
  const crowd = segResults.reduce((s, r) => Math.max(s, r.crowdingLoss), 0);
  if (crowd > 0.2) scored.push({ magnitude: crowd, suggestion: 'Ease crowding (more capacity, or a second viewing area)', driver: 'crowding' });

  scored.sort((a, b) => b.magnitude - a.magnitude);
  return scored.slice(0, 2).map((s) => ({
    suggestion: s.suggestion,
    drivenBy: s.driver,
    estimatedValue: s.magnitude > 0.45 ? 'high' : s.magnitude > 0.2 ? 'medium' : 'low',
  }));
}
