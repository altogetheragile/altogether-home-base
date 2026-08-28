import type { ZooGameState, ZooAction } from './types';
import { reducer } from './useZooGame';

// Reconciling one shared game between several browsers, with no server code.
//
// Postgres is the authority and this is the cache. A player's action is applied here at
// once, so the interface never waits for a round trip, and is then written with
// `WHERE version = <what we had>`. If somebody got there first that write matches no rows,
// and the answer is not to discard what the player did: it is to take whatever the server
// actually has and re-apply the actions that have not been confirmed yet.
//
// That re-application is only sound because the reducer is pure. There is no clock inside
// it, no unseeded randomness and no I/O, so replaying an action onto a different base gives
// the same answer every time. It is the single property this whole design rests on.

export interface SyncState {
  /** The last state the server confirmed, and the version it had. */
  server: ZooGameState;
  version: number;
  /** Applied locally, not yet confirmed. Survives a rebase - this is the player's intent. */
  pending: ZooAction[];
}

/** What this browser shows: the server's state with everything unconfirmed replayed on top. */
export const localState = (s: SyncState): ZooGameState => s.pending.reduce(reducer, s.server);

/** A player did something. Optimistic: it shows immediately, and is written after. */
export const queueAction = (s: SyncState, action: ZooAction): SyncState =>
  ({ ...s, pending: [...s.pending, action] });

/** A write landed. Only the actions that went in it are confirmed - more may have been
 *  queued while it was in flight, and those are still the player's to keep. */
export function confirmWrite(s: SyncState, sentCount: number, version: number): SyncState {
  const sent = s.pending.slice(0, sentCount);
  return { server: sent.reduce(reducer, s.server), version, pending: s.pending.slice(sentCount) };
}

/** Somebody else's version arrived, or our write lost the race. Take their state as the new
 *  base and keep our unconfirmed actions to replay on top of it. */
export const rebase = (s: SyncState, server: ZooGameState, version: number): SyncState =>
  ({ server, version, pending: s.pending });

/** Is there anything worth writing? */
export const hasPending = (s: SyncState): boolean => s.pending.length > 0;

/** The state a write should send, and how many actions it covers. Taken together so the
 *  count cannot drift from the payload it describes. */
export function writePayload(s: SyncState): { state: ZooGameState; count: number; version: number } {
  return { state: localState(s), count: s.pending.length, version: s.version };
}
