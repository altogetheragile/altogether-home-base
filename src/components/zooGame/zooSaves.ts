import type { ZooGameState } from './types';

// ============= Reading a saved game =============
//
// The whole game is one serialisable object, kept as a jsonb blob. That is a good trade while the
// shape holds still, and this shape does not: fields are added, renamed and retyped every week the
// game is worked on. A save taken today can be resumed tomorrow into a game that has moved, and
// nothing in the blob says which game wrote it.
//
// What that looked like: the load was a blind cast onto `ZooGameState` and a shallow merge over a
// fresh state, so anything nested that had drifted arrived as `undefined` or as the wrong type, and
// the game carried on with it. Not a crash - a zoo that is quietly wrong, hours later.
//
// So a save says which version wrote it, and a save that cannot be trusted is refused out loud. A
// clear "this was saved by an older game" is a better afternoon than a Sprint that behaves oddly.

/** The shape this build reads and writes.
 *
 *  Raise it when a change would make an older save WRONG rather than merely incomplete - a field
 *  that changed meaning or type. Adding a field with a sensible default does not need a raise: the
 *  merge over a fresh state covers that, which is what it is for. */
export const SAVE_VERSION = 2;
// 2: the plot grew from 820 x 700 to 1760 x 1080, so every position saved by an older game is in
//    the top-left corner of a park more than twice the size. The zoo would still be drawn - nothing
//    is ever hidden - but it would be a zoo crammed into one quarter of its own ground, which reads
//    as a broken game rather than an old one.

export type SaveRead =
  | { ok: true; state: ZooGameState; note?: string }
  | { ok: false; why: string };

/** A name to offer for a save, so that keeping a game is one press rather than a naming decision.
 *
 *  Proposed, not imposed: it goes into the field ready to be typed over. What it says is what tells
 *  one game from another in a list - which zoo, and when - because the list already shows where each
 *  one was left off, and repeating that in the name would waste the only line it has.
 */
export function proposeSaveName(state: Pick<ZooGameState, 'brief' | 'zones'>, now = new Date()): string {
  const zone = state.brief?.firstZone ?? state.zones?.find((z) => z !== 'Grounds' && z !== 'Facilities');
  // Written out rather than left to the platform's idea of a short month: Node says "Sept" where a
  // browser says "Sep", and a name that depends on which machine saved it is not a name.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
  return `${zone ? `${zone} zoo` : 'New zoo'} · ${day}`;
}

/** Whether this blob is a Build A Zoo game at all, and whether this build can read it. */
export function readSave(raw: unknown): SaveRead {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, why: 'That save is empty or unreadable.' };
  }
  const state = raw as Partial<ZooGameState> & { version?: unknown };
  // The Product Backlog is the one thing every saved game has, at every phase, in every version.
  if (!Array.isArray(state.backlog)) {
    return { ok: false, why: 'That does not look like a Build A Zoo save.' };
  }
  const version = state.version;
  if (typeof version !== 'undefined' && (typeof version !== 'number' || !Number.isInteger(version) || version < 0)) {
    return { ok: false, why: 'That save does not say which version of the game wrote it.' };
  }
  if (typeof version === 'number' && version > SAVE_VERSION) {
    return {
      ok: false,
      why: 'That game was saved by a newer version of Build A Zoo. Reload the page and try again.',
    };
  }
  // Everything a save is missing is filled HERE, and nowhere else. See `fillDefaults`.
  const filled = fillDefaults(state as ZooGameState);
  return version === undefined
    ? {
      ok: true, state: filled,
      note: 'Saved by an earlier version of the game. Anything added since has come in at its default.',
    }
    : { ok: true, state: filled };
}

/** Everything a save can be missing, in one place.
 *
 *  This used to be two places that both thought they were the one. `readSave` filled two fields by
 *  name, and the reducer's LOAD_GAME merged the save over a fresh state - which fills EVERY field,
 *  and wins, because the loaded state is spread second.
 *
 *  So the ladder here looked maintained while doing nothing, and the first migration that changed
 *  what a field MEANS - rather than adding a new one - would have been silently overwritten by the
 *  merge with the value it was migrating away from. Nothing would have failed; the game would just
 *  have been wrong about an old save, which is the worst way for a save format to break.
 *
 *  One place, and it is this one. `LOAD_GAME` takes what it is given. New fields are added by
 *  naming them; a field whose meaning changes is migrated by version, below. */
function fillDefaults(read: ZooGameState): ZooGameState {
  return {
    ...read,
    // Anything added since a save was taken comes in at its default: a game resumed from before the
    // zoo's value was counted starts at nothing rather than at NaN.
    value: read.value ?? 0,
    lastLedger: read.lastLedger ?? null,
    signalLog: read.signalLog ?? [],
    decisions: read.decisions ?? [],
    improvements: read.improvements ?? [],
    signals: read.signals ?? [],
    signalAge: read.signalAge ?? {},
    happiness: read.happiness ?? [],
    velocity: read.velocity ?? [],
    burndown: read.burndown ?? [],
    connectors: read.connectors ?? [],
    questions: read.questions ?? [],
    zones: read.zones ?? [...new Set(read.backlog.map((it) => it.zone))],
    version: SAVE_VERSION,
  };
}

/** What goes into the row: the game, stamped with the build that wrote it. */
export const stampSave = (state: ZooGameState): ZooGameState => ({ ...state, version: SAVE_VERSION });
