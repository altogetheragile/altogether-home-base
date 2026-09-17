import type { BacklogItem, ZooGameState } from './types';
import { CRITERIA, criterionFor, answerable, inspect } from './parkChecks';
import { LANDSCAPE_TYPES, currentDesign } from './design';

// ============= What the strip offers, and what each part of it would settle =============
//
// The build strip used to be every control an object could have, laid out flat: five rows, about
// fifty targets, all the same weight, whatever was selected. Nothing on it said which press would
// finish the item and which was a colour.
//
// The criteria already knew. Their evidence names the control in prose - "Look Inside to add them",
// "put a sign on it and give it a colour", "say so under Offers", "draw a path to it from the way
// in" - and nothing connected those sentences to the buttons they are about. So the sentence could
// point at a control that had moved, or at one that was never there: a facility was told to draw a
// path for a year while facilities had no pen.
//
// This is that connection, written down once. A group of controls declares the criteria it can
// settle. The strip lights the group that would answer a question this item is currently failing,
// and the player follows the lights.

export type GroupId =
  | 'footprint' | 'shape' | 'holds' | 'ground' | 'barrier' | 'fence' | 'inside'
  | 'stock' | 'look' | 'lives-in'
  | 'type' | 'offers' | 'colours'
  | 'planting'
  | 'path' | 'park';

export interface GroupDef {
  id: GroupId;
  label: string;
  /** ...unless the same controls are a different thing on a different object. A bridge's deck and
   *  railings come off the same list as a tree's leaves and trunk, and "Planting" is the wrong word
   *  over a bridge. */
  labelFor?: (item: BacklogItem) => string;
  /** Which of this item's criteria these controls could settle. Empty means cosmetic: it changes
   *  how the thing looks and nothing about whether it is Done. Cosmetic is not lesser - a zoo that
   *  looks like a zoo is the job - but it is a different question, and the strip should say which
   *  question you are answering. */
  meets: string[];
  /** Whether this item has these controls at all. A river has no fence; an animal has no footprint. */
  applies: (item: BacklogItem) => boolean;
}

const habitat = (it: BacklogItem) => it.category === 'enclosure';
const animal = (it: BacklogItem) => it.category === 'exhibit';
const building = (it: BacklogItem) => it.category === 'amenity';
const flora = (it: BacklogItem) => it.category === 'flora';
const path = (it: BacklogItem) => it.category === 'path';

export const GROUPS: GroupDef[] = [
  // ---- a habitat ----
  { id: 'footprint', label: 'Footprint', meets: ['roomy', 'room-to-spare'], applies: habitat },
  { id: 'shape', label: 'Shape', meets: [], applies: habitat },
  // Land or a tank. A tank IS water, which is one of the three things that make a habitat a home
  // rather than a pen, so this settles part of the same question the inside does.
  { id: 'holds', label: 'Holds', meets: ['a-home'], applies: habitat },
  { id: 'ground', label: 'Ground', meets: ['a-home'], applies: habitat },
  { id: 'barrier', label: 'Holds them', meets: ['held'], applies: habitat },
  { id: 'fence', label: 'Fence', meets: [], applies: habitat },
  { id: 'inside', label: 'Inside', meets: ['a-home'], applies: habitat },

  // ---- an animal ----
  { id: 'stock', label: 'How many', meets: ['a-group', 'room-to-spare'], applies: animal },
  // A white lion is what the posters are of, and whether you can tell it is a lion is a person's
  // judgement rather than a measurement - so this group settles nothing the park can check, and
  // gets no light. It is still the control somebody reaches for at the Review.
  { id: 'look', label: 'Look', meets: [], applies: animal },
  { id: 'lives-in', label: 'Lives in', meets: ['findable', 'room-to-spare'], applies: animal },

  // ---- a building ----
  { id: 'type', label: 'Type', meets: [], applies: building },
  { id: 'offers', label: 'Offers', meets: ['sells-food', 'has-cubicles', 'somewhere-to-sit'], applies: building },
  // The board over the door is a colour, which is why the colours are not purely cosmetic for a
  // building: "no name board yet - put a sign on it and give it a colour".
  { id: 'colours', label: 'Colours', meets: ['says-what-it-is'], applies: building },

  // ---- planting ----
  { id: 'planting', label: 'Planting', meets: [], applies: flora,
    labelFor: (it) => (LANDSCAPE_TYPES.includes(currentDesign(it).parts.type ?? it.template ?? '') ? 'Style' : 'Planting') },

  // ---- the pen, and the park ----
  // Four groups were four: the pen, how wide, the runs laid, and the surface. They are one piece of
  // work - laying a path - and they are one menu.
  { id: 'path', label: 'Paths', meets: ['walkable-to', 'joins-up', 'side-by-side'],
    applies: (it) => path(it) || habitat(it) || building(it) },
  { id: 'park', label: 'On the park', meets: ['crosses-water'],
    applies: (it) => !path(it) && !animal(it) },
];

export const groupsFor = (item: BacklogItem): GroupDef[] => GROUPS.filter((g) => g.applies(item));

/** What this group is called over this object. */
export const labelOf = (group: GroupDef, item: BacklogItem): string => group.labelFor?.(item) ?? group.label;

/** The criteria this item is failing that the park can actually answer.
 *
 *  Judgement criteria are left out on purpose. A light means "this control would settle it", and
 *  nothing on the strip settles whether a visitor can tell a lion is a lion. */
export function openCriteria(state: ZooGameState, item: BacklogItem): string[] {
  // Settled, not merely seen by the park: a criterion somebody ticked, or one the Product Owner
  // shipped anyway, is not still asking for a press. Leaving its dot lit would send the player to a
  // control that cannot change an answer somebody has already given.
  const { criteria, met } = inspect(state, item);
  return criteria
    .filter((c, i) => answerable(c) && !met(c, i))
    .map((c) => criterionFor(c)?.id)
    .filter((id): id is string => !!id);
}

/** Whether this group holds a control that would settle something still open. */
export const wouldSettle = (group: GroupDef, open: string[]): boolean =>
  group.meets.some((id) => open.includes(id));

/** Every criterion this item is asked, whether it is met or not. */
export const criteriaOf = (item: BacklogItem): string[] => (item.acceptance ?? [])
  .map((c) => criterionFor(c)?.id).filter((id): id is string => !!id);

/** Whether this group is about something this item was asked for.
 *
 *  Not the same question as whether it is lit. A group stays on the strip once its criterion is
 *  met - the control that answered it is the control you change your mind with, and a button that
 *  disappears the moment you press it is worse than one that never moved. The dot goes out; the
 *  button stays. */
export const isAbout = (group: GroupDef, item: BacklogItem): boolean => {
  const asked = criteriaOf(item);
  return group.meets.some((id) => asked.includes(id));
};

/** Every answerable criterion that some group on the strip can settle. Held by a test: a criterion
 *  the park can check and nothing on the strip can reach is a question with no control behind it,
 *  which is how this game shipped "Can I find it from the entrance?" to a facility with no pen. */
export const REACHABLE = (): Set<string> => new Set(GROUPS.flatMap((g) => g.meets));

/** Criteria the park checks that no group can settle. Should be empty. */
export const unreachableCriteria = (): string[] => {
  const reachable = REACHABLE();
  return CRITERIA.filter((c) => c.answer && !reachable.has(c.id)).map((c) => c.id);
};
