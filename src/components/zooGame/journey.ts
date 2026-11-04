import type { ZooGameState } from './types';
import { enoughToStart } from './engine';
import { eventPill } from './header';

// Where you are in the whole of Scrum, on one line.
//
// The pill said "Before Sprint 1", which names a step and says nothing about where it sits. A game
// with nobody to lead it has to show the way itself (docs/ZOO_GAME_FLOW.md, "Led Through It"), so
// the eight steps are laid out in order: the finished ones ticked, the current one lit.
//
// After the first Retrospective the line loops back to Sprint Planning. The first four steps are
// the setting up, done once; the last four are the Sprint, which is the cycle.

export type JourneyKey = 'goal' | 'backlog' | 'refinement' | 'dod' | 'planning' | 'sprint' | 'review' | 'retro';

export interface JourneyStep {
  key: JourneyKey;
  label: string;
  /** `passed`: the game went on without it, which a trainer's flow can do with the Definition of
   *  Done. Shown as missed rather than ticked, because it was. */
  status: 'done' | 'now' | 'todo' | 'passed';
  /** For the step you are on, where you are inside it: which topic of Planning, which day. */
  detail?: string;
}

export const JOURNEY: { key: JourneyKey; label: string }[] = [
  { key: 'goal', label: 'Product Goal' },
  { key: 'backlog', label: 'Product Backlog' },
  { key: 'refinement', label: 'Refinement' },
  { key: 'dod', label: 'Definition of Done' },
  { key: 'planning', label: 'Sprint Planning' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'review', label: 'Sprint Review' },
  { key: 'retro', label: 'Retrospective' },
];

/** The four steps of a Sprint, in the order the cycle runs them. */
const CYCLE: JourneyKey[] = ['planning', 'sprint', 'review', 'retro'];

/** Which step the game is on. Refinement and the Definition of Done share a screen, so which of
 *  the two it is depends on what is still to do there: enough Ready to start first, then Done
 *  agreed. */
function current(state: ZooGameState): JourneyKey | null {
  switch (state.phase) {
    case 'intro': return 'goal';
    case 'brief': return 'backlog';
    case 'refine': return enoughToStart(state) && !state.dodAgreed ? 'dod' : 'refinement';
    case 'planning': return 'planning';
    case 'sprint': return 'sprint';
    case 'review': return 'review';
    case 'retro': return 'retro';
    default: return null;
  }
}

export function journey(state: ZooGameState): { steps: JourneyStep[]; sprint: number; looped: boolean } {
  const now = current(state);
  const at = now ? JOURNEY.findIndex((s) => s.key === now) : JOURNEY.length;
  // From Sprint 2 the setting up is behind the team for good, and the cycle starts over.
  const looped = state.sprintNumber > 1;
  const pill = eventPill(state).text;
  const steps = JOURNEY.map((s, i): JourneyStep => {
    // Agreed is agreed, whichever step the screen is on: the team can write it before a Sprint's
    // worth is Ready.
    // Agreeing to start without one is not a Definition of Done, so it is not ticked.
    if (s.key === 'dod' && state.dodAgreed && s.key !== now) return { ...s, status: state.definitionOfDone.length ? 'done' : 'passed' };
    if (s.key === now) {
      const detail = s.key === 'planning' ? pill.replace(/^Sprint Planning · /, '')
        : s.key === 'sprint' ? pill : undefined;
      return { ...s, status: 'now', ...(detail ? { detail } : {}) };
    }
    // A step of the Sprint is only behind you within this Sprint: in Sprint 2 the Review is ahead
    // again, whatever happened in Sprint 1.
    const behind = looped && !CYCLE.includes(s.key) ? true : i < at;
    if (!behind) return { ...s, status: 'todo' };
    // Refinement is behind you once the game has moved on, even if it moved on short: Planning
    // will say so when there is not enough Ready. The Definition of Done is different - it either
    // was agreed or it was not, and a flow can leave it out.
    if (s.key === 'dod' && !(state.dodAgreed && state.definitionOfDone.length)) return { ...s, status: 'passed' };
    return { ...s, status: 'done' };
  });
  return { steps, sprint: state.sprintNumber, looped };
}
