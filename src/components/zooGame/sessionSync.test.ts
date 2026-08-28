import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { ZooGameState, ZooAction } from './types';
import { localState, queueAction, confirmWrite, rebase, hasPending, writePayload, type SyncState } from './sessionSync';

// The point of these: what happens when two people act at once. Everything else in the
// shared-session plumbing is Supabase's problem; this is ours.

const fresh = (): SyncState => ({ server: initialZooState(1), version: 3, pending: [] });
const setGoal = (goal: string): ZooAction => ({ type: 'SET_PRODUCT_GOAL', goal });

describe('reconciling one shared game between several browsers', () => {
  it('shows a players action at once, before any write has landed', () => {
    // Optimistic: the interface must never wait for a round trip to feel responsive.
    const s = queueAction(fresh(), setGoal('A zoo the neighbourhood is proud of'));
    expect(localState(s).productGoal).toBe('A zoo the neighbourhood is proud of');
    expect(s.server.productGoal, 'the server state was mutated before it confirmed')
      .not.toBe('A zoo the neighbourhood is proud of');
    expect(hasPending(s)).toBe(true);
  });

  it('keeps what the player did when somebody elses change arrives first', () => {
    // The race this whole design exists for. Ours is unconfirmed, theirs is already on the
    // server. Neither may be lost.
    const mine = queueAction(fresh(), setGoal('Mine'));
    const theirs: ZooGameState = { ...initialZooState(1), sprintGoal: 'Theirs' };
    const rebased = rebase(mine, theirs, 4);

    const shown = localState(rebased);
    expect(shown.sprintGoal, 'their change was dropped').toBe('Theirs');
    expect(shown.productGoal, 'my unconfirmed action was dropped').toBe('Mine');
    expect(rebased.version).toBe(4);
  });

  it('confirms only what the write actually carried', () => {
    // A player keeps clicking while a write is in flight. Confirming the write must not
    // swallow the actions that were queued after it was sent.
    let s = queueAction(fresh(), setGoal('First'));
    const sent = writePayload(s);
    expect(sent.count).toBe(1);
    s = queueAction(s, setGoal('Second'));          // queued mid-flight
    s = confirmWrite(s, sent.count, sent.version + 1);

    expect(s.server.productGoal, 'the confirmed action did not reach the server state').toBe('First');
    expect(s.pending, 'the mid-flight action was swallowed').toHaveLength(1);
    expect(localState(s).productGoal, 'the mid-flight action was lost').toBe('Second');
    expect(s.version).toBe(4);
  });

  it('replays a whole queue onto whatever the server turned out to have', () => {
    let s = fresh();
    s = queueAction(s, setGoal('One'));
    s = queueAction(s, { type: 'SET_SPRINT_GOAL', goal: 'Two' });
    const theirs: ZooGameState = { ...initialZooState(1), learnMode: true };
    const shown = localState(rebase(s, theirs, 9));

    expect(shown.learnMode, 'the servers change was lost in the replay').toBe(true);
    expect(shown.productGoal).toBe('One');
    expect(shown.sprintGoal).toBe('Two');
  });

  it('sends the state the player can see, and a count that matches it', () => {
    // If the count and the payload ever disagree, a confirm clears the wrong actions - so
    // they are produced together rather than read separately.
    let s = queueAction(fresh(), setGoal('One'));
    s = queueAction(s, setGoal('Two'));
    const { state, count, version } = writePayload(s);
    expect(state.productGoal).toBe('Two');
    expect(count).toBe(2);
    expect(version).toBe(3);
    expect(hasPending(confirmWrite(s, count, version + 1)), 'nothing should be left pending').toBe(false);
  });

  it('is a no-op when there is nothing to write', () => {
    expect(hasPending(fresh())).toBe(false);
    expect(localState(fresh())).toEqual(fresh().server);
  });
});
