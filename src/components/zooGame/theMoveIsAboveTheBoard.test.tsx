import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import { lookAhead } from './lookAhead';

// The Sprint, one move at a time: your move above the board, the board, then the team chat.
//
// Asked while playing it: "The Scrum Board, Your Move messages and team chat all clash with each
// other. The colours are too uniform in that it is not obvious what to do." The move sat at the top
// of the chat under the board, and End Day was the loudest button while the move was waiting.

const noop = () => {};
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintDays: 3, sprintNumber: 1,
    sprintGoal: 'Open the Big Cats zone', committedIds: take.map((it) => it.id),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id) ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true } : it)),
    ...over,
  } as ZooGameState;
};
/** Nothing waiting at all: the Product Owner's proposals ahead have been turned down too. */
const nothingAhead = (s: ZooGameState): ZooGameState => ({ ...s, declinedProposals: lookAhead(s).map((p) => p.id) });
const board = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintBoard state={s} move={<div data-part="the-move">Your move</div>} rail={<div data-part="the-chat">chat</div>}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);
const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('the Sprint screen', () => {
  it('puts your move above the board, and the chat under it', () => {
    const { container } = board(sprint());
    const move = container.querySelector('[data-part="the-move"]')!;
    const column = container.querySelector('[data-column="todo"]')!;
    const chat = container.querySelector('[data-part="the-chat"]')!;
    expect(move, 'no move on the screen').toBeTruthy();
    expect(chat, 'no chat on the screen').toBeTruthy();
    expect(before(move, chat), 'the chat comes before the move').toBe(true);
    expect(before(move, column), 'the board comes before the move').toBe(true);
    expect(before(column, chat), 'the chat comes before the board').toBe(true);
  });

  it('keeps End Day quiet while something waits on you, and loud when nothing does', () => {
    const quiet = board(nothingAhead(sprint()));
    expect(document.querySelector('[data-part="end-day"]')!.className, 'with nothing waiting End Day is not the way on').toMatch(/bg-primary/);
    quiet.unmount();
    const s = sprint();
    const item = s.backlog.find((it) => it.started)!;
    board({ ...s, questions: [{ id: `check-${item.id}`, of: 'product_owner', from: 'Ada', itemId: item.id, text: 'Is it what you asked for?',
      askedAt: s.daySecondsLeft, choices: [{ key: 'accept', label: 'Accept it' }], day: 1 }] } as unknown as ZooGameState);
    expect(document.querySelector('[data-part="end-day"]')!.className, 'End Day shouts over the move').not.toMatch(/\bbg-primary\b/);
  });
});
