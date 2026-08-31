import type { ZooGameState, ZooAction, BacklogItem, ZooConnector } from './types';
import type { SeatName } from './useZooSessions';
import { pokerHand, activeWipLimit, notReady, isReady, suggestTasks, sprintCapacity, enclosureReady, isSignOffTask, secondsPerPoint } from './engine';
import { DAY_SECONDS } from './config';
import { presetFor, floraColors, isLandscapeType, type ItemDesign } from './design';

// A seat nobody is sitting in, played by the game.
//
// This is what lets one person, or a pair, see a whole Scrum Team work - and for a solo
// learner it is the single-player form of seat gating: take the Product Owner seat and the
// Developers will size the work and tell you what they can finish, rather than you doing
// all three jobs and never being argued with.
//
// **Almost none of this needs a language model**, which was worth finding out before
// reaching for one. The game already holds the judgement: `pokerHand` gives a Fibonacci
// spread around an item's true size, `notReady` says whether something can be planned, the
// WIP limit says whether there is room to start. So an AI seat is mostly the accountability
// applied to what the game already knows, and that keeps three promises the plan worried
// about - it stays deterministic (so a trainer can still replay a seed), it costs nothing,
// and it answers instantly.
//
// The Product Owner's ordering of the Backlog is the one place real judgement is wanted,
// and that already has an edge function (`zoo-po-refine`); it is left where it is rather
// than dragged in here, so a session can run with no network at all.
//
// Each seat acts only at the moments its own accountability owns, which is what keeps this
// from being a bot playing the game for you.

export interface AiMove {
  action: ZooAction;
  /** Roughly how much of the Sprint's work this move is, in the same points the team
   *  forecasts in. The pacing upstairs turns it into time, so that a Sprint's forecast takes
   *  about a Sprint - which is the whole tension the game is built on, and which vanished
   *  when the seats did twenty-one points in eighteen seconds. Small moves carry nothing:
   *  the effort of an item is charged once, when it is built. */
  weight?: number;
  /** What the seat says. The point is not the move, it is that somebody in that
   *  accountability tells you why - which is the thing a solo player never gets. */
  says: string;
}

/** The median of the hand, which is what a table usually settles on. */
const settle = (hand: number[]): number => [...hand].sort((a, b) => a - b)[Math.floor(hand.length / 2)];

const topUnsized = (s: ZooGameState): BacklogItem | undefined =>
  s.backlog.find((it) => it.status === 'backlog' && it.unsized && it.category !== 'epic');

/** A design that meets the Definition of Done for whatever this is.
 *
 *  Built from the same lists the studio's controls are built from, rather than a fixed palette,
 *  so it can only ever satisfy criteria the game actually asks for. A car park has tarmac and
 *  markings and no foliage; asking for foliage would leave it unbuildable forever. */
export function aiDesign(item: BacklogItem): ItemDesign {
  const base = presetFor(item);
  const colors: Record<string, string> = { ...base.colors };
  const parts: Record<string, string> = { ...(base.parts as Record<string, string>) };
  const paint = (key: string, fallback: string) => { if (!colors[key]) colors[key] = fallback; };

  if (item.category === 'exhibit') {
    // Stocked rather than painted: a pair, which fits any habitat the game offers.
    return { ...base, colors, parts, group: base.group ?? { males: 1, females: 1, juveniles: 0, cubs: 0 } };
  }
  if (item.category === 'enclosure') { paint('ground', '#8c7a5b'); paint('fence', '#6b5b45'); }
  if (item.category === 'amenity') {
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
  const here = state.backlog.filter((i) => i.zone === item.zone && i.pos);
  const target = here.find((i) => i.category === 'enclosure') ?? here.find((i) => i.category === 'amenity') ?? here[0];
  if (!target?.pos) return null;
  const design = item.design ?? presetFor(item);
  return {
    id: `run-${item.id}`,
    itemId: item.id,
    // From the way in, to the thing worth walking to.
    a: { x: Math.round(target.pos.x), y: Math.round(target.pos.y) + 220 },
    b: { x: Math.round(target.pos.x), y: Math.round(target.pos.y), featureId: target.id },
    bends: [],
    thickness: Number(design.parts.thickness ?? 14) || 14,
    color: design.colors.path ?? '#b9a888',
  };
}

/** Every accountability, which is who has to agree a Sprint Goal unless a caller says otherwise. */
const ALL_SEATS: SeatName[] = ['product_owner', 'scrum_master', 'developer'];

/** What this AI accountability would do now, or nothing if it is not their turn.
 *
 *  `mustAgree` is who still has to agree the Sprint Goal before topic two can begin - the same
 *  list the screen waits on. It is passed in rather than assumed because a seat nobody is holding
 *  and no AI is playing cannot agree to anything, and the Developers would wait on it forever. */
export function aiTurn(state: ZooGameState, seat: SeatName, mustAgree: readonly string[] = ALL_SEATS): AiMove | null {
  // Topic one before topic two, for the seats played by the game as much as for anybody.
  //
  // They used to select and plan against a Sprint Goal that had only been PROPOSED: the Product
  // Owner wrote it, the Developers agreed with themselves, and off they went - so a Product Owner
  // still reading it was told the work had been chosen and the steps written for it, on a screen
  // that said nothing was forecast yet. Agreeing the Goal is what topic one is; work chosen
  // before it is work chosen against nothing.
  const goalAgreed = mustAgree.every((s) => state.sprintGoalAgreed.includes(s));
  const topic = state.planningTopic ?? 'why';
  if (seat === 'developer') {
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
      const points = settle(pokerHand(item, state.gameSeed));
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
        const take: string[] = [];
        let pts = 0;
        for (const it of ready) {
          if (take.length && pts + it.estimate > capacity) continue;
          take.push(it.id); pts += it.estimate;
        }
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
    if (state.phase === 'sprint' && state.dayStage === 'building') {
      // Finish before starting. Pulling work and never building it left a Sprint that could
      // only end with nothing Done, which is the opposite of the lesson - and a team that
      // pulls a second thing while the first is unfinished is the habit the WIP limit exists
      // to break, so it would have been the wrong order even if it worked.
      // Build anything started that has no committed design yet. The test used to be
      // "is the design incomplete", which quietly skipped a path: its preset already meets
      // its own criteria, so it looked finished, was never built, never had a design stored,
      // and could never leave Doing. Nothing about it was the route.
      const building = state.backlog.find((it) => it.status === 'committed' && it.started && !it.design);
      if (building) {
        // Only what today can still afford. Building regardless and charging afterwards let
        // a day with five seconds left absorb an eight-point item, so a Sprint delivered
        // whatever it liked and capacity meant nothing. A day that cannot take it ends, and
        // the work waits for tomorrow - which is what running out of day looks like.
        const cost = secondsPerPoint(state) * building.estimate;
        const wholeDay = cost >= DAY_SECONDS;   // bigger than any day; it has to start somewhere
        if (state.daySecondsLeft >= cost || (wholeDay && state.daySecondsLeft >= DAY_SECONDS * 0.9)) {
          return { action: { type: 'BUILD_ITEM', id: building.id, design: aiDesign(building) },
                   says: `Built ${building.name} to the Definition of Done.`,
                   weight: building.estimate };
        }
        return null;   // out of day. The clock runs down and the Daily Scrum comes round.
      }

      // Then tick their own plan off. The sign-off step is not theirs - that is the Product
      // Owner accepting the work - and ticking the last of the rest is what moves an item to
      // Done, so leaving the plan untouched left everything sitting in Doing.
      for (const it of state.backlog.filter((x) => x.status === 'committed' && x.started && x.design)) {
        const task = (it.tasks ?? []).find((t) => !t.done && t.label.trim() && !isSignOffTask(t.label));
        if (task) return { action: { type: 'TOGGLE_TASK', id: it.id, taskId: task.id },
                           says: `${task.label} - done, on ${it.name}.` };
      }

      // A pathway is only finished when a run of it actually reaches the zone. The park
      // answers that criterion itself - it either has a path running there or it does not -
      // so a path could be built, planned and Done, and still never be releasable, because
      // nobody had drawn the run. Deploying it is the Developers' work, like building it.
      const undeployed = state.backlog.find((it) => it.category === 'path' && it.design
        && (it.status === 'done' || it.status === 'committed') && it.started
        && !(state.connectors ?? []).some((c) => c.itemId === it.id));
      if (undeployed) {
        const run = pathRunFor(state, undeployed);
        if (run) return { action: { type: 'ADD_CONNECTOR', connector: run },
                          says: `Ran ${undeployed.name} to the ${run.b.featureId ? 'zone' : 'park'}, so you can get there without crossing the grass.` };
      }

      const doing = state.backlog.filter((it) => it.status === 'committed' && it.started).length;
      const wip = activeWipLimit(state);
      if (wip === 0 || doing < wip) {
        // Only something that can actually start. An animal whose habitat is not built yet
        // cannot, and proposing it anyway spun forever: the move was refused by the engine,
        // the item stayed unstarted, and the same move came back on the next tick.
        const next = state.backlog.find((it) => it.status === 'committed' && !it.started
          && enclosureReady(state, it));
        if (next) return { action: { type: 'START_ITEM', id: next.id },
                           says: `Taking ${next.name} next.` };
      }
    }
    return null;
  }

  if (seat === 'scrum_master') {
    // "Ensure that all Scrum events take place." The Daily Scrum is the one the game lets
    // you skip, and skipping it is what lets a blocker grow overnight - so the Scrum Master
    // holding it is the clearest thing this accountability actually does here.
    if (state.phase === 'planning' && state.sprintGoal.trim()
        && !state.sprintGoalAgreed.includes('scrum_master')) {
      return { action: { type: 'AGREE_SPRINT_GOAL', seat: 'scrum_master' },
               says: 'Agreed. It says why the Sprint is valuable, which is what it is for.' };
    }
    // "Ensure that all Scrum events take place." Sprint Planning is one event with three topics
    // in an order, and somebody has to move the agenda on - otherwise a team of seats played by
    // the game sits on topic one forever waiting to be told.
    //
    // Each of these fires once and only forwards: once there is a forecast the first cannot fire
    // again, and once there are steps the second cannot. So a Product Owner who walks back to
    // topic one to re-read the Goal is left there rather than being dragged forward again.
    if (state.phase === 'planning' && goalAgreed && topic === 'why' && state.forecast.length === 0) {
      return { action: { type: 'SET_PLANNING_TOPIC', topic: 'what' },
               says: 'The Goal is agreed, so that is topic one. What can we finish this Sprint?' };
    }
    if (state.phase === 'planning' && topic === 'what' && state.forecast.length > 0
        && !state.backlog.some((it) => state.forecast.includes(it.id) && (it.tasks ?? []).some((t) => t.label.trim()))) {
      return { action: { type: 'SET_PLANNING_TOPIC', topic: 'how' },
               says: 'We have what. Topic three is how it gets done.' };
    }
    if (state.phase === 'sprint' && state.dayStage === 'dailyScrum') {
      return { action: { type: 'RUN_DAILY_SCRUM' },
               says: state.pendingImpediment
                 ? 'We hold the Daily Scrum and adapt around the blocker. Left alone it grows overnight.'
                 : 'We hold the Daily Scrum. The event is how the team knows where it is.' };
    }
    return null;
  }

  // Product Owner. They proposed it, so they are in - but it is still the team's to agree.
  if (state.phase === 'planning' && state.sprintGoal.trim()
      && !state.sprintGoalAgreed.includes('product_owner')) {
    return { action: { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' },
             says: 'That is the value I am proposing this Sprint.' };
  }
  // What the visitors asked for becomes a Backlog item when they decide it does, which is
  // the value call the Review exists to produce.
  if (state.phase === 'review' && state.signals.length > 0) {
    return { action: { type: 'ACCEPT_SIGNAL', index: 0 },
             says: `Visitors asked for this. I am putting it on the Backlog: ${state.signals[0].suggestion}.` };
  }
  return null;
}

/** Is there anything an AI in this seat should be doing? Used to decide whether to show that
 *  a seat is thinking, without taking the move. */
export const aiHasTurn = (state: ZooGameState, seat: SeatName): boolean => aiTurn(state, seat) !== null;

/** Why an item cannot be planned yet, for a seat that wants to say so rather than silently
 *  skip it. Re-exported so the AI seats and the screens give the same reason. */
export { notReady };
