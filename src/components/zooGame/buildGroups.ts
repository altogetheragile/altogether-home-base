import type { BacklogItem, ZooGameState } from './types';
import { CRITERIA, criterionFor, answerable, inspect } from './parkChecks';
import { LANDSCAPE_TYPES, currentDesign, isTank } from './design';
import { picksAStructure, structureWord } from './toolboxItems';
import { structureChosen } from './engine';

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
  | 'structure'
  | 'footprint' | 'shape' | 'ground' | 'barrier' | 'fence' | 'inside' | 'grown' | 'clump'
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
  /** Criteria this group SPEAKS to but cannot settle.
   *
   *  A white lion is what makes it recognisable, and whether you can tell it is a lion is nobody's
   *  measurement - so the coat can never light a dot. It still has to be on the strip: without this,
   *  "Needs only" filtered to the groups that settle something and took the coat away with the
   *  rest, and there was no way to colour a lion at all. Reported from playing it: "there is no way
   *  to set the coat colour of the lions."
   *
   *  It never lights anything. It only keeps the control where the question it answers is asked. */
  about?: string[];
  /** Lit for a reason of its own, rather than because it would settle an open criterion. The one
   *  group this is true of is the first decision: what kind of thing to build at all. */
  litFor?: (item: BacklogItem) => boolean;
  /** What this group's controls WRITE, as stable keys.
   *
   *  Hand-kept, like `meets`, and for the same reason: it is the only way to say out loud that two
   *  menus are asking one question. The game has grown that fault three times - "Holds: land or a
   *  tank" beside Structure, "Type" beside Structure, "Kind" beside Planting - and each time it was
   *  found by somebody playing it rather than by the game. `oneQuestionOneMenu` makes it fail the
   *  build instead. */
  writes: string[];
}

const habitat = (it: BacklogItem) => it.category === 'enclosure';
const animal = (it: BacklogItem) => it.category === 'exhibit';
const building = (it: BacklogItem) => it.category === 'amenity';
const flora = (it: BacklogItem) => it.category === 'flora';
const path = (it: BacklogItem) => it.category === 'path';

export const GROUPS: GroupDef[] = [
  // ---- what kind of thing this is: the first decision, and the one that makes the rest possible ----
  //
  // It settles no criterion of its own - the criteria are about what a thing holds and offers, not
  // about what KIND it is - so it is never lit by `wouldSettle`. It is lit by being unanswered,
  // which is what `litFor` is for.
  // It SEEDS `parts.piece` and the plant's colours rather than owning them: a tree chosen is an oak
  // to start with, and which oak each plant in the clump is belongs to How many.
  { id: 'structure', writes: ['parts.structure', 'parts.type', 'parts.ground', 'item.template'], label: 'Structure', meets: [],
    // Said in the words of the thing being built: a habitat is a structure, a lion is a species and
    // a stand of trees is planting.
    labelFor: (it) => structureWord(it.category),
    applies: (it) => picksAStructure(it.category),
    litFor: (it) => !structureChosen(it) },

  // ---- a habitat ----
  { id: 'footprint', writes: ['item.enclosureSize'], label: 'Size', meets: ['roomy', 'room-to-spare'], applies: habitat },
  { id: 'shape', writes: ['parts.shape'], label: 'Shape', meets: [], applies: habitat },
  // "Holds: land or a tank" was this question asked twice - a paddock holds land and a tank holds
  // water, and Structure is where that is decided now.
  // What the floor of it is. A paddock has ground and a tank has water, and the menu says which -
  // "having ground in the surface menu does not make sense. What if it is water?" It was a menu
  // called Surface with a row inside it called Ground, which is the menu's own name said again in
  // the wrong word.
  { id: 'ground', writes: ['colors.ground', 'colors.water'], label: 'Surface', meets: ['a-home'],
    labelFor: (it) => (isTank(currentDesign(it), [], it) ? 'Water' : 'Ground'),
    applies: habitat },
  { id: 'barrier', writes: ['parts.barrier'], label: 'Barrier', meets: ['held'], applies: habitat },
  // What it looks like. Called Look wherever it happens - a habitat's fence, a building's walls
  // and sign, an animal's coat, a plant's foliage - because it is one act, and it was three words.
  { id: 'fence', writes: ['colors.fence'], label: 'Look', meets: [], applies: habitat },
  { id: 'inside', writes: ['design.water', 'design.flora'], label: 'Inside', meets: ['a-home'], applies: habitat },

  // ---- an animal ----
  { id: 'stock', writes: ['design.group'], label: 'How many', meets: ['a-group', 'room-to-spare'], applies: animal },
  // A white lion is what the posters are of, and whether you can tell it is a lion is a person's
  // judgement rather than a measurement - so this group settles nothing the park can check, and
  // gets no light. It is still the control somebody reaches for at the Review.
  { id: 'look', writes: ['colors.coat'], label: 'Look', meets: [], about: ['recognisable'], applies: animal },
  { id: 'lives-in', writes: ['item.enclosureId'], label: 'Lives in', meets: ['findable', 'room-to-spare'], applies: animal },

  // ---- a building ----
  // "Type: kiosk, cafe, shop" was Structure asked twice. What a building IS is the first decision.
  { id: 'offers', writes: ['item.services'], label: 'Offers', meets: ['sells-food', 'has-cubicles', 'somewhere-to-sit'], applies: building },
  // The board over the door is a colour, which is why the colours are not purely cosmetic for a
  // building: "no name board yet - put a sign on it and give it a colour".
  { id: 'colours', writes: ['colors.sign', 'colors.walls', 'colors.roof', 'colors.door'], label: 'Look', meets: ['says-what-it-is'], applies: building },

  // ---- planting ----
  // What it LOOKS like: how big it grew, what colour it is, how many of them. What it IS is the
  // first decision, on Planting, and this used to be called that too - two menus with one name.
  { id: 'grown', writes: ['parts.size'], label: 'Size', meets: [],
    applies: (it) => flora(it) && !LANDSCAPE_TYPES.includes(currentDesign(it).parts.type ?? it.template ?? '') },
  { id: 'clump', writes: ['item.copies', 'parts.piece'], label: 'How many', meets: [],
    applies: (it) => flora(it) && !LANDSCAPE_TYPES.includes(currentDesign(it).parts.type ?? it.template ?? '') },
  { id: 'planting', writes: ['colors.plant'], label: 'Look',
    // What a piece of landscape looks like is the whole of what it is asked: can you tell that is
    // water at a glance, can you see it from across the park, does it read as a crossing.
    about: ['greenery', 'sense-of-place', 'water-at-a-glance', 'rock-at-a-glance',
      'crossing-at-a-glance', 'this-is-the-way-in', 'seen-across-park', 'reads-at-a-distance', 'which-way'], meets: [], applies: flora,
    labelFor: (it) => (LANDSCAPE_TYPES.includes(currentDesign(it).parts.type ?? it.template ?? '') ? 'Style' : 'Look') },

  // ---- the pen, and the park ----
  // Four groups were four: the pen, how wide, the runs laid, and the surface. They are one piece of
  // work - laying a path - and they are one menu.
  { id: 'path', writes: ['parts.thickness', 'colors.path', 'state.connectors'], label: 'Paths', meets: ['walkable-to', 'joins-up', 'side-by-side'],
    applies: (it) => path(it) || habitat(it) || building(it) },
  { id: 'park', writes: ['item.rot', 'item.pos'], label: 'On the park', meets: ['crosses-water'],
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
export const wouldSettle = (group: GroupDef, open: string[], item?: BacklogItem): boolean =>
  (!!item && !!group.litFor?.(item)) || group.meets.some((id) => open.includes(id));

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
  if (group.litFor) return true;   // the first decision is always about the item in hand
  const asked = criteriaOf(item);
  return [...group.meets, ...(group.about ?? [])].some((id) => asked.includes(id));
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
