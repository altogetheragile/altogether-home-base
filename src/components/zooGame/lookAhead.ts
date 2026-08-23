import type { ZooGameState, PbiDraft, BacklogItem } from './types';
import { floraAcceptance, pathAcceptance, amenityAcceptance } from './design';

// ============= The Product Owner looking ahead =============
//
// A Product Owner who only ever reacts is not doing half the job. Forecasting the Penguins means
// the Waterside is about to open, and a zone opens on three things - somewhere to see an animal, an
// animal to see, and a path to walk in on. Noticing the third one is missing BEFORE the Sprint ends
// is exactly the work: the Backlog is not a record of what has happened, it is what the Product
// Owner thinks the product needs next.
//
// So this reads the forecast and says what it implies. Deliberately not an AI call and deliberately
// not automatic:
//
//  - Not an AI call, because it runs every Sprint. A trainer in a room with no signal should still
//    get it, it should be the same every time so it can be taught, and a rule you can read is a
//    rule you can argue with. The AI Product Owner still exists for refining what is already there.
//  - Not automatic, because a Backlog that grows behind your back teaches that items simply appear.
//    Each one arrives as a proposal with its reason attached, and you accept it or you do not. That
//    is what a Product Owner does with a suggestion, and it is the decision worth practising.

/** Two things the Product Owner can suggest, because there are two ways a thing can be missing.
 *
 *  It is not in the Backlog at all - so write it. Or it IS, buried inside an area epic where it
 *  cannot be sized or pulled - so break the epic up. Offering to "add" the second one would put a
 *  second Waterside Paths in the Backlog beside the one already there, which is not help.
 */
export type Proposal =
  | { id: string; why: string; kind: 'add'; label: string; draft: PbiDraft }
  | { id: string; why: string; kind: 'split'; label: string; epicId: string; memberIds: string[] };

/** A real Product Backlog item - one you could refine, size and pull. */
const hasItem = (state: ZooGameState, match: (it: BacklogItem) => boolean) => state.backlog.some(match);

/** The epic hiding a thing like this, if one is. A member of an epic is in the Backlog in the sense
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
 *  The top of the Backlog is what the Product Owner expects to be next, so that is what to read.
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

  // A zone about to have an animal in it needs a way in and something growing. Both are its own
  // items, because a zone is a slice: the paths for the Big Cats belong to the Big Cats.
  // A zone is "coming" if an animal or a habitat for it is coming - or if the whole area is still
  // one epic near the top of the Backlog, which is the usual way a zone arrives.
  const brings = (it: BacklogItem) => it.category === 'exhibit' || it.category === 'enclosure'
    || (it.category === 'epic' && (it.epicMembers ?? []).some((m) => m.kind === 'exhibit'));
  const zones = Array.from(new Set(soon.filter(brings).map((it) => it.zone)));
  const needs: { kind: 'path' | 'flora'; name: string; why: (z: string) => string; draft: (z: string) => PbiDraft }[] = [
    {
      kind: 'path', name: 'Paths',
      why: (z) => `${z} is coming up. A zone opens on three things - somewhere to see an animal, an animal to see, and a path to walk in on - and the third one is not in the Backlog.`,
      draft: (z) => ({ name: `${z} Paths`, category: 'path', zone: z, acceptance: pathAcceptance() }),
    },
    {
      kind: 'flora', name: 'Planting',
      why: (z) => `${z} is coming up with nothing growing in it. Planting is what makes a zone feel like somewhere rather than a fenced field, and it is cheap next to a habitat.`,
      draft: (z) => ({ name: `${z} Planting`, category: 'flora', zone: z, template: 'tree', acceptance: floraAcceptance('tree') }),
    },
  ];
  for (const zone of zones) {
    for (const need of needs) {
      if (hasItem(state, (it) => it.category === need.kind && it.zone === zone)) continue;
      const hidden = hidingIn(state, zone, need.kind);
      if (hidden) {
        out.push({
          id: `split:${zone}:${need.kind}`, kind: 'split', label: `Split ${zone}`,
          why: `${need.why(zone)} It is in the ${hidden.epic.name} epic, where nobody can size it or pull it into a Sprint.`,
          epicId: hidden.epic.id, memberIds: hidden.memberIds,
        });
      } else {
        out.push({ id: `${need.kind}:${zone}`, kind: 'add', label: `${zone} ${need.name}`, why: need.why(zone), draft: need.draft(zone) });
      }
    }
  }

  // A zoo people stay in needs somewhere to eat and somewhere to go. Better raised before the
  // visitors complain than after - the signals already handle "after", and by then it has cost you.
  const exhibitsSoon = state.backlog.filter((it) => it.category === 'exhibit' && (it.status === 'open' || soon.includes(it))).length;

  const wants: { services: 'food' | 'toilet'; name: string; why: string }[] = [
    { services: 'food', name: 'Kiosk', why: 'people who have walked round three exhibits want feeding, and there is nowhere to buy anything' },
    { services: 'toilet', name: 'Toilets', why: 'a family will cut a day short over this one, and there is nowhere to go' },
  ];
  if (exhibitsSoon >= 3) {
    for (const w of wants) {
      if (hasItem(state, (it) => it.category === 'amenity' && it.services === w.services)) continue;
      out.push({
        id: `amenity:${w.services}`, kind: 'add', label: w.name,
        why: `The zoo will have ${exhibitsSoon} exhibits open - ${w.why}.`,
        draft: { name: w.name, category: 'amenity', zone: 'Facilities', services: w.services, acceptance: amenityAcceptance(w.name, w.services) },
      });
    }
  }

  return out.filter((p) => !declined.has(p.id));
}
