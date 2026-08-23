import type { ZooGameState, BacklogItem } from './types';
import { groupSize, hasRoomToRoam, presetFor } from './design';

// ============= The criteria the park can answer for itself =============
//
// Writing every acceptance criterion as a question turned out to pay a dividend nobody was aiming
// for: half of them stopped being opinions. "Can I get to this zone without crossing the grass?" is
// not a matter of taste - the park either has a path running to it or it does not, and the park
// knows which.
//
// So it answers those itself, and shows its working. They are not tick boxes any more: a fact is
// not something you agree to. The rest stay the Product Owner's, because they are judgement -
// whether a habitat looks like somewhere an animal would live is not a measurement, and pretending
// it is would be worse than leaving it alone.
//
// That split is the point, and it is true of real acceptance criteria too. A team that treats every
// criterion as testable ends up gaming its own tests; a team that treats none of them as testable
// argues about facts. Both halves are on the card, told apart at a glance.

export interface Verdict {
  met: boolean;
  /** What the park saw. Shown beside the criterion, because "no" without a reason is a shrug. */
  evidence: string;
}

const named = (state: ZooGameState, id?: string) => state.backlog.find((i) => i.id === id)?.name;

/** The park's answer to one criterion, or null when it is a matter of judgement. */
export function checkCriterion(state: ZooGameState, item: BacklogItem, label: string): Verdict | null {
  const design = item.design ?? item.draftDesign ?? presetFor(item);

  if (label === 'Can I see a group rather than one animal on its own?') {
    const n = groupSize(design.group);
    return { met: n > 1, evidence: n > 1 ? `${n} of them` : 'one on its own' };
  }

  if (label === 'Can I fit them in the habitat with room to spare?') {
    const size = item.enclosureSize;
    const n = groupSize(design.group);
    if (!design.group) return { met: false, evidence: 'not stocked yet' };
    return {
      met: hasRoomToRoam(design.group, size),
      evidence: `${n} in ${size === 'large' ? 'a large' : size === 'small' ? 'a small' : 'a medium'} habitat`,
    };
  }

  if (label === 'Can I find them in their habitat?') {
    const home = state.backlog.find((i) => i.id === item.enclosureId);
    const built = home && (home.status === 'open' || (home.status === 'done' && home.placed));
    return built
      ? { met: true, evidence: `in the ${home.name}` }
      : { met: false, evidence: home ? `the ${home.name} is not built yet` : 'no habitat to go in' };
  }

  if (label === 'Can I get to this zone without crossing the grass?') {
    // A path runs to something in this zone. The visitors walk the connectors, so a zone nothing
    // connects to is a zone they cannot reach, whatever else has been delivered there.
    const here = new Set(state.backlog.filter((i) => i.zone === item.zone).map((i) => i.id));
    const reached = (state.connectors ?? []).flatMap((c) => [c.a.featureId, c.b.featureId])
      .filter((id): id is string => !!id && here.has(id));
    const first = named(state, reached[0]);
    return reached.length
      ? { met: true, evidence: `a path runs to the ${first}` }
      : { met: false, evidence: 'no path reaches anything here' };
  }

  return null; // judgement: yours to make
}

/** Every criterion on an item, with the park's answer where it has one. */
export function verdicts(state: ZooGameState, item: BacklogItem): (Verdict | null)[] {
  return (item.acceptance ?? []).map((label) => checkCriterion(state, item, label));
}

/** Whether the park is the one answering this criterion. */
export const isChecked = (state: ZooGameState, item: BacklogItem, label: string): boolean =>
  checkCriterion(state, item, label) !== null;

/** Write the park's answers into the item, so everything downstream - the sign-off, the Done gate,
 *  the pips on the card - reads one list and does not have to know which half is which.
 *
 *  It overwrites: a checked criterion is a fact, and a fact you ticked yesterday can stop being
 *  true today. Move the last path away from a zone and the criterion unticks itself, the sign-off
 *  comes off, and the card cannot go to Done - which is the behaviour you would want from a build
 *  that reruns its tests.
 */
export function applyParkChecks(state: ZooGameState): ZooGameState {
  let changed = false;
  const backlog = state.backlog.map((item) => {
    const acs = item.acceptance ?? [];
    if (!acs.length) return item;
    let touched = false;
    const next = [...(item.acConfirmed ?? [])];
    acs.forEach((label, i) => {
      const v = checkCriterion(state, item, label);
      if (!v) return;
      if (next[i] !== v.met) { next[i] = v.met; touched = true; }
    });
    if (!touched) return item;
    changed = true;
    return { ...item, acConfirmed: next };
  });
  return changed ? { ...state, backlog } : state;
}
