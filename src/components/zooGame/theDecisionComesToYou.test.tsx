import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAiSeats } from './useZooSession';
import { aiTurn, leftToThePlayer, SOLO_AI_SEATS } from './aiSeats';
import { initialZooState } from './config';
import { planSprint, startItem, availableItems, askToCheck, setDraftDesign } from './engine';
import type { SeatName } from './useZooSessions';
import type { ZooAction, ZooGameState } from './types';

// A seat played by the game does the seat's routine work. A decision somebody is sitting there to
// make is not routine work.
//
// Giving the Product Owner's seat to the game meant she also started accepting: a card was built
// and approved before anybody had looked at it. "The PO automatically approved a built card. I'd
// prefer to keep the decision action using the message centre."
//
// So accepting stays in the rail. Answering HOW it gets built does not, because handing that back
// is itself the teaching and the player is on the receiving end of it.

const sprint = (): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
/** Work built and offered to the Product Owner: the moment she used to approve by herself. */
const offered = (): ZooGameState => {
  const s = sprint();
  const item = s.backlog.find((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber)!;
  return askToCheck(setDraftDesign(startItem(s, item.id), item.id, {} as never), item.id);
};

describe('what the game will not decide for you', () => {
  it('leaves accepting finished work alone', () => {
    expect(leftToThePlayer({ type: 'ANSWER_QUESTION', id: 'check-x', choice: 'accept' } as ZooAction)).toBe(true);
    expect(leftToThePlayer({ type: 'CONFIRM_AC', id: 'x', index: 0, value: true } as ZooAction)).toBe(true);
  });

  it('still hands back a question about how it gets built', () => {
    // The one answer in that seat the player should be on the receiving end of.
    expect(leftToThePlayer({ type: 'ANSWER_QUESTION', id: 'fence-x', choice: 'theirs' } as ZooAction)).toBe(false);
  });

  it('still says where a thing goes', () => {
    expect(leftToThePlayer({ type: 'ANSWER_PLACEMENT', id: 'x', choice: 'entrance' } as ZooAction)).toBe(false);
  });

  it('is told apart by the answer, not the action', () => {
    // Accepting and refusing are the same action with different answers, and only one of them is
    // the game approving something nobody looked at.
    expect(leftToThePlayer({ type: 'ANSWER_QUESTION', id: 'check-x', choice: 'send-back' } as ZooAction)).toBe(false);
  });
});

describe('a card built and offered', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const run = (state: ZooGameState, skip?: (a: ZooAction) => boolean) => {
    const sent: { seat: SeatName; action: ZooAction }[] = [];
    const session = { state, drivesClock: true,
      sendAs: (seat: SeatName, action: ZooAction) => { sent.push({ seat, action }); } };
    renderHook(() => useAiSeats(session, SOLO_AI_SEATS, undefined, undefined, skip));
    act(() => { vi.advanceTimersByTime(20000); });
    return sent;
  };

  it('is one the Product Owner would otherwise approve', () => {
    // Without the filter she takes it, which is what was reported. If this stops being true the
    // filter is guarding nothing.
    const move = aiTurn(offered(), 'product_owner');
    expect(move?.action, 'nothing approves it any more, so this test is the stale one')
      .toMatchObject({ type: 'ANSWER_QUESTION', choice: 'accept' });
    expect(run(offered()).length, 'the beat sends nothing, so nothing is being tested')
      .toBeGreaterThan(0);
  });

  it('is left for the player when somebody is sitting at the table', () => {
    const sent = run(offered(), leftToThePlayer);
    const approved = sent.filter((s) => s.action.type === 'ANSWER_QUESTION'
      && 'choice' in s.action && s.action.choice === 'accept');
    expect(approved, 'the game approved a built card before anybody looked at it').toHaveLength(0);
  });

  it('is still accepted where nobody is sitting at all', () => {
    // A shared session with an empty Product Owner's chair. Without this, work builds up against a
    // sign-off that is never coming - an empty chair is not somebody choosing not to decide yet.
    const sent = run(offered());
    expect(sent.some((s) => s.action.type === 'ANSWER_QUESTION'
      && 'choice' in s.action && s.action.choice === 'accept'),
    'an empty seat never accepts, so Done is unreachable').toBe(true);
  });
});
