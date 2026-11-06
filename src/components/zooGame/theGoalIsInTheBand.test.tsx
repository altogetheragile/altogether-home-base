import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SeatBand } from './SeatBand';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// During the Sprint the band under the tabs carries the Sprint Goal, and the board does not.
//
// Asked for while playing it, of "Developers pull and build. Priya refines and answers.": "is not
// needed. Replace with the Sprint Goal - everything shifts up." The Goal had a box of its own above
// the board, so the band said who does what (which the seats beside it already show) and the work
// started a box lower than it needed to.

const GOAL = 'Open the Big Cats zone so that visitors have something to see on their first visit';
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, sprintGoal: GOAL, ...over,
} as ZooGameState);
const band = (s: ZooGameState) => render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;

const noop = () => {};
const board = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintBoard state={s} onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
).container;

describe('the band during the Sprint', () => {
  it('carries the Sprint Goal, labelled, in full', () => {
    const goal = band(sprint()).querySelector('[data-part="sprint-goal"]');
    expect(goal, 'the band does not carry the Goal').toBeTruthy();
    expect(goal!.textContent!.trim()).toMatch(/^Sprint Goal/);
    expect(goal!.textContent).toContain(GOAL);
    expect(goal!.querySelector('[data-part="sprint-goal-text"]')!.className, 'it is cut off').not.toMatch(/\btruncate\b/);
  });

  it('no longer says who does what, which the seats beside it show', () => {
    expect(band(sprint()).textContent).not.toMatch(/Developers pull and build/);
  });

  it('says so plainly when there is no Goal', () => {
    expect(band(sprint({ sprintGoal: '' })).querySelector('[data-part="sprint-goal"]')!.textContent)
      .toMatch(/None\. The Scrum Team did not agree one/);
  });

  it('is read, not edited, and is not the Definition of Done', () => {
    const goal = band(sprint()).querySelector('[data-part="sprint-goal"]')!;
    expect(goal.querySelector('input,textarea')).toBeNull();
    expect(goal.textContent).not.toMatch(/Definition of Done/i);
  });

  it('keeps its sentence outside the Sprint', () => {
    const c = band({ ...sprint(), phase: 'retro' } as ZooGameState);
    expect(c.querySelector('[data-part="sprint-goal"]')).toBeNull();
  });
});

describe('the board', () => {
  it('starts at the top of its pane, with no Goal box of its own', () => {
    expect(board(sprint()).querySelector('[data-part="sprint-goal"]'), 'the Goal is said twice').toBeNull();
  });
});
