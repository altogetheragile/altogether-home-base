import type { ZooAction } from './types';

// ============= What was just pressed, so a fault can be replayed instead of described =============
//
// The game is played by somebody who is not the person who can fix it, and the gap between them is
// always the same sentence: "I think I pressed the ground colour, then Look Inside, and then it was
// gone." Memory is an honest witness and a poor one - it remembers what it MEANT to do, drops the
// press that did nothing, and never remembers the tick where a seat played by the game did
// something in the background.
//
// Every change in this game goes through one reducer, so the last few dozen actions are free to
// keep. A trail is the game's own account of what happened, in the order it happened, and it
// replays: the same actions applied to the same seed from the same start give the same fault.
//
// It is deliberately small and deliberately dumb. No timestamps that would make two runs differ, no
// state snapshots, nothing about who was signed in. Just the seed, and what was pressed.

/** How many actions to keep. Enough to cover "what did I do in the last minute or so", and small
 *  enough to paste into a message. Ticks are not kept, so a minute of play is a handful of entries
 *  rather than sixty. */
const KEEP = 60;

/** The clock's heartbeat, which is every second and says nothing about what anybody did. */
const NOISE = new Set(['TICK_DAY', 'TICK_SCRUM']);

export interface Trail {
  /** The seed the game started from, so the replay starts where the game did. */
  seed: number;
  /** What was pressed, oldest first. */
  actions: ZooAction[];
}

const kept: ZooAction[] = [];
let seed = 1;

/** Remember the seed this game started from. */
export function trailStartedAt(gameSeed: number): void {
  seed = gameSeed;
}

/** Keep one action. Called for every action the game applies, including the ones seats played by the
 *  game send - which are exactly the ones a player cannot tell you about. */
export function remember(action: ZooAction): void {
  if (NOISE.has(action.type)) return;
  kept.push(action);
  if (kept.length > KEEP) kept.splice(0, kept.length - KEEP);
}

/** What has been pressed, ready to be pasted into a message or replayed in a test. */
export function trail(): Trail {
  return { seed, actions: [...kept] };
}

/** Start again - a new game means a new trail. */
export function forgetTrail(): void {
  kept.length = 0;
}
