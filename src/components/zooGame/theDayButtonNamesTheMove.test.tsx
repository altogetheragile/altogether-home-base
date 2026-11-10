import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The end-turn button of a strategy game (Civilization's "Choose production"): while something waits
// on you the dock's button says what, and takes you there. "End Day" is beside it, smaller, because
// nothing here blocks the day. Rule 13 in docs/SCRUM_GAMES_PLAN.md.

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
const checking = () => {
  const s = sprint();
  const item = s.backlog.find((it) => it.started)!;
  return { s: { ...s, questions: [{ id: `check-${item.id}`, of: 'product_owner', from: 'Ada', itemId: item.id, text: 'Is it what you asked for?',
    askedAt: s.daySecondsLeft, choices: [{ key: 'accept', label: 'Accept it' }], day: 1 }] } as unknown as ZooGameState, item };
};
const board = (s: ZooGameState, onEndDay = noop) => render(
  <MemoryRouter>
    <SprintBoard state={s} move={<div data-part="action-rail"><button type="button">Accept it</button></div>}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={onEndDay}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

describe('the day button, while something waits on you', () => {
  it('names the move, and is the loud one', () => {
    const { s, item } = checking();
    board(s);
    const go = document.querySelector('[data-part="unanswered"]')!;
    expect(go.textContent).toBe(`Check ${item.name} →`);
    expect(go.className).toMatch(/\bbg-primary\b/);
    expect(document.querySelector('[data-part="end-day"]')!.textContent).toBe('End Day 1 anyway');
  });

  it('takes you to the move', () => {
    const { s } = checking();
    board(s);
    fireEvent.click(document.querySelector('[data-part="unanswered"]')!);
    expect(document.activeElement?.textContent, 'pressing it did not put you on the answer').toBe('Accept it');
  });

  it('names a colleague holding a card up, too', () => {
    const s = sprint();
    const dev = s.team.developers[0];
    board({ ...s, proposed: { id: 'p', devId: dev.id, says: 'Taking it next.', move: { kind: 'forecast', ids: [] } } } as unknown as ZooGameState);
    expect(document.querySelector('[data-part="unanswered"]')!.textContent).toBe(`Answer ${dev.name} →`);
  });

  it('still lets the day end, and says what that costs', () => {
    const onEndDay = vi.fn();
    const { s } = checking();
    board(s, onEndDay);
    const end = document.querySelector('[data-part="end-day"]')!;
    expect(end.getAttribute('title')).toMatch(/Ending the day does not accept it/);
    fireEvent.click(end);
    expect(onEndDay).toHaveBeenCalled();
  });

  it('is just End Day when nothing waits', () => {
    board(sprint());
    expect(document.querySelector('[data-part="unanswered"]')).toBeNull();
    expect(document.querySelector('[data-part="end-day"]')!.textContent).toMatch(/^End Day 1 →/);
  });
});
