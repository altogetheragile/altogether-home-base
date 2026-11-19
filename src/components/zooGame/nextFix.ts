import type { ZooGameState, BacklogItem } from './types';
import { whatIsLeft } from './engine';
import { inspect, answerable, checkCriterion, criterionFor } from './parkChecks';
import { groupsFor, labelOf, type GroupId } from './buildGroups';

// ============= What to fix next, and where =============
//
// From the scrum-master playtest (sm6): about seventy steps on a card that said "Next: accept 2 more
// criteria". Two things the park checks were failing - a 2m fence round a lion, and no shelter in the
// habitat - and both are fixed by changing the build. "Accept" read as something you click, so the
// persona pressed "Pick it up" twenty times and re-chose the same size and colour hoping one would
// count. The card now says what the park found and which control on the build strip changes it.

export interface Fix {
  /** The criterion as written on the card. */
  label: string;
  /** What the park found, in its own words. */
  evidence: string;
  /** The build strip's control that changes the answer, when there is one. */
  group: GroupId | null;
  /** That control's name, as the strip shows it. */
  where: string | null;
}

/** The first criterion the park answers no to, with where to change it; null when nothing fails. */
export function whatToFix(state: ZooGameState, item: BacklogItem): Fix | null {
  // Read off what is being built, committed or not: a build the park says fails is never committed,
  // so asking for `item.design` here found nothing to fix on exactly the cards that needed it.
  const { criteria, met } = inspect(state, item);
  for (let i = 0; i < criteria.length; i += 1) {
    const label = criteria[i];
    if (met(label, i) || !answerable(label)) continue;
    const verdict = checkCriterion(state, item, label);
    if (!verdict || verdict.met) continue;
    const id = criterionFor(label)?.id ?? '';
    const g = groupsFor(item).find((x) => x.meets.includes(id)) ?? null;
    return { label, evidence: verdict.evidence, group: g?.id ?? null, where: g ? labelOf(g, item) : null };
  }
  return null;
}

/** The card's next step, naming what fails and where to fix it rather than "accept N more". */
export function nextStep(state: ZooGameState, item: BacklogItem): string {
  const generic = whatIsLeft(state, item);
  if (!/^Next: accept /.test(generic)) return generic;
  const fix = whatToFix(state, item);
  if (fix) {
    // Most findings already say where ("- say so under Offers"); the rest get the control named.
    const where = fix.where && !/\bunder\b/i.test(fix.evidence) ? `. Change it under ${fix.where}` : '';
    return `Next: ${fix.evidence}${where}`;
  }
  // Nothing fails; what is open is somebody's judgement, and that is what asking is for.
  const po = state.team.productOwner.name.replace(/\s*\(PO\)$/i, '');
  return `Next: ask ${po} to check it`;
}

// "Carry on building" opens the build strip on the control that fixes it. The card dialog and the
// strip are far apart in the tree, so the request is left here and taken once by the strip when it
// shows that item. One at a time; a newer request replaces an older one.
let wanted: { id: string; group: GroupId } | null = null;
export function openWhenShown(id: string, group: GroupId | null): void {
  wanted = group ? { id, group } : null;
}
export function takeWanted(id: string | undefined): GroupId | null {
  if (!wanted || wanted.id !== id) return null;
  const g = wanted.group;
  wanted = null;
  return g;
}
