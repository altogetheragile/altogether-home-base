import type { ZooGameState, BacklogItem } from './types';
import { designCriteria, presetFor } from './design';
import { isSignOffTask } from './engine';
import { pathReaches, inHabitat } from './parkChecks';

// ============= What the park can see about the Definition of Done =============
//
// The Definition of Done is the Scrum Team's agreement, written by them and refined whenever they
// inspect it. The game does not get to edit it, second-guess it or refuse a line.
//
// What it can do is answer the lines that are facts about the park, the same way it already
// answers half of every item's acceptance criteria. "Peer-reviewed by another Developer" is not a
// matter of taste: either a second Developer picked the item up or nobody did. "Safe and accessible
// to all visitors" is the same question the visitors' pathfinding already answers. The rest -
// whether it is on-brand, whether there are defects nobody has found - stay the team's word,
// because pretending to measure them would be worse than leaving them alone.
//
// That split is the teaching, and it is the same one the acceptance criteria carry: a criterion
// nobody can check is a criterion taken on trust. A Definition of Done full of them is a wish.
//
// This file only READS. Nothing here gates anything: an item reaches Done today exactly as it did
// before it existed. Saying what the park can see comes first, because it teaches the split before
// it costs anybody a Sprint.

export type DodAnswer =
  /** The park looked, and this is what it saw. */
  | { kind: 'fact'; met: boolean; evidence: string }
  /** True of some items and meaningless for this one - a kiosk has no fence to make escape-proof. */
  | { kind: 'na'; evidence: string };

const norm = (line: string) => line.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');

const devs = (item: BacklogItem) => (item.assignedDevs ?? []).length;

/** The park's answer to one Definition of Done line for one item, or null when the line is the
 *  team's judgement rather than anything the park can see.
 *
 *  Matched on the wording, because the DoD is free text a team writes and rewrites. A line that
 *  matches nothing is judgement, which is the safe direction to be wrong in: the game stays quiet
 *  rather than claiming to have checked something it has not. */
export function checkDodLine(state: ZooGameState, item: BacklogItem, line: string): DodAnswer | null {
  const s = norm(line);
  const design = item.design ?? item.draftDesign ?? presetFor(item);

  // The item's own acceptance criteria, which the DoD nearly always points at.
  if (/acceptance criteri/.test(s)) {
    const acs = item.acceptance ?? [];
    const met = acs.filter((_, i) => !!item.acConfirmed?.[i]).length;
    if (!acs.length) return { kind: 'na', evidence: 'no criteria on this one' };
    return { kind: 'fact', met: met === acs.length, evidence: `${met} of ${acs.length} accepted` };
  }

  // The Product Owner's sign-off. Derived from the criteria rather than clicked, so this reads the
  // same fact the card does.
  if (/sign ?off|approved by the (po|product owner)/.test(s)) {
    const task = (item.tasks ?? []).find((t) => isSignOffTask(t.label));
    if (!task) return { kind: 'na', evidence: 'no sign-off on this one' };
    return { kind: 'fact', met: task.done, evidence: task.done ? 'signed off' : 'waiting on the Product Owner' };
  }

  // Standing where it will stand. An animal has no place of its own - it lives inside its
  // enclosure - so for an exhibit this is the same question as "can I find them in their habitat?",
  // asked of the same park. `placed` alone was too literal: it is only set by asking the park to
  // show you an item, so work the Developers built exactly where it belongs read as "not placed".
  if (/placed|on the park/.test(s)) {
    if (item.category === 'exhibit') {
      const v = inHabitat(state, item);
      return { kind: 'fact', met: v.met, evidence: v.evidence };
    }
    const put = !!item.placed || !!item.pos;
    return { kind: 'fact', met: put, evidence: put ? 'standing on the park' : 'not placed yet' };
  }

  // A second pair of hands. This is the one line in the shipped library that nothing in the game
  // has ever looked at, and the park can see it exactly: who picked the item up.
  if (/peer.?review|another developer|reviewed by/.test(s)) {
    const n = devs(item);
    return { kind: 'fact', met: n > 1,
      evidence: n > 1 ? `${n} Developers worked it` : n === 1 ? 'one Developer worked it alone' : 'nobody picked it up' };
  }

  // Finished as a build: every criterion the studio sets for this kind of thing.
  if (/fully finished|no gaps|every part built/.test(s)) {
    const cs = designCriteria(item, design);
    if (!cs.length) return { kind: 'na', evidence: 'nothing to build on this one' };
    const met = cs.filter((c) => c.pass).length;
    return { kind: 'fact', met: met === cs.length, evidence: `${met} of ${cs.length} build criteria met` };
  }

  // Signage, so a visitor can find the thing. A building carries its own; everything else depends
  // on there being a signpost standing in its zone.
  if (/signpost|signage|find it|signed so/.test(s)) {
    if (item.category === 'amenity') {
      const signed = design.parts.sign !== 'off' && !!design.colors.sign;
      return { kind: 'fact', met: signed, evidence: signed ? 'has a sign over the front' : 'no sign on it' };
    }
    const post = state.backlog.find((i) => i.zone === item.zone && i.template === 'signpost'
      && (i.status === 'open' || i.status === 'done'));
    return { kind: 'fact', met: !!post, evidence: post ? `${post.name} stands in ${item.zone}` : `nothing signposts ${item.zone}` };
  }

  // Escape-proof, which is a question about a habitat and about nothing else.
  if (/escape|secure/.test(s)) {
    if (item.category !== 'enclosure') return { kind: 'na', evidence: 'nothing here to fence' };
    const fenced = !!design.colors.fence;
    return { kind: 'fact', met: fenced, evidence: fenced ? 'fenced' : 'no fence chosen' };
  }

  // Reachable on foot. The visitors' own pathfinding answers this, so the DoD and the item's
  // acceptance criteria cannot disagree about the same park.
  if (/accessible|crossing the grass|walk to|reachable/.test(s)) {
    const v = pathReaches(state, item);
    return { kind: 'fact', met: v.met, evidence: v.evidence };
  }

  // A team that writes releasing into its Definition of Done. Answered, because it is a plain fact
  // about the park, and only answered: making Done wait on it closes a circle (Done needs open,
  // open needs the sign-off, the sign-off needs Done) that has to be untied deliberately.
  if (/open to visitors|released|goes live|is live/.test(s)) {
    const open = item.status === 'open';
    return { kind: 'fact', met: open, evidence: open ? 'open to visitors' : 'not open yet' };
  }

  return null;   // judgement: the team's word, and rightly
}

/** Whether the park can answer this line at all, from the wording alone.
 *
 *  Wording alone, because the Definition of Done editor has no item in front of it: the team is
 *  agreeing a bar for everything, and what they want to know while they write it is which lines
 *  the game will read and which are theirs to hold each other to. */
export function dodKind(line: string): 'fact' | 'judgement' {
  return checkDodLine(PROBE_STATE, PROBE_ITEM, line) === null ? 'judgement' : 'fact';
}

// A one-item park to ask the wording against. Nothing is read from it except the shape of the
// answer, so it only has to exist.
const PROBE_ITEM = {
  id: '', name: '', zone: '', category: 'enclosure', status: 'backlog',
  estimate: 0, acceptance: [], acConfirmed: [], tasks: [{ id: 's', label: 'Get the PO’s sign-off', done: false }],
} as unknown as BacklogItem;
const PROBE_STATE = { backlog: [], connectors: [] } as unknown as ZooGameState;

/** Every line of the agreed Definition of Done, with the park's answer where it has one. */
export function dodVerdicts(state: ZooGameState, item: BacklogItem): { line: string; answer: DodAnswer | null }[] {
  return (state.definitionOfDone ?? []).filter((l) => l.trim())
    .map((line) => ({ line, answer: checkDodLine(state, item, line) }));
}
