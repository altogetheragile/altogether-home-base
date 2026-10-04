import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAiSeats } from './useZooSession';
import { aiTurn, SOLO_AI_SEATS } from './aiSeats';
import { initialZooState } from './config';
import { planSprint, startItem, availableItems, teamIsBusy } from './engine';
import type { SeatName } from './useZooSessions';
import type { ZooAction, ZooGameState, GameQuestion } from './types';

// The seats nobody is sitting in, played while the Developers build.
//
// Two things were in the way. The beat stopped for EVERY seat while the Developers had work in
// flight, so a Product Owner went silent the moment anybody pulled a card - which is most of a
// Sprint, and exactly the part where clarifying matters (#880). And a question about HOW the work
// gets built had no answer in that seat at all, so the one decision a Product Owner should hand
// back was the one she never got to.

const sprint = (): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
/** A Sprint with a card pulled and not yet built: the state the beat used to stop dead in. */
const building = (): ZooGameState => {
  const s = sprint();
  const first = s.backlog.find((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber)!;
  return startItem(s, first.id);
};

const howQuestion = (s: ZooGameState): ZooGameState => ({
    ...s,
    questions: [{
      id: 'fence-x', of: 'product_owner', from: 'Ada',
      itemId: s.backlog.find((it) => it.status === 'committed')!.id,
      text: 'Rounded or square?', askedAt: s.daySecondsLeft, day: 1,
      choices: [{ key: 'rounded', label: 'Rounded' }, { key: 'square', label: 'Square' },
        { key: 'theirs', label: 'Your call', note: 'How it gets built is the Developers’.' }],
  } as GameQuestion],
});

describe('a how question', () => {
  it('is handed back by the Product Owner, not answered', () => {
    const move = aiTurn(howQuestion(sprint()), 'product_owner');
    expect(move, 'the Product Owner has no answer to a how question').toBeTruthy();
    expect(move!.action).toMatchObject({ type: 'ANSWER_QUESTION', id: 'fence-x', choice: 'theirs' });
    expect(move!.says, 'she answers it instead of handing it back').toMatch(/your call/i);
  });

  it('is found by the answer that keeps the decision where it belongs', () => {
    // Not by matching the wording: the question knows which of its choices is the one that hands
    // it back, so a differently worded how question is handed back too.
    const s = howQuestion(sprint());
    const reworded = { ...s, questions: [{ ...s.questions![0], text: 'Timber or stone?' }] } as ZooGameState;
    expect(aiTurn(reworded, 'product_owner')!.action).toMatchObject({ choice: 'theirs' });
  });

  it('is left alone when there is no such answer to give', () => {
    // A question with no "your call" among its choices is a what or a why, and those are hers.
    const s = howQuestion(sprint());
    const whatWhy = { ...s, questions: [{ ...s.questions![0],
      choices: [{ key: 'families', label: 'Families' }, { key: 'everyone', label: 'Everyone' }] }] } as ZooGameState;
    const move = aiTurn(whatWhy, 'product_owner');
    expect(move?.action, 'a what-or-why question was handed back as if it were a how')
      .not.toMatchObject({ type: 'ANSWER_QUESTION', choice: 'theirs' });
  });
});

describe('which seats a game played alone hands over', () => {
  it('keeps the Developers for the player', () => {
    // "Always a developer when we execute the plan from the SBL."
    expect(SOLO_AI_SEATS, 'the game plays the Developers, so there is nothing for the player to do')
      .not.toContain('developer');
  });

  it('keeps the Daily Scrum for the player too', () => {
    // The Scrum Master's clearest move here is holding the Daily Scrum, and that is the
    // Developers' event - the one the player is now sitting in. Played by the game it would be
    // held a few seconds after it opened and the player would decide nothing in it.
    const s = { ...sprint(), dayStage: 'dailyScrum' } as ZooGameState;
    expect(aiTurn(s, 'scrum_master')?.action.type,
      'the Scrum Master seat no longer holds the Daily Scrum, so this test is the stale one')
      .toBe('RUN_DAILY_SCRUM');
    expect(SOLO_AI_SEATS, 'the game holds the player\u2019s own Daily Scrum for them')
      .not.toContain('scrum_master');
  });

  it('hands over the Product Owner, who is the point of the exercise', () => {
    expect(SOLO_AI_SEATS, 'nobody is playing the Product Owner, so the player still is')
      .toContain('product_owner');
  });
});

describe('the beat, while the Developers are building', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const run = (seats: SeatName[], state: ZooGameState) => {
    const sent: { seat: SeatName; action: ZooAction }[] = [];
    const session = { state, drivesClock: true,
      sendAs: (seat: SeatName, action: ZooAction) => { sent.push({ seat, action }); } };
    renderHook(() => useAiSeats(session, seats));
    act(() => { vi.advanceTimersByTime(20000); });
    return sent;
  };

  it('lets the Product Owner act while work is in flight', () => {
    // #880: busy HANDS take no new work. A Product Owner answering a question while the Developers
    // build is not taking on new work - it is the one thing that seat is there to do.
    const waiting = howQuestion(building());
    expect(teamIsBusy(waiting), 'the team is not busy, so nothing is being tested').toBe(true);
    expect(aiTurn(waiting, 'product_owner'), 'she has nothing to do, so nothing is being tested')
      .toBeTruthy();

    const sent = run(['product_owner'], waiting);
    expect(sent.length, 'the Product Owner went silent the moment a card was pulled')
      .toBeGreaterThan(0);
    expect(sent[0].seat).toBe('product_owner');
    expect(sent[0].action).toMatchObject({ type: 'ANSWER_QUESTION', choice: 'theirs' });
  });

  it('leaves the Developer seat held exactly as it was', () => {
    // The change narrows the check to the seat it was written for; it does not relax it. With work
    // in flight a Developer played by the game still sends nothing at all, which is what paces a
    // Sprint - acted on at once, a whole forecast went by in seconds.
    const busy = building();
    expect(aiTurn(busy, 'developer'), 'the Developer seat has no move, so nothing is being tested')
      .toBeTruthy();
    expect(run(['developer'], busy),
      'a Developer played by the game acted while work was in flight').toHaveLength(0);
  });
});
