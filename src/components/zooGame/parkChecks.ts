import type { ZooGameState, BacklogItem } from './types';
import { groupSize, hasRoomToRoam, presetFor } from './design';
import { settleStatus } from './engine';
import { whereItStands } from './parkModel';

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

/** Whether an animal is living in a habitat that exists, and what the park saw.
 *
 *  Exported for the same reason as `pathReaches`: an animal's own criterion asks it, and so does a
 *  Definition of Done line about a thing standing where it will stand. An exhibit has no position
 *  of its own - it lives inside its enclosure - so "is it placed?" is this question for an animal. */
export function inHabitat(state: ZooGameState, item: BacklogItem): Verdict {
  const home = state.backlog.find((i) => i.id === item.enclosureId);
  // Built is built. `placed` is only set when somebody asks the park to show them an item, so it
  // says "a human looked at this", not "this exists" - and an animal in a habitat the Developers
  // had built could never satisfy its own criterion because nobody had clicked "show me on the
  // park". The park draws every Done habitat, wherever it decided to put it.
  const built = home && (home.status === 'open' || home.status === 'done');
  return built
    ? { met: true, evidence: `in the ${home.name}` }
    : { met: false, evidence: home ? `the ${home.name} is not built yet` : 'no habitat to go in' };
}

/** Whether a path run reaches anything in this item's zone, and what the park saw.
 *
 *  Exported because more than one agreement asks it: the item's own "can I get to this zone
 *  without crossing the grass?", and a Definition of Done line about the zoo being accessible.
 *  One implementation, so the two can never disagree about the same park. */
export function pathReaches(state: ZooGameState, item: BacklogItem): Verdict | null {

    // A path run reaches something in this zone - either snapped to it, or laid up against it.
    //
    // Only counting the snapped ones was wrong, and wrong in the worst direction: a run drawn right
    // up to a habitat but finishing on the grass beside it counted for nothing, so the criterion
    // said "no path reaches anything here" about a path that plainly did - and because the park
    // answers this one, there was no way to say otherwise. A measurement you cannot argue with had
    // better be right.
    const here = state.backlog.filter((i) => i.zone === item.zone);
    const ids = new Set(here.map((i) => i.id));
    const NEAR = 110; // design px - about half the diagonal of the largest habitat
    // Where things ARE, which is the park's answer and not the item's own field: most of the zoo
    // has never been dragged anywhere, so it has no position of its own and is laid out with
    // everything else. Reading the field alone said "nothing here to reach" about a zone full of
    // habitats.
    const at = (i: BacklogItem) => i.pos ?? whereItStands(state, i);
    let reachedId: string | undefined;
    for (const c of state.connectors ?? []) {
      for (const end of [c.a, c.b]) {
        if (end.featureId && ids.has(end.featureId)) { reachedId = end.featureId; break; }
        const closest = here.find((i) => {
          const p = at(i);
          return p && Math.hypot(p.x - end.x, p.y - end.y) <= NEAR;
        });
        if (closest) { reachedId = closest.id; break; }
      }
      if (reachedId) break;
    }
    if (reachedId) return { met: true, evidence: `a path runs to the ${named(state, reachedId)}` };
    // What is missing, not merely that something is. The park answers this one, so the player
    // cannot tick it and move on - which makes "no" without a way forward a dead end rather than a
    // criterion. Name the thing to run a path to.
    const target = here.find((i) => i.category === 'enclosure') ?? here.find((i) => at(i));
    // Nothing standing in this zone at all. "Can I get to it without crossing the grass?" is not
    // a measurement about an empty field - there is nothing there to reach and nothing to fail -
    // so it goes back to being a judgement, like every other criterion the park cannot answer.
    if (!target) return null;
    return { met: false, evidence: `draw a run up to the ${target.name}` };
}

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

  if (label === 'Can I find them in their habitat?') return inHabitat(state, item);

  if (label === 'Can I get to this zone without crossing the grass?') return pathReaches(state, item);

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
    // The Product Owner's sign-off is DERIVED from the criteria, so anything that moves a criterion
    // has to move the sign-off with it - and the sign-off is what Done waits for, so it has to
    // move the card too. Ticking the last one by hand did all three; the park answering the last
    // one did the first, so a path with every criterion green and its plan ticked sat in Doing
    // for the rest of the Sprint with nothing left to do to it.
    return settleStatus({ ...item, acConfirmed: next });
  });
  return changed ? { ...state, backlog } : state;
}
