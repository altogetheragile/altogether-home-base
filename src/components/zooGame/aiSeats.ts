import type { ZooGameState, ZooAction, BacklogItem } from './types';
import type { SeatName } from './useZooSessions';
import { pokerHand, activeWipLimit, notReady, isReady, suggestTasks, sprintCapacity, enclosureReady } from './engine';
import { presetFor, floraColors, isLandscapeType, isDesignDone, type ItemDesign } from './design';

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

/** What this AI accountability would do now, or nothing if it is not their turn. */
export function aiTurn(state: ZooGameState, seat: SeatName): AiMove | null {
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
    if (state.phase === 'planning' && state.sprintGoal.trim()) {
      if (state.forecast.length === 0) {
        const capacity = sprintCapacity(state).points;
        const take: string[] = [];
        let pts = 0;
        for (const it of state.backlog.filter((x) => x.status === 'backlog' && isReady(x))) {
          if (pts + it.estimate > capacity) continue;
          take.push(it.id); pts += it.estimate;
        }
        if (take.length) return { action: { type: 'SET_FORECAST', ids: take },
          says: `We think we can finish ${take.length} item${take.length === 1 ? '' : 's'}, about ${pts} points. That is what our last Sprints say we manage.` };
      }
      // Topic three: how it gets done. Also theirs, and the step the game blocked on when a
      // Product Owner sat alone - gated away from them, and nobody else to do it.
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
      const building = state.backlog.find((it) => it.status === 'committed' && it.started
        && !isDesignDone(it, it.design ?? it.draftDesign ?? presetFor(it)));
      if (building) return { action: { type: 'BUILD_ITEM', id: building.id, design: aiDesign(building) },
                             says: `Built ${building.name} to the Definition of Done.` };

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
