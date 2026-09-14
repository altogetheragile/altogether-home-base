import { describe, it, expect } from 'vitest';
import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SprintBoard } from './SprintBoard';
import { initialZooState, DAY_SECONDS } from './config';
import { startOnTheBoard, sprintCapacity, whyNothingMoves, readyToMove, reviewSprint, startNextSprint } from './engine';
import { reducer } from './useZooGame';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// What a day's work is.
//
// Reported from playing it, over four goes:
//
//   "it only takes a day to get through the 3 PBIs"
//   "I finished everything 15 seconds into the second day"
//   "watching a timer count down the work is not fun or useful"
//   "we need to pull more into a sprint, not make the work last longer to fill the time"
//
// The first two were a real fault: work cost the Sprint nothing, so a Sprint had no length. The fix
// for them was wrong, and the last two say why. Work was priced in seconds of day - each item owing
// so many, drained by the clock, with nothing allowed to be Done until its seconds had been spent.
// That paced a Sprint correctly at the cost of being a timer you sat and watched, and nobody has
// ever learned anything from watching a number go down.
//
// A day is a timebox and nothing else. What somebody gets through in one is their VELOCITY, which
// the game measures rather than enforces - and the answer to finishing early is more work, which is
// the conversation Sprint Planning is for.

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const inSprint = (s: ZooGameState): BacklogItem[] => s.backlog.filter((it) => it.status === 'committed');
const of = (s: ZooGameState, id: string): BacklogItem => s.backlog.find((it) => it.id === id)!;

describe('a day is a timebox, not a budget', () => {
  it('lets work be finished as fast as somebody can do it', () => {
    // The whole of the objection. An item that is built, ticked and accepted is Done: there is no
    // countdown between doing the work and being allowed to have done it.
    let s = sprint();
    const it0 = inSprint(s)[0];
    s = reducer(s, { type: 'START_ITEM', id: it0.id });
    s = reducer(s, { type: 'BUILD_ITEM', id: it0.id, design: presetFor(it0) });
    for (const t of of(s, it0.id).tasks ?? []) if (!t.done) s = reducer(s, { type: 'TOGGLE_TASK', id: it0.id, taskId: t.id });
    // ...and the Product Owner looked at it and said ship it, which is the other way to settle the
    // criteria the park judges for itself.
    s = reducer(s, { type: 'ASK_TO_CHECK', id: it0.id });
    s = reducer(s, { type: 'ANSWER_QUESTION', id: `check-${it0.id}`, choice: 'accept-as-is' });
    expect(readyToMove(of(s, it0.id)), 'the work was done and the card would not move').toBe(true);
    expect(s.daySecondsLeft, 'doing the work took time off the clock by itself').toBe(DAY_SECONDS);
  });

  it('charges nothing for taking work on', () => {
    const s = sprint();
    const after = reducer(s, { type: 'START_ITEM', id: inSprint(s)[0].id });
    expect(after.daySecondsLeft, 'taking work into Doing took a bite out of the day').toBe(s.daySecondsLeft);
  });

  it('still runs out, which is what a timebox does', () => {
    let s = sprint();
    for (let i = 0; i < DAY_SECONDS + 2 && s.dayStage === 'building'; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(s.dayStage !== 'building' || s.dayNumber > 1, 'the day ran on for ever').toBe(true);
  });
});

describe('the first Sprint arrives with a Sprint of work in it', () => {
  it('fills what the team think they can do, rather than a handful of cards', () => {
    // It used to stop at three cards, which is about a third of a Sprint - so anybody who knew the
    // controls finished on the first morning and had nothing to do but watch the clock.
    const s = sprint();
    const took = inSprint(s).reduce((n, it) => n + (it.estimate ?? 0), 0);
    expect(took, 'the first Sprint is a handful of cards rather than a Sprint')
      .toBeGreaterThan(sprintCapacity(s).points * 0.75);
    expect(inSprint(s).length, 'a Sprint of work is fewer than five cards').toBeGreaterThan(4);
  });

  it('is a slice of one area, not a tour of the park', () => {
    // Facilities count as part of the slice rather than a second area: an area nobody can buy an
    // ice cream in is not open. What would make it a tour is a second area's animals.
    const s = sprint();
    const areas = new Set(inSprint(s).filter((it) => it.category === 'enclosure' || it.category === 'exhibit')
      .map((it) => it.zone));
    expect(areas.size, 'the first Sprint reaches across the whole zoo').toBe(1);
  });
});

describe('finishing early is a conversation, not an empty board', () => {
  it('says so, and says who to have it with', () => {
    // The answer to a fast team is more work. The board used to go quiet and say nothing at all.
    let s = sprint();
    s = { ...s, backlog: s.backlog.map((it) => (it.status === 'committed'
      ? { ...it, status: 'done' as const } : it)) } as ZooGameState;
    expect(whyNothingMoves(s), 'the forecast was finished and the board said nothing').toBe('empty');
  });

  it('does not say it while there is still work on the board', () => {
    expect(whyNothingMoves(sprint()), 'a board full of work was called empty').toBeNull();
  });

  it('still tells a Sprint that cannot move from one that is finished', () => {
    // Opposite problems. One is a conversation about what was forecast; the other is a Sprint
    // Backlog with an animal in it whose habitat was left in the Product Backlog.
    const s = sprint();
    const keep = inSprint(s).find((it) => it.category === 'exhibit')!;
    const stuck = { ...s, backlog: s.backlog.map((it) => (it.sprintNumber === 1 && it.id !== keep.id
      ? { ...it, status: 'backlog' as const, sprintNumber: null } : it)) } as ZooGameState;
    expect(whyNothingMoves(stuck), 'a blocked Sprint was reported as a finished one').toBe('blocked');
  });
});

describe('velocity is measured, so the game finds the level of whoever is playing', () => {
  it('forecasts the next Sprint from what was actually delivered', () => {
    const s = sprint();
    const guessed = sprintCapacity(s).points;
    const slow = { ...s, velocity: [6], velocityDays: [s.sprintDays] } as ZooGameState;
    expect(sprintCapacity(slow).points, 'a team that delivered six was offered the opening guess again')
      .toBeLessThan(guessed);
    const quick = { ...s, velocity: [48], velocityDays: [s.sprintDays] } as ZooGameState;
    expect(sprintCapacity(quick).points, 'a fast team is held to somebody else’s guess for ever')
      .toBeGreaterThan(guessed);
  });

  it('stops guessing once a Sprint has been run', () => {
    let s = sprint();
    s = { ...s, backlog: s.backlog.map((it) => (it.status === 'committed' ? { ...it, status: 'open' as const } : it)) } as ZooGameState;
    s = startNextSprint(reviewSprint(s), '');
    expect(sprintCapacity(s).estimated, 'the team has run a Sprint and is still guessing').toBe(false);
    expect(sprintCapacity(s).points, 'nothing was measured from a Sprint that delivered').toBeGreaterThan(0);
  });
});

describe('the way on when the forecast is finished', () => {
  it('is a button that opens the Product Backlog, not a sentence about one', () => {
    // The answer to a team who finished early is more work, and "ask the Product Owner" as a line of
    // small print is something somebody has to go and act on themselves. It is one press.
    let s = sprint();
    s = { ...s, dayNumber: 2, backlog: s.backlog.map((it) => (it.status === 'committed'
      ? { ...it, status: 'open' as const } : it)) } as ZooGameState;
    const noop = () => {};
    const api = Object.fromEntries(['onEstimate', 'onFinishItem', 'onStartItem', 'onReorderSprint', 'onPull',
      'onDropFromSprint', 'onAnswerPlacement', 'onSplitEpic', 'onAssignDev', 'onOpen', 'onAskToCheck',
      'onToggleTask', 'onEndDay', 'onHoldDailyScrum', 'onAnswerImpediment', 'onSkipDailyScrum', 'onStartDay',
      'onHoldRefinement', 'onBuilding', 'onAddPbi', 'onSetUserStories'].map((k) => [k, noop]));
    render(<SprintBoard {...(api as unknown as React.ComponentProps<typeof SprintBoard>)} state={s} />);
    const pull = screen.getByRole('button', { name: /pull more in/i });
    expect(pull, 'the forecast was finished and there was nothing to press').toBeTruthy();
    fireEvent.click(pull);
    expect(screen.getByLabelText(/Close the Product Backlog/i),
      'the button did not open the Product Backlog').toBeTruthy();
  });
});
