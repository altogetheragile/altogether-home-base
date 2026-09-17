import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The Sprint Goal is the commitment of the Sprint Backlog, and it was not on it.
//
// It lived in the top strip: one line, small, truncated where it ran out of room, hidden below a
// large screen, and behind a popover if you wanted the rest of it. "Our goal is to deliver the Big
// Cats zone so that visitors have something to se..." is not a commitment anybody can hold in mind
// while they choose what to work on.
//
// The Product Backlog has carried its own commitment above the list for a while, and the comment
// there claimed the Sprint Backlog already did the same. It did not.

const GOAL = 'Open the Big Cats zone so that visitors have something to see on their first visit';

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1,
  sprintGoal: GOAL, ...over,
} as ZooGameState);

const noop = () => {};
/** The board carries a lot of handlers and this is about one panel on it, so they are all nothing. */
const props = {
  onEstimate: noop, onToggleTask: noop, onFinishItem: noop, onStartItem: noop, onReorderSprint: noop,
  onPull: noop, onDropFromSprint: noop, onAnswerPlacement: noop, onSplitEpic: noop, onAssignDev: noop,
  onOpen: noop, onAskToCheck: noop, onEndDay: noop, onHoldDailyScrum: noop, onAnswerImpediment: noop,
  onSkipDailyScrum: noop, onStartDay: noop, onHoldRefinement: noop, onBuilding: noop, onAddPbi: noop,
  onSetUserStories: noop,
};

const board = (s: ZooGameState) => render(
  <MemoryRouter><SprintBoard {...(props as unknown as Parameters<typeof SprintBoard>[0])} state={s} /></MemoryRouter>,
);

describe('the Sprint Goal on the Sprint Backlog', () => {
  it('is there, in full, not cut off', () => {
    const { container } = board(sprint());
    const panel = container.querySelector('[data-part="sprint-goal"]');
    expect(panel, 'the artifact does not carry its own commitment').toBeTruthy();
    expect(panel!.textContent, 'the Goal is cut off where it runs out of room').toContain(GOAL);
    // Not truncated by the stylesheet either, which is how it was unreadable in the strip.
    expect(panel!.querySelector('[data-part="sprint-goal-text"]')!.className)
      .not.toMatch(/\btruncate\b/);
  });

  it('says what it is, because a sentence with no label is just a sentence', () => {
    const { container } = board(sprint());
    expect(container.querySelector('[data-part="sprint-goal"]')!.textContent)
      .toMatch(/Sprint Goal/i);
    // The Guide's own words for what it is to the artifact it sits on.
    expect(container.querySelector('[data-part="sprint-goal"]')!.textContent)
      .toMatch(/commitment of the Sprint Backlog/i);
  });

  it('says so plainly when there is no Goal, rather than showing an empty box', () => {
    const { container } = board(sprint({ sprintGoal: '' }));
    expect(container.querySelector('[data-part="sprint-goal"]')!.textContent)
      .toMatch(/No Sprint Goal/i);
  });

  it('carries the verdict the strip carries, from the same arithmetic', () => {
    // Two places working out whether the Sprint is safe is two places that can disagree about one
    // Sprint. This reads `goalLine`, which is what the strip reads.
    const { container } = board(sprint());
    expect(container.querySelector('[data-part="goal-verdict"]')!.textContent!.length)
      .toBeGreaterThan(0);
  });

  it('is not shown where there is no Sprint to have one', () => {
    const { container } = board(sprint({ phase: 'planning' }));
    // Planning has the Goal as its whole subject already, on its own screen.
    expect(container.querySelector('[data-part="sprint-goal"]'),
      'the board repeated the Goal at Planning, where the screen is about it').toBeNull();
  });
});

describe('what it does not do', () => {
  it('does not put the Definition of Done in the same box', () => {
    // "Acceptance criteria belong to the item. The Definition of Done is the team-wide bar and is
    // shown separately. Never merge or relabel them." The Goal is a third thing again: it is what
    // the Sprint is FOR, not a bar the work clears.
    const { container } = board(sprint());
    expect(container.querySelector('[data-part="sprint-goal"]')!.textContent)
      .not.toMatch(/Definition of Done/i);
  });

  it('leaves the Goal alone - it is read here, not edited here', () => {
    const { container } = board(sprint());
    const panel = container.querySelector('[data-part="sprint-goal"]')!;
    expect(panel.querySelector('input,textarea'),
      'the Sprint Goal does not change while the Sprint runs').toBeNull();
  });
});

describe('the strip it came from', () => {
  it('still has it, because a player scrolled down the board can still see the strip', () => {
    // Not a duplicate to be deleted: the strip is always on screen and the board scrolls. What the
    // strip carries is the verdict, with the Goal under it in small type; what the board carries is
    // the Goal itself, readable. Both read `goalLine`.
    expect(screen.queryByText(GOAL)).toBeNull();   // nothing leaked between renders
  });
});
