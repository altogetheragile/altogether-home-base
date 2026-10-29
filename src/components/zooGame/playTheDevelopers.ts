import type { ZooGameState, ZooAction, BacklogItem, ZooConnector, ScrumTeamMember } from './types';
import type { SeatName } from './useZooSessions';
import { sizeForTheAnimals } from './engine';
import { wantedServices } from './parkChecks';
import { pokerHand, activeWipLimit, isReady, suggestTasks, sprintCapacity, enclosureReady, isSignOffTask, readyToMove, yourDev, otherDevs } from './engine';
import { presetFor, floraColors, isLandscapeType, addWaterTo, addFloraTo, currentDesign, enclosureWater, enclosureFlora, barrierOf, buildingTypeFor, type ItemDesign } from './design';
import { readyToAsk } from './parkChecks';
import { CANVAS_W, PLAY_H, FRONT_Y } from './parkLayout';
import { whereItStands } from './parkModel';

// ============= The Developers, played for a test =============
//
// NOT part of the game. The game builds nothing: every Developer is a person at the table (Al,
// 29 Oct 2026, docs/ZOO_EVERYONE_A_DEVELOPER.md). This is what was the AI Developers' seat, kept
// for the tests that play a whole Sprint end to end and need somebody to do the Developers' part
// the way a player would: size, forecast, plan, pull, build to the criteria, tick the plan off,
// ask the Product Owner to look, move it to Done, run a path. Only tests import it.

export interface AiMove { action: ZooAction; says: string }

/** The median of the hand, which is what a table usually settles on. */
const settle = (hand: number[]): number => [...hand].sort((a, b) => a - b)[Math.floor(hand.length / 2)];

const topUnsized = (s: ZooGameState): BacklogItem | undefined =>
  s.backlog.find((it) => it.status === 'backlog' && it.unsized && it.category !== 'epic');

/** A design that meets the Definition of Done for whatever this is.
 *
 *  Built from the same lists the studio's controls are built from, rather than a fixed palette,
 *  so it can only ever satisfy criteria the game actually asks for. A car park has tarmac and
 *  markings and no foliage; asking for foliage would leave it unbuildable forever. */
export function aiDesign(item: BacklogItem, living: { template?: string; id?: string }[] = []): ItemDesign {
  // What is already there, not a blank one. The Developers take over a card somebody is working on
  // and build it, and building used to mean "a preset, painted" - so a ground colour, a barrier, a
  // pool and a tree chosen by the player were thrown away the moment a Developer touched the same
  // item. Reported from playing it twice in a row: "I'm sure I added them before", and "the ground
  // colour disappeared after I did Look Inside".
  //
  // Every fill below is already written as "only if it has not been chosen", so basing it on the
  // work in hand is all it takes: what the player decided stands, and the Developers finish the rest.
  const base = currentDesign(item);
  const colors: Record<string, string> = { ...base.colors };
  const parts: Record<string, string> = { ...(base.parts as Record<string, string>) };
  const paint = (key: string, fallback: string) => { if (!colors[key]) colors[key] = fallback; };

  if (item.category === 'exhibit') {
    // Which animal, which is the Developers' first decision and nothing defaults to it. The card
    // says what was asked for, and that is what these Developers build.
    if (!parts.structure) parts.structure = item.template ?? item.id;
    // Stocked rather than painted: a pair, which fits any habitat the game offers.
    return { ...base, colors, parts, group: base.group ?? { males: 1, females: 1, juveniles: 0, cubs: 0 } };
  }
  if (item.category === 'enclosure') {
    paint('ground', '#8c7a5b'); paint('fence', '#6b5b45');
    // What borders it, which nothing defaults to any more: an unchosen habitat is unchosen, so the
    // criterion asking whether anything holds them fails until somebody decides. That somebody is
    // these Developers when nobody else is playing them, and what they pick is the advice the strip
    // would give - the smallest thing that holds what lives here.
    if (!parts.barrier) {
      parts.barrier = barrierOf(base, living).key;
    }
    // ...and what KIND of habitat it is, which is the first decision and nothing defaults to it:
    // until it is made there is nothing on the park at all. A tank where the card already says so,
    // a paddock otherwise.
    if (!parts.structure) {
      parts.structure = item.template === 'tank' ? 'tank' : 'paddock';
    }
    // ...and the shelter and water the plan says they laid. They used to paint the ground and
    // tick "Lay the ground, shelter and water", which is three things promised and one done -
    // and it left a hatched box that no Product Owner could look at and say an animal lives
    // here rather than a shed. Doing what the step says is cheaper than arguing about it.
    // ...and only what is not in yet. A pool somebody has already dug and put where they want it is
    // not improved by a second one appearing beside it.
    const withWater = enclosureWater(base).length
      ? { ...base, colors, parts }
      : { ...base, colors, parts, water: addWaterTo({ ...base, colors, parts }) };
    return (enclosureFlora(withWater).length
      ? withWater
      : { ...withWater, flora: addFloraTo(withWater, 'oak') }) as ItemDesign;
  }
  if (item.category === 'flora' && !parts.structure) parts.structure = item.template ?? 'tree';
  if (item.category === 'amenity') {
    // Which building, which nothing guesses any more. When the game is playing the Developers it
    // builds what the card suggests, which is what the advice says.
    if (!parts.type) parts.type = buildingTypeFor(item.name, item.services);
    if (!parts.structure) parts.structure = parts.type;
    // A name board over the door, which a building is no longer born with: "can I tell what it is
    // from outside?" is answered by putting one on, and that is a decision somebody makes.
    paint('sign', '#3f6f4f');
    paint('walls', '#cfd4d8'); paint('roof', '#9aa3ab'); paint('sign', '#e6842a');
    if (parts.sign === 'off') delete parts.sign;      // a building visitors cannot find is not Done
  }
  if (item.category === 'path') { parts.thickness = parts.thickness ?? 'medium'; paint('path', '#b9a888'); }
  if (item.category === 'flora') {
    const type = parts.type ?? item.template ?? 'oak';
    parts.type = type;
    if (isLandscapeType(type) && !parts.piece) parts.piece = type;
    for (const c of floraColors(type)) paint(c.key, '#5b8f3a');
  }
  return { ...base, colors, parts } as ItemDesign;
}

/** A run of pathway from the park's entrance to something in the zone this path serves.
 *
 *  Deliberately simple: two ends and no bends. The park's own check asks whether a run
 *  reaches anything in the zone, so a straight run to the thing that most needs reaching is
 *  a true answer to it rather than a way round it. */
function pathRunFor(state: ZooGameState, item: BacklogItem): ZooConnector | null {
  // Where the things in this zone actually stand. Most of them have never been dragged anywhere,
  // so they have no position of their own: the park lays them out, and the park is what to ask.
  const here = state.backlog.map((i) => ({ item: i, at: i.zone === item.zone ? (i.pos ?? whereItStands(state, i)) : null }))
    .filter((x): x is { item: BacklogItem; at: { x: number; y: number } } => !!x.at);
  // A habitat's run goes to THAT habitat. Taking the first one in the zone meant the Tiger
  // Enclosure's path was drawn to the Lion Enclosure, which satisfied nothing and looked like it had.
  const target = item.category === 'enclosure'
    ? here.find((x) => x.item.id === item.id)
    : here.find((x) => x.item.category === 'enclosure') ?? here.find((x) => x.item.category === 'amenity') ?? here[0];
  const design = item.design ?? presetFor(item);
  if (!target) {
    // Nothing in this zone to walk to yet, which is the ordinary case for the paths through the
    // grounds: they are built before the things they lead to. A path still gets laid - where people
    // will walk - rather than the Developers standing about waiting for something to point at.
    // Up the middle from the way in. A path has no resting place of its own - it is a run, not a
    // box - so there is nothing to ask the park for, and this is where a first path goes.
    const own = item.pos ?? { x: CANVAS_W / 2, y: PLAY_H - 80 };
    return {
      id: `run-${item.id}`, itemId: item.id,
      a: { x: Math.round(own.x), y: Math.round(own.y) },
      b: { x: Math.round(own.x), y: Math.round(Math.max(80, own.y - 300)) },
      bends: [],
      thickness: Number(design.parts.thickness ?? 14) || 14,
      color: design.colors.path ?? '#b9a888',
    };
  }
  return {
    id: `run-${item.id}`,
    itemId: item.id,
    // From the way in - the promenade along the front - to the thing worth walking to. It used to
    // start 220 away from the target, which is out on the grass: near enough for a criterion that
    // measured proximity, and no use at all to a visitor walking from the gate.
    a: { x: Math.round(target.at.x), y: Math.round(FRONT_Y) },
    b: { x: Math.round(target.at.x), y: Math.round(target.at.y), featureId: target.item.id },
    bends: [],
    thickness: Number(design.parts.thickness ?? 14) || 14,
    color: design.colors.path ?? '#b9a888',
  };
}

/** How long the Developers wait for an answer before getting on with it, in day seconds. Long
 *  enough to read the question and choose; short enough that nobody watches a still board because
 *  the Product Owner went to make tea. */
const ASK_PATIENCE_SECONDS = 12;

/** Every accountability, which is who has to agree a Sprint Goal unless a caller says otherwise. */
const ALL_SEATS: SeatName[] = ['product_owner', 'scrum_master', 'developer'];

/** Built, and said as what they did rather than what they wish they had done.
 *
 *  Nobody says their own name in any of these. They used to - "Cara: taking Signposts next" - from
 *  the days when a line had nowhere to say who was speaking. The chat panel signs every bubble
 *  with the person who said it, so the prefix left Cara talking about herself in the third person.
 * Done is the whole
 *  team's word and it waits for the Product Owner's: saying "built to the Definition of Done"
 *  while four acceptance criteria sat untouched was the Developers declaring something that is not
 *  theirs to declare. */
const buildMove = (state: ZooGameState, item: BacklogItem): AiMove => ({
  action: { type: 'BUILD_ITEM', id: item.id, design: aiDesign(item, state.backlog.filter((it) => it.enclosureId === item.id)) },
  says: `Built ${item.name}. Not Done until its criteria are accepted.`,
});

/** Tick their own plan off. The sign-off step is not theirs - that is the Product Owner accepting
 *  the work - and ticking the last of the rest is what moves an item to Done, so leaving the plan
 *  untouched left everything sitting in Doing. */
function tickOffPlan(items: readonly BacklogItem[]): AiMove | null {
  for (const it of items) {
    const task = (it.tasks ?? []).find((t) => !t.done && t.label.trim() && !isSignOffTask(t.label));
    if (task) return { action: { type: 'TOGGLE_TASK', id: it.id, taskId: task.id },
                       says: `${task.label} - done, on ${it.name}.` };
  }
  return null;
}

/** The work that belongs to the team rather than to one person: reviewing each other, asking the
 *  Product Owner to come and look, moving a card to Done, and running the path that joins a new
 *  thing to the way in. Any Developer may do any of it, on anybody's card - including yours, which
 *  is the point of the first one. */
function teamHousekeeping(state: ZooGameState, dev?: ScrumTeamMember): AiMove | null {
  // A second pair of eyes on something that is otherwise finished.
  //
  // "Peer-reviewed by another Developer" is a line in the shipped Definition of Done, and the
  // only thing that satisfies it is a second Developer being on the item. Nobody ever was:
  // seats played by the game built the work and never reviewed each other's, so an item could
  // meet every acceptance criterion, be signed off, stand on the park - and sit unfinishable
  // for the rest of the Sprint. A Product Owner watching that could do nothing about it either,
  // because assigning a Developer is not their call and should not be. Reported from a live
  // game, on day 3 of Sprint 3, with the Sprint Goal at risk over it.
  const needsEyes = state.backlog.find((it) => it.status === 'committed' && it.started && it.design
    && (it.assignedDevs ?? []).length === 1
    && (it.tasks ?? []).every((t) => !t.label.trim() || t.done || isSignOffTask(t.label)));
  if (needsEyes) {
    const already = new Set(needsEyes.assignedDevs ?? []);
    // Whoever is reviewing it, and not its author: a review by the person who wrote it is not a
    // review. Themselves first if they are free of the card, then one of their colleagues, and
    // only then you.
    //
    // That last order matters now the Developers are people. It used to take the first Developer
    // on the team who was not already on the card, which is YOU - so the game quietly put your
    // name against a review you had not done, on somebody else's work, which is the same thing as
    // a Product Owner played by the game accepting work before anybody had looked at it. You are
    // still the fallback, because the alternative is a card that can never meet the Definition of
    // Done when everybody else is busy, and a stalled board teaches nothing.
    const notOnIt = (d: ScrumTeamMember) => !already.has(d.id);
    const free = (dev && notOnIt(dev) ? dev : undefined)
      ?? otherDevs(state).find(notOnIt)
      ?? state.team.developers.find(notOnIt);
    if (free) {
      return { action: { type: 'ASSIGN_DEV', itemId: needsEyes.id, devId: free.id },
               says: `Took a look over ${needsEyes.name} with the second pair of eyes our Definition of Done asks for.` };
    }
  }

  // ...and ask the Product Owner to come and look, which is what the sign-off waits for now.
  // Meeting every criterion the park can measure is what makes the asking possible; it is not
  // the answer, and work whose criteria are all facts used to reach Done without anybody being
  // asked anything at all.
  const toShow = state.backlog.find((it) => it.sprintNumber === state.sprintNumber
    && it.status === 'committed' && !it.signedOff && readyToAsk(state, it)
    && !(state.questions ?? []).some((q) => q.id === `check-${it.id}`));
  if (toShow) {
    return { action: { type: 'ASK_TO_CHECK', id: toShow.id, by: 'developer' },
             says: `${toShow.name} is built. Asking Priya to come and look at it.` };
  }

  // ...and move to Done what is ready. After the second pair of eyes, not before: the
  // Definition of Done asks for a review, and a team that moves the card first has reviewed
  // nothing. Done is the Developers' word - the card no longer walks into the column when the
  // Product Owner accepts it - so where the seats are played by the game, this is them saying it.
  const toMove = state.backlog.find((it) => it.sprintNumber === state.sprintNumber && readyToMove(it));
  if (toMove) {
    return { action: { type: 'FINISH_ITEM', id: toMove.id },
             says: `${toMove.name} meets the Definition of Done. Moving it to Done.` };
  }

  // A pathway is only finished when a run of it actually reaches the zone. The park
  // answers that criterion itself - it either has a path running there or it does not -
  // so a path could be built, planned and Done, and still never be releasable, because
  // nobody had drawn the run. Deploying it is the Developers' work, like building it.
  // ...and a habitat is only finished when somebody can walk to it, which is now one of its own
  // acceptance criteria rather than a paths item of its own. Same work, same seat: the run that
  // joins it to the way in is the Developers'.
  const undeployed = state.backlog.find((it) => (it.category === 'path' || it.category === 'enclosure')
    && it.design && (it.status === 'done' || it.status === 'committed') && it.started
    && !(state.connectors ?? []).some((c) => c.itemId === it.id));
  if (undeployed) {
    const run = pathRunFor(state, undeployed);
    if (run) return { action: { type: 'ADD_CONNECTOR', connector: run },
                      says: `Ran a path to ${undeployed.name}, so you can get there without crossing the grass.` };
  }
  return null;
}

/** Pull the next piece, when there is room for it.
 *
 *  Self-managing: they take their own next piece rather than waiting to be given one, and the WIP
 *  limit is what bounds it - so they finish before starting more. `dev` is who is taking it, where
 *  a particular person is; without one the Developers take it as a collective and the board writes
 *  down whoever has least on. */
function pullNext(state: ZooGameState, dev?: ScrumTeamMember): AiMove | null {
  const doing = state.backlog.filter((it) => it.status === 'committed' && it.started).length;
  const wip = activeWipLimit(state);
  if (wip !== 0 && doing >= wip) return null;
  // Only something that can actually start. An animal whose habitat is not built yet
  // cannot, and proposing it anyway spun forever: the move was refused by the engine,
  // the item stayed unstarted, and the same move came back on the next tick.
  // The work-in-progress limit decides how much is on the go at once, and the day's clock
  // decides when the day is over. Neither of them is a budget the work is priced against:
  // what a team gets through in a day is their velocity, and the game measures it.
  const canStart = state.backlog.filter((it) => it.status === 'committed' && !it.started
    && enclosureReady(state, it));
  // The person at the table chooses first.
  //
  // A colleague is a named person here, and a named person does not reach across you for the
  // headline card the moment the day opens. Reported from playing it: "The AI Dev's start building
  // stuff straight away. They have picked the interesting items i.e. an enclosure. A human player
  // should pull first and the AIs follow with other items like the toilet."
  //
  // Two rules, and both of them are the game making room for you rather than anything the Guide
  // says. The Sprint Backlog belongs to the Developers and a real team would take the top of it;
  // what a real team would also do is ask the person standing there what they want to pick up.
  if (dev) {
    const yours = yourDev(state);
    const youHaveOne = !!yours && state.backlog.some((it) => it.status === 'committed' && it.started
      && !it.design && it.sprintNumber === state.sprintNumber && it.pulledBy === yours.id);
    // One: nobody pulls while you have nothing in hand and there is something you could take.
    if (!youHaveOne && canStart.length) return null;
  }
  // Two: and when they do pull, they take from the BOTTOM of the Sprint Backlog rather than the
  // top, so the work the Product Owner ordered highest is still there when you come back. The
  // toilets, not the lion enclosure.
  const next = dev ? canStart[canStart.length - 1] : canStart[0];
  if (!next) return null;
  const take: ZooAction = { type: 'START_ITEM', id: next.id, devId: dev?.id };
  // Where a habitat or a building goes is a product decision - it is what a visitor walks
  // up to, and in what order - so they ask rather than let the layout decide it quietly.
  // Only for things with a footprint worth arguing about: nobody needs consulting about
  // where a path is drawn or which patch of grass a shrub goes on.
  const worthAsking = (next.category === 'enclosure' || next.category === 'amenity') && !next.pos;
  const asked = state.pendingPlacement;
  if (worthAsking && !asked) {
    return { action: { type: 'ASK_PLACEMENT', id: next.id },
             says: `Where do you want ${next.name}? You know what the visitors are here for.` };
  }
  if (worthAsking && asked?.itemId === next.id) {
    // They do not wait forever. An unanswered question costs you the decision, which is
    // the truer lesson and means a Product Owner who has wandered off cannot stall a
    // Sprint. Measured on the day clock, so the wait is in the game's own time.
    if (asked.askedAt - state.daySecondsLeft < ASK_PATIENCE_SECONDS) return null;
    return { action: take,
             says: `No word on where ${next.name} goes, so we have put it where there is room.` };
  }
  return { action: take, says: `Taking ${next.name} next.` };
}

/** What a habitat or a building still needs before it is built: a size, and what it offers. The
 *  reducer used to fill these in for a build the game made; a player chooses them, so this does. */
function finishSetup(state: ZooGameState, item: BacklogItem): AiMove | null {
  if (item.category === 'enclosure' && !item.enclosureSize) {
    return { action: { type: 'SET_ENCLOSURE', id: item.id, size: sizeForTheAnimals(item, state.backlog) }, says: 'sized it' };
  }
  if (item.category === 'amenity' && !item.services) {
    const wanted = wantedServices(item);
    if (wanted) return { action: { type: 'SET_SERVICES', id: item.id, services: wanted }, says: 'chose what it offers' };
  }
  return null;
}

/** The Developers' next move, as a player would make it, or null when there is nothing to do. */
export function developersTurn(state: ZooGameState, mustAgree: readonly string[] = ALL_SEATS): AiMove | null {
  const goalAgreed = mustAgree.every((s) => state.sprintGoalAgreed.includes(s));
  const topic = state.planningTopic ?? 'why';

  // Topic one comes before the work. The whole Scrum Team defines the Sprint Goal, so the
  // Developers say whether they are in before they start sizing or selecting against it.
  if (state.phase === 'planning' && state.sprintGoal.trim() && !state.sprintGoalAgreed.includes('developer')) {
    return { action: { type: 'AGREE_SPRINT_GOAL', seat: 'developer' },
             says: 'We are agreed on that Sprint Goal, and we will forecast against it.' };
  }
  // Sizing is the Developers'. They do it when there is something unsized near the top,
  // and they say the number rather than just applying it.
  const item = topUnsized(state);
  if (item && (state.phase === 'refine' || state.phase === 'planning')) {
    const points = settle(pokerHand(item, state.gameSeed, state.dodAgreed));
    return { action: { type: 'ESTIMATE_ITEM', id: item.id, points },
             says: `We sized ${item.name} at ${points}.` };
  }
  // Sprint Planning topic two: what they think they can finish. The Product Owner proposes
  // where the value is; selecting against it is the Developers' call, so if nobody is in
  // those seats this is where the game would otherwise sit and wait forever.
  if (state.phase === 'planning' && state.sprintGoal.trim() && goalAgreed && topic === 'what') {
    if (state.forecast.length === 0) {
      const capacity = sprintCapacity(state).points;
      const ready = state.backlog.filter((x) => x.status === 'backlog' && isReady(x));
      const taken = new Set<string>();
      let pts = 0;
      const room = (cost: number) => taken.size === 0 || pts + cost <= capacity;
      const add = (it: BacklogItem) => { taken.add(it.id); pts += it.estimate; };
      for (const it of ready) {
        if (taken.has(it.id)) continue;
        // An animal cannot start until its habitat is built, so selecting one without the
        // other is selecting work the Sprint cannot begin. Reported from a game: the Lion was
        // taken at eight points, the Lion Enclosure it needed was one point and did not fit,
        // and a whole Sprint went by with a Sprint Backlog of one item nobody could start.
        if (it.category === 'exhibit' && !enclosureReady(state, it)) {
          const home = state.backlog.find((x) => x.id === it.enclosureId);
          if (!home || home.status !== 'backlog' || !isReady(home)) continue;   // nothing we can do about it here
          if (!taken.has(home.id)) {
            if (!room(home.estimate + it.estimate)) continue;   // the pair does not fit; leave both
            add(home);
          }
        }
        if (!room(it.estimate)) continue;
        add(it);
      }
      const take = [...taken];
      // Always at least the top item, whatever the measurement says. A Sprint that
      // delivered nothing leaves a velocity of zero, and taking only what fits inside
      // zero is taking nothing - so the Developers forecast nothing, forever, and a team
      // that had one bad Sprint could never start another. A team in that position picks
      // up the most valuable thing and finds out.
      if (take.length) return { action: { type: 'SET_FORECAST', ids: take },
        says: capacity > 0
          ? `We think we can finish ${take.length} item${take.length === 1 ? '' : 's'}, about ${pts} points. That is what our last Sprints say we manage.`
          : `We delivered nothing last Sprint, so we have no velocity to go on. We will take ${take.length === 1 ? 'the top item' : `${take.length} items`} and find out.` };
    }
  }

  // Topic three: how it gets done. Also theirs, and the step the game blocked on when a
  // Product Owner sat alone - gated away from them, and nobody else to do it. It waits for
  // topic three: writing the steps while the team is still choosing the work is answering a
  // question nobody has asked yet.
  if (state.phase === 'planning' && goalAgreed && topic === 'how') {
    const unplanned = state.backlog.find((it) => state.forecast.includes(it.id) && !(it.tasks ?? []).some((t) => t.label.trim()));
    if (unplanned) return { action: { type: 'SET_TASKS', id: unplanned.id, tasks: suggestTasks(unplanned) },
      says: `We planned the steps for ${unplanned.name}.` };
  }

  // Self-managing: they pull their own next piece when there is room, rather than waiting
  // to be given one. Bounded by the WIP limit, so they finish before starting more.
  //
  // This is the COLLECTIVE form of it - the Developers as one set of hands - for a game where
  // nobody is sitting in that seat at all. Where somebody is, which is every solo game, the
  // game plays the other Developers as people instead and `aiDevTurn` is their turn.
  if (state.phase === 'sprint' && state.dayStage === 'building') {
    // Build anything started that has no committed design yet. The test used to be
    // "is the design incomplete", which quietly skipped a path: its preset already meets
    // its own criteria, so it looked finished, was never built, never had a design stored,
    // and could never leave Doing. Nothing about it was the route.
    // ...but never something a person has in their hands. A draft design is somebody shaping the
    // thing right now, and a seat played by the game used to build it out from under them: the
    // game's design was stored as the item's, the takeover then read that instead of the draft,
    // and every further click vanished. Reported as "I still cannot move this PBI to Done" - the
    // work was being undone as fast as it was done.
    // ...nor one of the other Developers' cards that still owes time. One set of hands and three
    // people are two ways to play the same seat and never both at once, so this should never
    // find one - but a collective that finished somebody else's paced work the instant they took
    // it on would undo the pacing entirely, which is worth one clause to make impossible.
    const building = state.backlog.find((it) => it.status === 'committed' && it.started
      && !it.design && !it.draftDesign);
    if (building) return finishSetup(state, building) ?? buildMove(state, building);

    const ticked = tickOffPlan(state.backlog.filter((it) => it.status === 'committed'
      && it.started && it.design));
    if (ticked) return ticked;

    const keeping = teamHousekeeping(state);
    if (keeping) return keeping;

    const pulled = pullNext(state);
    if (pulled) return pulled;
  }
  return null;
  }
