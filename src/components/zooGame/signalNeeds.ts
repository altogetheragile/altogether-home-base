// ============= What the visitors said, as a need =============
//
// A signal is evidence. It is not an instruction to build a thing, and it used to be one: the
// Review offered "Add somewhere to eat (a cafe or kiosk)" and taking it put a Food outlet on the
// Product Backlog with its services set, its size decided and nothing left to choose. The
// parenthetical is the simulation making the Developers' decision, and the rest is the Product
// Owner's accountability being done for them by a complaint.
//
// The quotes were need-shaped all along - "Lovely morning, but we left at lunchtime. Nowhere to
// eat." - so this is that quote's need, written once. The Review reads `suggestion` and the item
// that arrives is built from the rest of the same entry, so the words in front of the Product Owner
// and the item they get cannot drift apart.
//
// This is where most of the Product Backlog should come from after Sprint 1: Evidence-Based
// Management generating the work rather than reporting on it.

export interface SignalNeed {
  /** What the Review puts in front of the Product Owner. The need, never the building. */
  suggestion: string;
  name: string;
  story: { as: string; want: string; soThat: string };
  criteria: string[];
  /** The hidden size the planning poker clusters around, once the Developers have chosen. */
  trueSize: number;
}

export const SIGNAL_NEEDS: Record<string, SignalNeed> = {
  'unmet:food': {
    suggestion: 'Somewhere to eat, without leaving the park',
    name: 'Somewhere to eat',
    story: { as: 'a visitor', want: 'to buy food and a drink without leaving', soThat: 'lunchtime does not end our visit' },
    criteria: ['Can I tell what it is from outside?', 'Can I buy food and a drink here?', 'Can I walk to it from the way in?'],
    trueSize: 5,
  },
  'unmet:toilet': {
    suggestion: 'Somewhere to go, without a queue for it',
    name: 'Somewhere to go',
    story: { as: 'a visitor with children', want: 'to find a free cubicle when we need one', soThat: 'a long day out stays a good one' },
    criteria: ['Can I tell what it is from outside?', 'Can I find a free cubicle at a busy time?', 'Can I walk to it from the way in?'],
    trueSize: 3,
  },
  'unmet:rest': {
    suggestion: 'Somewhere to sit down, out of the sun',
    name: 'Somewhere to sit',
    story: { as: 'a visitor', want: 'to sit down in the shade partway round', soThat: 'we can stay all day rather than half of it' },
    criteria: ['Can I sit down in the shade?', 'Can I walk to it from the way in?'],
    trueSize: 3,
  },
  crowding: {
    suggestion: 'Room to see the animals when it is busy',
    name: 'Room to see the animals',
    story: { as: 'a visitor', want: 'to get to the front without waiting behind three rows', soThat: 'the animals we came for are the ones we see' },
    // Mostly judgement, and honestly so: whether a zoo feels crowded is not a measurement, and the
    // one fact here is whether people can get to the new place at all. A need the park could settle
    // entirely would not need a Product Owner.
    criteria: ['Can I see the animals without queueing?', 'Can I get a clear view of them?', 'Can I walk to it from the way in?'],
    trueSize: 5,
  },
};
