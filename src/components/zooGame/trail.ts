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

/** How many actions to keep. Enough to cover what somebody did in the last several minutes, and
 *  small enough to paste into a message. */
const KEEP = 80;

/** ...unless the game is being RECORDED, in which case keep the lot.
 *
 *  A bug report wants a window: the last few minutes, short enough to paste. Recording a zoo to
 *  show somebody wants the opposite - the whole game from the first press, because the example is
 *  the finished thing and a window on the end of it replays to a zoo with no beginning.
 *
 *  Off unless asked for, so nothing about the ordinary game changes. */
let everything = false;
export function recordEverything(on = true): void {
  everything = on;
}
/** Whether this is an authoring session, so the game can say so on the screen. Somebody whose every
 *  press is being kept should be told, and should not have to know where the admin menu is to get
 *  the result out at the end. */
export function recording(): boolean {
  return everything;
}

/** The clock's heartbeat, which is every second and says nothing about what anybody did. */
const NOISE = new Set(['TICK_DAY', 'TICK_SCRUM']);

/** Actions that arrive in floods, and what makes two of them the same gesture.
 *
 *  A drag sends one action per pointer move, and typing sends one per keystroke. The first real
 *  trail anybody sent back was sixty entries of which fifty were two drags - so the window reached
 *  back about a minute, and the fault being reported had happened before it. Only the last of a
 *  flood says anything: the state is the last position, not the path the pointer took to it.
 */
const FLOOD: Record<string, (a: Record<string, unknown>) => string> = {
  MOVE_INSIDE: (a) => `${a.id}:${a.kind}:${a.index}`,
  SET_POS: (a) => `${a.id}`,
  SET_SPOT: (a) => `${a.id}`,
  SET_MEMBER_SPOT: (a) => `${a.id}:${a.member}`,
  SET_ITEM_SIZE: (a) => `${a.id}`,
  SET_ITEM_ROT: (a) => `${a.id}`,
  MOVE_COPY: (a) => `${a.id}:${a.index}`,
  UPDATE_CONNECTOR: (a) => `${a.id}`,
  SET_SPRINT_GOAL: () => 'sprint-goal',
  SET_PRODUCT_GOAL: () => 'product-goal',
  SET_DRAFT_DESIGN: (a) => `${a.id}`,
};

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
  // One entry per gesture, not one per pointer move: the last of a flood is the one that says what
  // happened, and the other forty are the path the pointer took to say it.
  const same = FLOOD[action.type];
  const last = kept[kept.length - 1];
  if (same && last && last.type === action.type
    && same(last as unknown as Record<string, unknown>) === same(action as unknown as Record<string, unknown>)) {
    kept[kept.length - 1] = action;
    return;
  }
  kept.push(action);
  if (!everything && kept.length > KEEP) kept.splice(0, kept.length - KEEP);
}

/** What has been pressed, ready to be pasted into a message or replayed in a test. */
export function trail(): Trail {
  return { seed, actions: [...kept] };
}

/** Start again - a new game means a new trail. */
export function forgetTrail(): void {
  kept.length = 0;
}
