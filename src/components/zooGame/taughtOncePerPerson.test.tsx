import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { reducer, useZooGame } from './useZooGame';
import { markTaught } from './engine';
import { ScrumReferenceBody } from './ScrumTeaching';
import { initialZooState } from './config';
import { CARDS_BY_PHASE } from './scrumContent';
import type { ZooGameState } from './types';

// A card is shown once, and "once" means once to a PERSON.
//
// This is the whole of what the teaching on/off switch was reaching for, done properly. Asked after
// walking through what that switch actually did: "teaching mode is not really intrusive and we could
// easily just get rid of it - as in leave it on? It is a learning app after all."
//
// It could, and the reason is worth keeping written down. The switch hid the way-in screen and the
// in-context cards. It did NOT hide the "?" on every screen or a single word of the Learn drawer, so
// it was never a "do not teach me" mode. And `teaching` lived in game state that `asWritten` did not
// carry, so `initialZooState` put it back to ON at the start of every new game: the one person it
// was built for, a trainer opening a fresh zoo in front of a class they have just taught, had to
// press it every single session. A mode that cannot survive the one transition it exists for is a
// branch to maintain rather than a setting anybody uses.
//
// What a player on their third zoo actually wants is not to be told again the things they have
// already been told. That is `taught`, per card, and it is now carried across a new game - so the
// game stops saying what they know and keeps saying what they do not.

const s0 = () => initialZooState(1) as ZooGameState;
const read = (s: ZooGameState, ids: string[]) => ids.reduce(markTaught, s);

describe('what a player has already read', () => {
  it('follows them into a new zoo', () => {
    // The fault, before this: start a second game and the teaching began again from the top, every
    // card, as though they had never played.
    const cards = CARDS_BY_PHASE.refine.slice(0, 2);
    const was = read(s0(), cards);
    const fresh = reducer(was, { type: 'START' });
    expect(fresh.taught, 'a new zoo forgot everything the player had read').toEqual(cards);
  });

  it('...whichever way they start it', () => {
    // The Scrum Master's menu offers writing the Backlog from the brief. Same beginning, same
    // player, so the same memory of what they have been told.
    const cards = CARDS_BY_PHASE.refine.slice(0, 1);
    const fresh = reducer(read(s0(), cards), { type: 'START_FROM_THE_BRIEF' });
    expect(fresh.taught).toEqual(cards);
  });

  it('but RESET still means wipe it', () => {
    // The one action that means "none of this happened". It is the same rule the Product Goal
    // carry-over already follows, and the reason a trainer has a clean slate to hand.
    const fresh = reducer(read(s0(), CARDS_BY_PHASE.refine.slice(0, 2)), { type: 'RESET' });
    expect(fresh.taught, 'a reset kept the read cards').toEqual([]);
  });

  it('is the only thing deciding whether a card is shown', () => {
    // No mode beside it. A flag that hides cards the player has NOT read is the thing this replaced.
    expect('teaching' in s0(), 'the teaching flag is back on the state').toBe(false);
  });
});

describe('...and across a visit, not just a game', () => {
  // The carry-over above keeps the list through START. It does nothing for somebody who closes the
  // tab, because the state they come back to is brand new - so the list is also kept outside the
  // game and seeded back in. Without this half, "a card is shown once" still meant once per visit.
  beforeEach(() => localStorage.clear());

  it('remembers what was read when the game begins again', () => {
    const cards = CARDS_BY_PHASE.refine.slice(0, 2);
    const first = renderHook(() => useZooGame(1));
    act(() => { cards.forEach((id) => first.result.current.markTaught(id)); });
    expect(first.result.current.state.taught).toEqual(cards);
    first.unmount();

    // A new visit: nothing of the old game survives except what this browser was told.
    const second = renderHook(() => useZooGame(1));
    expect(second.result.current.state.taught, 'the next visit started the teaching again')
      .toEqual(cards);
  });

  it('keeps both lists when a saved game is resumed', () => {
    // The save knows what was read while it was being played; this browser knows what has been read
    // since. Reading a card is a thing that happened, and neither copy can un-happen the other's.
    const here = CARDS_BY_PHASE.refine.slice(0, 1);
    const inTheSave = CARDS_BY_PHASE.planning.slice(0, 1);
    const { result } = renderHook(() => useZooGame(1));
    act(() => { here.forEach((id) => result.current.markTaught(id)); });
    act(() => { result.current.loadGame({ ...s0(), taught: [...inTheSave] }); });
    expect(result.current.state.taught).toEqual([...inTheSave, ...here]);
  });

  it('plays anyway when the browser will not store it', () => {
    // Safari in private browsing has thrown on write for years, and a prerender has no window at
    // all. A game that failed to start because it could not remember would be a poor trade.
    const broken = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      const { result } = renderHook(() => useZooGame(1));
      act(() => { result.current.markTaught(CARDS_BY_PHASE.refine[0]); });
      expect(result.current.state.taught, 'the game fell over instead of forgetting')
        .toEqual([CARDS_BY_PHASE.refine[0]]);
    } finally {
      broken.mockRestore();
    }
  });
});

describe('the Scrum reference', () => {
  it('has no switch that turns the teaching off', () => {
    // It used to carry `Teaching on / off` in its heading. Every card in here was always to hand
    // whatever that switch said, which is most of why it meant so little.
    const { container } = render(<ScrumReferenceBody />);
    expect(container.textContent ?? '', 'the teaching toggle came back').not.toMatch(/Teaching (on|off)/);
  });
});
