import type { ZooGameState, ZooAction, BacklogItem } from './types';
import type { SeatName } from './useZooSessions';
import { pokerHand, activeWipLimit, notReady, isReady, suggestTasks, sprintCapacity } from './engine';

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
      const doing = state.backlog.filter((it) => it.status === 'committed' && it.started).length;
      const wip = activeWipLimit(state);
      if (wip === 0 || doing < wip) {
        const next = state.backlog.find((it) => it.status === 'committed' && !it.started);
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
