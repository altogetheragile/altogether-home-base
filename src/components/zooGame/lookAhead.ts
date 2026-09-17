import type { ZooGameState, PbiDraft, BacklogItem } from './types';
import { SIGNAL_NEEDS } from './signalNeeds';

// ============= The Product Owner looking ahead =============
//
// A Product Owner who only ever reacts is not doing half the job. Forecasting the Penguins means
// the Waterside is about to open, and a zone opens on three things - somewhere to see an animal, an
// animal to see, and a path to walk in on. Noticing the third one is missing BEFORE the Sprint ends
// is exactly the work: the Product Backlog is not a record of what has happened, it is what the Product
// Owner thinks the product needs next.
//
// So this reads the forecast and says what it implies. Deliberately not an AI call and deliberately
// not automatic:
//
//  - Not an AI call, because it runs every Sprint. A trainer in a room with no signal should still
//    get it, it should be the same every time so it can be taught, and a rule you can read is a
//    rule you can argue with. The AI Product Owner still exists for refining what is already there.
//  - Not automatic, because a Product Backlog that grows behind your back teaches that items simply appear.
//    Each one arrives as a proposal with its reason attached, and you accept it or you do not. That
//    is what a Product Owner does with a suggestion, and it is the decision worth practising.

/** Two things the Product Owner can suggest, because there are two ways a thing can be missing.
 *
 *  It is not in the Product Backlog at all - so write it. Or it IS, buried inside an area epic where it
 *  cannot be sized or pulled - so break the epic up. Offering to "add" the second one would put a
 *  second Waterside Paths in the Product Backlog beside the one already there, which is not help.
 */
export type Proposal =
  | { id: string; why: string; kind: 'add'; label: string; draft: PbiDraft }
  | { id: string; why: string; kind: 'split'; label: string; epicId: string; memberIds: string[] };

/** A real Product Backlog item - one you could refine, size and pull. */
const hasItem = (state: ZooGameState, match: (it: BacklogItem) => boolean) => state.backlog.some(match);

/** The epic hiding a thing like this, if one is. A member of an epic is in the Product Backlog in the sense
 *  that somebody has thought of it, and not in the sense that anyone can plan it. */
function hidingIn(state: ZooGameState, zone: string, kind: string): { epic: BacklogItem; memberIds: string[] } | null {
  for (const epic of state.backlog.filter((it) => it.category === 'epic' && it.zone === zone)) {
    const memberIds = (epic.epicMembers ?? []).filter((m) => m.kind === kind).map((m) => m.id);
    if (memberIds.length) return { epic, memberIds };
  }
  return null;
}

/** What is coming: this Sprint's forecast, and the top of the Product Backlog after it.
 *
 *  Only looking at the forecast made this almost silent, and looking only backwards is the habit
 *  worth breaking. A Product Owner who notices the Waterside needs paths on the day the Waterside
 *  Sprint ends has noticed too late; the point is to see it while there is still time to order it.
 *  The top of the Product Backlog is what the Product Owner expects to be next, so that is what to read.
 */
const HORIZON = 5;
const forecast = (state: ZooGameState) => {
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && it.status !== 'backlog');
  const next = state.backlog.filter((it) => it.status === 'backlog').slice(0, HORIZON);
  return [...committed, ...next];
};

/**
 * What the forecast implies. One proposal per thing noticed, most useful first.
 */
export function lookAhead(state: ZooGameState): Proposal[] {
  const declined = new Set(state.declinedProposals ?? []);
  const out: Proposal[] = [];
  const soon = forecast(state);

  // Two things an area used to be told it was missing, and neither is an item any more.
  //
  // A way in went first: a path that serves one habitat is one of that habitat's own acceptance
  // criteria ("can I walk to it from the way in?"), so proposing "<zone> Paths" would be proposing
  // a second item that has to be finished before the first is worth anything - the layer this game
  // exists to warn about.
  //
  // Planting has gone the same way. A habitat is asked "can I tell an animal lives here, not a
  // shed?", and the answer is ground, shelter, planting and water inside it. Proposing a planting
  // item was proposing the same work twice, and the Product Owner cannot help by ordering it again.
  //
  // What a Product Owner CAN usefully notice is a facility buried in an epic: it is real work,
  // somebody will want it, and while it is a member of an epic nobody can size it or pull it into
  // a Sprint. That is the proposal worth making, and splitting is the answer rather than writing a
  // second one beside it.
  const brings = (it: BacklogItem) => it.category === 'exhibit' || it.category === 'enclosure'
    || (it.category === 'epic' && (it.epicMembers ?? []).some((m) => m.kind === 'exhibit'));
  const zones = Array.from(new Set(soon.filter(brings).map((it) => it.zone)));
  for (const zone of zones) {
    const hidden = hidingIn(state, zone, 'amenity');
    if (!hidden) continue;
    const named = hidden.memberIds.length === 1 ? 'a facility' : `${hidden.memberIds.length} facilities`;
    out.push({
      id: `split:${zone}:facility`, kind: 'split', label: `Split ${zone}`,
      why: `${zone} is coming up and ${named} for it ${hidden.memberIds.length === 1 ? 'is' : 'are'} in the ${hidden.epic.name} epic, where nobody can size ${hidden.memberIds.length === 1 ? 'it' : 'them'} or pull ${hidden.memberIds.length === 1 ? 'it' : 'them'} into a Sprint.`,
      epicId: hidden.epic.id, memberIds: hidden.memberIds,
    });
  }

  // A zoo people stay in needs somewhere to eat and somewhere to go. Better raised before the
  // visitors complain than after - the signals already handle "after", and by then it has cost you.
  const exhibitsSoon = state.backlog.filter((it) => it.category === 'exhibit' && (it.status === 'open' || soon.includes(it))).length;

  // The needs, not the buildings. This used to propose a Kiosk and a Toilets block with their
  // services already set, which is the Product Owner writing the Developers' answer into their own
  // item - the same fault the Review's signals had, on the route the Product Owner drives.
  //
  // The same two needs the visitors would raise after the event, read from the same table. The only
  // difference is WHEN: raised here, nobody has had to queue for a sandwich first, and that is the
  // whole argument for a Product Owner who looks ahead.
  const wants: { services: 'food' | 'toilet'; cause: string; why: string }[] = [
    { services: 'food', cause: 'unmet:food', why: 'people who have walked round three exhibits want feeding, and there is nowhere to buy anything' },
    { services: 'toilet', cause: 'unmet:toilet', why: 'a family will cut a day short over this one, and there is nowhere to go' },
  ];
  if (exhibitsSoon >= 3) {
    for (const w of wants) {
      // Already served, or already asked for: a proposal for something that is on the Backlog under
      // another name is a proposal to write it twice.
      const need = SIGNAL_NEEDS[w.cause];
      if (hasItem(state, (it) => it.category === 'amenity' && it.services === w.services)) continue;
      if (hasItem(state, (it) => it.category === 'need' && it.name === need.name)) continue;
      out.push({
        id: `amenity:${w.services}`, kind: 'add', label: need.name,
        why: `The zoo will have ${exhibitsSoon} exhibits open - ${w.why}.`,
        draft: {
          name: need.name, category: 'need', zone: 'Facilities',
          story: `As ${need.story.as} I want ${need.story.want} so that ${need.story.soThat}`,
          acceptance: need.criteria,
        },
      });
    }
  }

  return out.filter((p) => !declined.has(p.id));
}
