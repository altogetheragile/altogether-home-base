import type { BacklogItem, ZooGameState, ZooAction } from './types';

// ============= What the work actually cost =============
//
// The game watches every press already - that is what the trail is - and it knows what the clock
// did. So it can answer a question a team can otherwise only guess at: what did a 3 actually cost
// us, and what did an 8?
//
// It is kept for INSPECTION and nothing else. The temptation is to feed it back into the sizes, and
// that must not happen: an estimate derived from the time it took makes velocity a tautology. You
// delivered twenty points because the points were defined by what you delivered, and a forecast can
// no longer be wrong - which is the one thing a forecast is for. This project has already made that
// mistake twice in different clothes: pricing work from the team's own capacity guess made the guess
// self-fulfilling, and pricing it in seconds of clock turned a Sprint into a timer.
//
// So the game measures, and the Scrum Team decides. That is inspect and adapt with the two halves
// the right way round.
//
// The measures are the ones the Kanban literature uses - Vacanti's cycle time and throughput -
// rather than anything invented here:
//
//   seconds   how long the item was IN DOING, elapsed. Not effort attributed to it: if three
//             things are on the go, all three are ageing, which is exactly what makes starting
//             three things expensive and is the whole argument for a work-in-progress limit.
//   presses   how many times somebody did something to it. A second measure because elapsed time
//             is confounded by dithering and by the other items in flight, and presses are
//             confounded by fiddling with colours. Neither is the truth; together they bracket it.

/** What one item cost, as the game watched it happen. */
export interface WhatItCost {
  /** Seconds of build day it spent in Doing. */
  seconds: number;
  /** Presses aimed at it while it was there. */
  presses: number;
}

/** Actions that are not somebody working on the item, even though they name it. Ticking the clock
 *  is not a press, and neither is the game's own bookkeeping. */
const NOT_WORK = new Set(['TICK_DAY', 'TICK_SCRUM', 'SET_CLOCK_PAUSED', 'START_ITEM', 'FINISH_ITEM']);

/** Which item a press was aimed at, where it was aimed at one at all.
 *
 *  Actions name their item three different ways - `id` on most, `itemId` on a connector, and
 *  `check-<id>` on the question the Product Owner answers - so this is the one place that knows,
 *  rather than three places that each know a bit. */
export function aimedAt(action: ZooAction): string | undefined {
  const a = action as unknown as { id?: string; itemId?: string; connector?: { itemId?: string } };
  if (a.connector?.itemId) return a.connector.itemId;
  if (a.itemId) return a.itemId;
  if (typeof a.id === 'string') return a.id.startsWith('check-') ? a.id.slice('check-'.length) : a.id;
  return undefined;
}

/** Add one press, and one second of the day, to whatever they belong to.
 *
 *  In the reducer beside the park's own checks, for the same reason those are: there is no action
 *  that can forget to. Only work that is in Doing is counted - an item ages while somebody has it,
 *  and stops the moment it is Done.
 */
export function tallyWork(before: ZooGameState, after: ZooGameState, action: ZooAction): ZooGameState {
  if (after.phase !== 'sprint' || after.learnMode) return after;
  const doing = (it: BacklogItem) => it.status === 'committed' && !!it.started;
  const tick = action.type === 'TICK_DAY' && after.dayStage === 'building'
    && after.daySecondsLeft < before.daySecondsLeft;
  const pressed = NOT_WORK.has(action.type) ? undefined : aimedAt(action);
  if (!tick && !pressed) return after;
  let touched = false;
  const backlog = after.backlog.map((it) => {
    if (!doing(it)) return it;
    const add = { seconds: tick ? 1 : 0, presses: pressed === it.id ? 1 : 0 };
    if (!add.seconds && !add.presses) return it;
    touched = true;
    const was = it.cost ?? { seconds: 0, presses: 0 };
    return { ...it, cost: { seconds: was.seconds + add.seconds, presses: was.presses + add.presses } };
  });
  return touched ? { ...after, backlog } : after;
}

/** What each SIZE cost, across everything this team has finished.
 *
 *  Grouped by the size the team gave it, because that is the question: a 3 and an 8 are a claim
 *  about relative effort, and this is the only place the claim meets what happened. Sizes with one
 *  item in them are left out - one is an anecdote.
 */
export interface SizeCost {
  points: number;
  items: number;
  /** The middle item, not the average: one habitat that somebody wandered off in the middle of
   *  drags a mean about and says nothing about the rest. */
  seconds: number;
  presses: number;
}

const middle = (ns: number[]): number => {
  const s = [...ns].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
};

export function costBySize(state: ZooGameState): SizeCost[] {
  const done = state.backlog.filter((it) => (it.status === 'done' || it.status === 'open')
    && it.cost && it.cost.seconds > 0 && it.estimate > 0);
  const by = new Map<number, BacklogItem[]>();
  for (const it of done) by.set(it.estimate, [...(by.get(it.estimate) ?? []), it]);
  return [...by.entries()]
    .map(([points, items]) => ({
      points,
      items: items.length,
      seconds: middle(items.map((it) => it.cost!.seconds)),
      presses: middle(items.map((it) => it.cost!.presses)),
    }))
    .sort((a, z) => a.points - z.points);
}

/** Two sizes that cost the same are not two sizes.
 *
 *  The finding worth putting in front of a team, and the reason for keeping any of this. It is
 *  deliberately not a nudge to accept: what to do about it - re-size them, split the big one, or
 *  decide the numbers were right and the Sprint was odd - is the team's to argue about.
 *
 *  Only pairs that both have something to say: two sizes apart on the scale, at least two items
 *  each, and close enough in what they cost that the gap between them is not real.
 */
export function sizesThatAgree(state: ZooGameState): [SizeCost, SizeCost] | null {
  const rows = costBySize(state).filter((r) => r.items >= 2);
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const small = rows[i], big = rows[j];
      // A size at least twice the other, that did not cost even half as much again.
      if (big.points >= small.points * 2 && big.seconds < small.seconds * 1.5) return [small, big];
    }
  }
  return null;
}
