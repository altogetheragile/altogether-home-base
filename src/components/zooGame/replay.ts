import { initialZooState } from './config';
import { reducer } from './useZooGame';
import type { Trail } from './trail';
import type { ZooGameState } from './types';

// ============= Replaying what somebody pressed =============
//
// The other half of the trail. A report that arrives as a script rather than a description can be
// run: the same seed, the same actions, the same fault, in a test that fails until it is fixed and
// then stays as the reason it cannot come back.
//
// This is only sound because the reducer is pure - no clock, no randomness that is not seeded, no
// I/O - which it has to be anyway for a shared session to replay actions that lost a race.

/** Every state the trail passed through, starting with the one it started from.
 *
 *  The whole sequence rather than the last state, because "when did it go" is the question worth
 *  asking: run over the states looking for the first one where the thing is missing, and the action
 *  that made it is the one before. */
export function replay(t: Trail): ZooGameState[] {
  const out: ZooGameState[] = [initialZooState(t.seed)];
  for (const action of t.actions) out.push(reducer(out[out.length - 1], action));
  return out;
}

/** The first moment something stopped being true, and what was pressed to do it.
 *
 *  `holds` is whatever the report is about - "the pen still has its trees", "the ground is still
 *  green" - as a question asked of a state. Returns null when it never stopped being true, which is
 *  the answer that means "this is not where the fault is". */
export function whenItBroke(t: Trail, holds: (s: ZooGameState) => boolean): { at: number; action: string } | null {
  const states = replay(t);
  for (let i = 1; i < states.length; i += 1) {
    if (holds(states[i - 1]) && !holds(states[i])) {
      return { at: i - 1, action: t.actions[i - 1].type };
    }
  }
  return null;
}
