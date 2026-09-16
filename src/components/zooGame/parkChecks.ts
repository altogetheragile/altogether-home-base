import type { ZooGameState, BacklogItem } from './types';
import { groupSize, hasRoomToRoam, ENCLOSURE_SHAPES, ENCLOSURE_SIZE, enclosureWater, enclosureFlora, DEFAULT_GROUP, isDeployAcceptance, currentDesign, designSatisfiesTask, homeSizeOf, isTank, barrierVerdict } from './design';
import { settleStatus, isSignOffTask, commitWhenBuilt, acSettled } from './engine';
import { whereItStands, groundSize } from './parkModel';
import { spansTheWater, inWater } from './parkWater';
import { areasOnAPath, pathTo, whatVisitorsCanReach } from './parkNetwork';

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
    if (!target) {
      // Nothing else standing in this zone yet - which is the ordinary case for the paths through
      // the grounds, built before anything they lead to. Reported from playing it: "I added the
      // main paths and cannot move it to Done." It waited for something to reach, in a zone that
      // was empty by design, so it could never go green and could never be offered for acceptance.
      // A run laid where people will walk is the zone becoming reachable, and that is the fact.
      const mine = (state.connectors ?? []).some((c) => c.itemId === item.id);
      return mine
        ? { met: true, evidence: `the first run through the ${item.zone}` }
        : { met: false, evidence: 'draw a run where people should walk' };
    }
    return { met: false, evidence: `draw a run up to the ${target.name}` };
}

/** Where a criterion can be answered: the ones about where a thing stands can only be answered once
 *  it is standing, and the rest are about the object and are answered while it is built. */
export const checkedAt = (label: string): 'object' | 'park' => (isDeployAcceptance(label) ? 'park' : 'object');

// ============= The criteria, and the things that answer them =============
//
// One list. Every criterion the game can write is here, with the sentence a person reads and the
// thing that answers it side by side - and a criterion nobody can answer is IN this list too, with
// no `answer`, because "a person judges this" is a decision somebody made rather than a gap.
//
// This used to be three structures that had to be kept in step by hand: a list of sentences the
// park could answer, a map of old spellings, and a two-hundred-line chain of `if (label === ...)`.
// Nothing tied them together, so a criterion could be written that nothing recognised - and this
// game shipped exactly that three times. "Can I find it from the entrance?" was a facility asking
// the habitat's question in different words. "Placed where visitors can reach it" was the same
// again. The Gift Shop's three were all judgements, so the only route to Done was the Product Owner
// waiving every one of them, which teaches that Done is whatever they say it is.
//
// With the sentence and its answer in one place, that mistake is visible while you are making it,
// and `everyCriterionIsKnown` in the tests makes it fail the build.

export interface CriterionDef {
  /** Stable identity, independent of the wording. Nothing user-facing uses it yet; the catalogue
   *  will, so that an item can say which criteria it is able to meet. */
  id: string;
  /** The sentence a person reads. */
  asks: string;
  /** How to recognise it when the sentence is built from the item - a species name, mostly. */
  is?: RegExp;
  /** The sentences it used to be asked in.
   *
   *  The park matches by text, so rewording one orphans every item already carrying the old words:
   *  a game in play, and every save ever taken. Deliberately a short list of dead spellings rather
   *  than a second way of saying the rule. Delete one when no save could still hold it. */
  was?: string[];
  /** A few words for a catalogue row: "a way to walk to it". */
  short: string;
  /** The park's answer. Absent means only a person can say, which is not a gap: acceptance is a
   *  conversation, and the park is never going to tick "can I walk right round it?" for anybody. */
  answer?: (state: ZooGameState, item: BacklogItem) => Verdict;
}

/** What a facility offers, which is the whole of what it is for. Three needs, one shape of answer.
 *
 *  The capacity is named in the evidence, because "yes" and "yes, for five hundred people a Sprint"
 *  are different answers when four thousand come. */
const offers = (need: 'food' | 'toilet' | 'rest', miss: string) =>
  (_state: ZooGameState, item: BacklogItem): Verdict => (item.services === need
    ? { met: true, evidence: `it serves ${item.serviceCapacity ?? 0} visitors a Sprint` }
    : { met: false, evidence: item.services
      ? `it offers ${item.services === 'food' ? 'food and drink' : item.services === 'toilet' ? 'toilets' : 'somewhere to sit'}, which is not what this asks for`
      : miss });

export const CRITERIA: CriterionDef[] = [
  // ---- a habitat, answered while it is being built ----
  {
    id: 'held', asks: 'Is it bordered safely, with no way out of it?', short: 'somewhere they cannot get out of',
    // A tank is held in by glass and a paddock by a fence. Asking every habitat about its "fence"
    // was asking about the one case.
    was: ['Can I see a fence with no way out of it?'],
    answer: (state, item) => {
      // The only question in the game that can be answered wrongly on purpose. It used to say
      // `met: true` always - "a habitat is fenced by construction" - so there was nothing to get
      // wrong and Sprint 1 had no mistake in it to reflect on.
      const design = currentDesign(item);
      const living = state.backlog.filter((it) => it.enclosureId === item.id);
      if (isTank(design, living, item)) return { met: true, evidence: 'Glass' };
      const shape = ENCLOSURE_SHAPES.find((sh) => sh.key === (design.parts.shape ?? 'rect'));
      const v = barrierVerdict(design, living);
      const where = shape ? `, ${shape.label.toLowerCase()}` : '';
      // Said in the words of the thing that would get out, because "needs 3" is not a reason
      // anybody can act on and "a leopard climbs a 2m fence" is.
      if (!v.ok) return { met: false, evidence: `${v.barrier.note} - ${v.escapee} would be over it` };
      return { met: true, evidence: `${v.barrier.note}${living.length ? ', holds them' : ''}${where}` };
    },
  },
  {
    id: 'roomy', asks: 'Can an animal move about in here?', short: 'room to move about',
    answer: (state, item) => {
      const size = ENCLOSURE_SIZE[item.enclosureSize ?? 'medium'];
      const tiles = `${Math.round(size.w / 22)} \u00d7 ${Math.round(size.h / 22)}`;
      // Against the animals that will actually live here, where the Product Backlog says which.
      const living = state.backlog.filter((it) => it.enclosureId === item.id);
      const group = living.map((it) => currentDesign(it).group).find(Boolean);
      if (!living.length) return { met: true, evidence: `${tiles}, room for a pair` };
      // Said in the size a habitat comes in rather than in the arithmetic behind it: "a lion family
      // needs a large one" is a sentence; "needs 3.85" is a number nobody can act on. Measured for
      // the animal that actually lives here: a shoal of reef fish and a pride of lions do not take
      // the same room, and the pen cannot answer for both with one number.
      const species = living[0] ? (living[0].template ?? living[0].id) : undefined;
      const fits = hasRoomToRoam(group ?? DEFAULT_GROUP, item.enclosureSize ?? 'medium', species);
      const smallest = (['small', 'medium', 'large'] as const)
        .find((k) => hasRoomToRoam(group ?? DEFAULT_GROUP, k, species)) ?? 'large';
      const who = living[0].name.toLowerCase();
      return fits
        ? { met: true, evidence: `${tiles}, room for the ${who}` }
        : { met: false, evidence: `${tiles}, the ${who} needs a ${smallest} one` };
    },
  },
  {
    id: 'a-home', asks: 'Can I tell an animal lives here, not a shed?', short: 'a home rather than a shed',
    answer: (state, item) => {
      // Ground under their feet, something growing or to shelter behind, and water. A hatched box
      // with none of those is a pen, and the criterion exists to be failable by one - which it was
      // not while the learner ticked it themselves. A tank IS water: asking it for a pond in the
      // corner is asking a fish to build a pond.
      const design = currentDesign(item);
      const living = state.backlog.filter((it) => it.enclosureId === item.id);
      const tank = isTank(design, living, item);
      const water = tank || enclosureWater(design).length > 0;
      const growing = enclosureFlora(design).length > 0;
      const ground = tank ? !!(design.colors?.water ?? true) : !!design.colors?.ground;
      const shelter = enclosureFlora(design).some((f) => /rock|shelter|hedge/i.test(f.type));
      const has = [ground && 'ground', shelter ? 'shelter' : growing && 'planting', water && 'water']
        .filter(Boolean) as string[];
      const missing = [!ground && 'ground', !growing && 'shelter or planting', !water && 'water']
        .filter(Boolean) as string[];
      // ...and where the missing ones are put. The ground is a swatch on the strip, but planting
      // and water are inside the habitat, behind "Look Inside" - which is the one place a player
      // has to know about to finish a habitat and the one place nothing pointed at.
      const indoors = !growing || !water;
      return missing.length
        ? { met: false, evidence: `no ${missing.join(' or ')} yet${indoors ? ' - Look Inside to add them' : ''}` }
        : { met: true, evidence: `${has.join(', ')} in` };
    },
  },

  // ---- the animals ----
  {
    id: 'recognisable', asks: 'Can I tell they are a lion without reading the sign?',
    // Built from the species, so it is recognised by its shape rather than by its text.
    is: /^Can I tell they are .+ without reading the sign\?$/, short: 'recognisable for what it is',
  },
  {
    id: 'a-group', asks: 'Can I see a group rather than one animal on its own?', short: 'a group, not one on its own',
    answer: (_state, item) => {
      const n = groupSize(currentDesign(item).group);
      return { met: n > 1, evidence: n > 1 ? `${n} of them` : 'one on its own' };
    },
  },
  {
    id: 'room-to-spare', asks: 'Can I fit them in the habitat with room to spare?', short: 'room to spare in their habitat',
    answer: (state, item) => {
      // The size of the habitat they actually live in, not a field on the animal. It read the
      // animal's own copy, so making the pen bigger - the obvious fix - changed nothing at all.
      const design = currentDesign(item);
      const size = homeSizeOf(item, state.backlog);
      const n = groupSize(design.group);
      if (!design.group) return { met: false, evidence: 'not stocked yet' };
      const named = (k?: string) => (k === 'large' ? 'a large' : k === 'small' ? 'a small' : 'a medium');
      const species = item.template ?? item.id;
      if (hasRoomToRoam(design.group, size, species)) return { met: true, evidence: `${n} in ${named(size)} habitat` };
      // ...and what would fix it, in the words of the thing you would change: a bigger pen, or
      // fewer animals. A criterion that only says no is a door with no handle.
      const roomy = (['small', 'medium', 'large'] as const).find((k) => hasRoomToRoam(design.group!, k, species));
      return {
        met: false,
        evidence: roomy
          ? `${n} in ${named(size)} habitat - they need ${named(roomy)} one`
          : `${n} is too many for any habitat - fewer of them`,
      };
    },
  },
  {
    id: 'findable', asks: 'Can I find them in their habitat?', short: 'visible in their habitat',
    answer: (state, item) => inHabitat(state, item),
  },

  // ---- getting about ----
  {
    id: 'joins-up', asks: 'Does it join every area to the way in?', short: 'every area joined to the way in',
    // The main pathways serve every area, so they are judged on whether every area is joined up.
    // Asked about "this zone" they were asked about the Grounds, which has no habitat in it and so
    // could never answer yes - an item that could not be finished.
    was: ['Can I get to this zone without crossing the grass?'],
    answer: (state) => {
      // The areas, not what is built in them, and only the areas that HAVE something in them. The
      // spine joins up the zoo as it exists: in Sprint 1 that is one area, and requiring it to
      // reach four before it could be finished would be the same un-finishable item by another
      // route. It stops being adequate as the zoo grows, which is honest for infrastructure.
      const lively = new Set(state.backlog
        .filter((it) => it.status === 'open' && it.category !== 'path')
        .map((it) => it.zone));
      const areas = areasOnAPath(state).filter((a) => lively.has(a.zone));
      if (!areas.length) return { met: true, evidence: 'nothing open for it to join up yet' };
      const adrift = areas.filter((a) => !a.joined);
      if (!adrift.length) return { met: true, evidence: `every area joined - ${areas.length} of them` };
      return { met: false, evidence: `nothing runs to the ${adrift[0].zone}` };
    },
  },
  {
    id: 'walkable-to', asks: 'Can I walk to it from the way in?', short: 'a way to walk to it',
    // A facility asked whether you could find it from the entrance, which is the habitat's question
    // in different words - so the park recognised one and not the other, and a facility had nothing
    // the player could do to satisfy any of its criteria.
    was: ['Can I find it from the entrance?'],
    answer: (state, item) => {
      // Walked, not measured from nearby: this asks the routing the Sprint Review itself uses. Two
      // definitions of "reachable" is how a park ends up telling a team they are fine and then
      // charging them for it at the Review. On a path, not across the grass - visitors will cut
      // over the grass rather than not come, and asking that question here made this criterion free
      // everywhere except across water.
      const route = pathTo(state, item);
      if (route) return { met: true, evidence: 'a path from the way in' };
      const wet = whatVisitorsCanReach(state).stranded.find((x) => x.item.id === item.id);
      // It names the CONTROL, because "no path reaches it" is a fact and not an instruction.
      return { met: false, evidence: wet?.why === 'water'
        ? 'the water is in the way, and nothing crosses it - the Bridge would'
        : 'nothing reaches it yet - draw a path to it from the way in' };
    },
  },
  {
    id: 'crosses-water', asks: 'Can I cross the water on it?', short: 'a way over the water',
    answer: (state, item) => {
      // A bridge is the one piece of work whose whole job is a fact about the park. It cannot be
      // ticked by hand and does not need to be: a bridge snaps to the river when it is put down, so
      // this goes green as it lands. What it leaves worth arguing about is WHERE.
      const at = whereItStands(state, item);
      if (!at) return { met: false, evidence: 'not on the park yet' };
      const size = groundSize(item);
      if (spansTheWater(size, at)) return { met: true, evidence: 'bank to bank' };
      return { met: false, evidence: inWater(size, at)
        ? 'it reaches the water and stops - it has to cross it'
        : 'it is not over the water' };
    },
  },

  // ---- the buildings ----
  {
    id: 'says-what-it-is', asks: 'Can I tell what it is from outside?', short: 'a name board over the door',
    answer: (_state, item) => {
      // A building says what it is, or it is a shed with a queue outside it. The board over the
      // door is the control, it is on the strip, and it is a fact the park can see.
      const signed = currentDesign(item).parts?.sign !== 'off' && !!currentDesign(item).colors?.sign;
      return signed
        ? { met: true, evidence: 'a name board over the door' }
        : { met: false, evidence: 'no name board yet - put a sign on it and give it a colour' };
    },
  },
  { id: 'sells-food', asks: 'Can I buy food and a drink here?', short: 'somewhere to eat',
    answer: offers('food', 'it offers nothing to eat - say so under Offers') },
  { id: 'has-cubicles', asks: 'Can I find a free cubicle at a busy time?', short: 'a toilet you can get into',
    answer: offers('toilet', 'it is not set up as a toilet - say so under Offers') },
  { id: 'somewhere-to-sit', asks: 'Can I sit down in the shade?', short: 'somewhere to sit',
    answer: offers('rest', 'there is nowhere to sit - say so under Offers') },

  // ---- and the ones only a person can answer ----
  //
  // Not gaps. Acceptance is a conversation, and these are what there is to talk about: whether the
  // thing is any good, which no measurement of the park will ever settle.
  { id: 'buy-a-souvenir', asks: 'Can I buy something to take home?', short: 'something to take home' },
  { id: 'what-i-came-for', asks: 'Can I get what I came for?', short: 'what the visitor came for' },
  { id: 'right-round-it', asks: 'Can I walk right round it?', short: 'a way round the outside' },
  { id: 'still-get-past', asks: 'Can I still get past it?', short: 'not in the way' },
  { id: 'still-get-round', asks: 'Can visitors still get round it?', short: 'not in the way' },
  { id: 'side-by-side', asks: 'Can two people walk it side by side?', short: 'wide enough for two' },
  { id: 'reads-at-a-distance', asks: 'Can I read it from a few steps away?', short: 'readable from a few steps' },
  { id: 'which-way', asks: 'Can I tell which way to go from here?', short: 'which way to go' },
  { id: 'greenery', asks: 'Can I see greenery from the path?', short: 'greenery from the path' },
  { id: 'sense-of-place', asks: 'Can I tell what kind of place this is from the planting?', short: 'a sense of place' },
  { id: 'seen-across-park', asks: 'Can I see it from across the park?', short: 'visible across the park' },
  { id: 'water-at-a-glance', asks: 'Can I tell that is water at a glance?', short: 'reads as water' },
  { id: 'rock-at-a-glance', asks: 'Can I tell that is rock at a glance?', short: 'reads as rock' },
  { id: 'crossing-at-a-glance', asks: 'Can I see it is something you cross?', short: 'reads as a crossing' },
  { id: 'this-is-the-way-in', asks: 'Can I tell this is the way in?', short: 'reads as the way in' },
  { id: 'where-to-park', asks: 'Can I tell where to park?', short: 'somewhere to park' },
  { id: 'find-from-car-park', asks: 'Can I find it from the car park?', short: 'findable from the car park' },
  { id: 'walk-to-entrance', asks: 'Can I walk from it to the entrance?', short: 'a walk to the entrance' },

  // An area, before it is broken up. These belong to an epic, and an epic is split rather than
  // built - but they are criteria the game writes down, so they are criteria the game knows about.
  // They are also the closest thing the Backlog has to a need today: nothing in them says paddock.
  { id: 'animals-named', asks: 'Can I tell what every animal here is?', short: 'every animal named' },
  { id: 'species-apart', asks: 'Can I see each species in a habitat of its own?', short: 'a habitat each' },
  { id: 'served-here', asks: 'Can I eat, rest and find my way in this part of the park?', short: 'served in this part of the park' },

  // ...and the two the visitors ask for when they complain about queues. Phrased as statements
  // rather than as a visitor's question, unlike every other criterion in this list. Worth putting
  // right, and not here: rewording is visible to anybody mid-Sprint and this change is meant to be
  // invisible.
  { id: 'eases-queues', asks: 'Eases the queues', short: 'shorter queues' },
  { id: 'sightlines', asks: 'Good sightlines', short: 'a clear view' },
];

const BY_TEXT = new Map<string, CriterionDef>();
for (const def of CRITERIA) {
  BY_TEXT.set(def.asks, def);
  for (const old of def.was ?? []) BY_TEXT.set(old, def);
}

/** The criterion this sentence is, however it was worded when it was written down. */
export const criterionFor = (label: string): CriterionDef | undefined =>
  BY_TEXT.get(label) ?? CRITERIA.find((d) => d.is?.test(label));

/** The words this criterion is asked in now. A sentence built from the item - a species name - is
 *  already current, so it is handed back as it stands. */
export const asAsked = (label: string): string => {
  const def = BY_TEXT.get(label);
  return def ? def.asks : label;
};

/** Every criterion the park has an answer for, whether or not it can answer it yet.
 *
 *  Not the same question as "does it have a verdict right now": a criterion about a path reaching a
 *  zone has no answer until the thing is standing somewhere, and reading that silence as "somebody
 *  else's judgement" would offer half-built work for sign-off. */
export const answerable = (label: string): boolean => !!criterionFor(label)?.answer;

/** The park's answer to one criterion, or null when it is a matter of judgement.
 *
 *  A lookup now, not a chain: the answer lives with the sentence in CRITERIA above. */
export function checkCriterion(state: ZooGameState, item: BacklogItem, asked: string): Verdict | null {
  const def = criterionFor(asked);
  return def?.answer ? def.answer(state, item) : null;
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
/** Tick the steps the work itself has finished.
 *
 *  Beside the criteria, in the reducer, because they are the same kind of thing: a fact about what
 *  has been built. It used to live in the build takeover, and went when the takeover did - so the
 *  criteria ticked themselves and the plan did not, which is exactly as confusing as it sounds:
 *  "the game automatically checks off ACs but not tasks". The sign-off is never ticked here - that
 *  is the Product Owner accepting the work - and a step can still be ticked by hand on the card,
 *  because the plan is the Developers' own. */
function applyPlanChecks(state: ZooGameState): ZooGameState {
  let changed = false;
  const backlog = state.backlog.map((item) => {
    if (item.status !== 'committed' || !item.started) return item;
    const tasks = item.tasks ?? [];
    if (!tasks.length) return item;
    // Against what has actually been done, and never against the preset the item was born with.
    //
    // `currentDesign` falls back to the preset so that something can always be drawn, and a preset
    // carries a width and a colour - so "set its width and colour" was true from the moment the card
    // was picked up, and the park ticked it off before anybody had touched it. Reported from playing
    // it: "tasks are ticked off as complete before I pull the card to Doing." A plan that ticks
    // itself for work nobody did is worse than a plan that never ticks.
    const design = item.draftDesign ?? item.design;
    if (!design) return item;
    const homeSize = homeSizeOf(item, state.backlog);
    let touched = false;
    const next = tasks.map((t) => {
      if (t.done || !t.label.trim() || isSignOffTask(t.label)) return t;
      if (!designSatisfiesTask(item, design, t.label, homeSize)) return t;
      touched = true;
      return { ...t, done: true };
    });
    if (!touched) return item;
    changed = true;
    // ...and a plan with nothing left in it is the Developers saying it is built, whether they
    // ticked the last step or the park did. Without this the draft was never committed, so the card
    // read "Next: finish the plan" over a finished plan and would not move.
    return settleStatus(commitWhenBuilt({ ...item, tasks: next }));
  });
  return changed ? { ...state, backlog } : state;
}

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
  // ...and the plan, in the same pass, so a criterion and a step cannot disagree about the same
  // piece of work.
  return applyPlanChecks(changed ? { ...state, backlog } : state);
}

/** Whether the Developers can hand this item to the Product Owner: every criterion the park can
 *  answer for itself is answered, and the rest are judgement, which is what the asking is for.
 *
 *  One definition, because three things ask it - the pill under the thing on the park, the panel
 *  beside it, and the moment the game says out loud that it has happened. Here rather than in the
 *  engine because answering a criterion is the park's own business.
 */
export function readyToAsk(state: ZooGameState, item: BacklogItem): boolean {
  const criteria = (item.acceptance ?? []).filter(Boolean);
  if (!criteria.length || !item.design) return false;
  const facts = criteria.filter(answerable);
  return facts.every((c) => acSettled(item, criteria.indexOf(c)) || !!checkCriterion(state, item, c)?.met);
}
