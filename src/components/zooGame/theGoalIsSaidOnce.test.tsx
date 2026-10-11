import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import { startItem } from './engine';
import { goalLine } from './header';
import type { ZooGameState } from './types';
import type { ArtifactTab } from './ZooShell';

// The Sprint Goal, said once.
//
// Asked after playing it: "Can the spaces be better used?" On the Sprint Backlog - the screen a
// Sprint is actually played on - the verdict was printed twice, word for word, 170 pixels apart:
//
//   Goal safe · 0 of 3 items · 0 of 13 pts          <- the strip at the top, small and truncated
//   Open the Big Cats zone so families...
//
//   SPRINT GOAL  commitment of the Sprint Backlog   Goal safe · 0 of 3 items · 0 of 13 pts
//   Open the Big Cats zone so families...           <- the board's banner, right below it
//
// The two were written as different things and had become the same words. The board's is the
// better one: bigger, not truncated, not behind a popover, and next to the cards it is about. So
// the strip stands down while the board is showing it, and carries it on every other screen.

const sprint = (): ZooGameState => {
  const s0 = initialZooState(3) as ZooGameState;
  const free = s0.backlog.filter((it) => it.status === 'backlog'
    && !['epic', 'exhibit', 'need'].includes(it.category) && !it.unsized).slice(0, 3);
  return startItem({ ...s0, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    sprintDays: 3, daySecondsLeft: 180, wipLimit: 0, committedIds: free.map((f) => f.id),
    sprintGoal: 'Open the Big Cats zone so families have a reason to come',
    backlog: s0.backlog.map((it) => (free.some((f) => f.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState, free[0].id);
};

const noop = () => {};
const screen = (s: ZooGameState, tab: ArtifactTab) => render(
  <MemoryRouter>
    <ZooShell state={s} parkTab={tab} onSetTab={noop} building={null} onSetClockPaused={noop}
      edit={{ onDesign: noop, onSetEnclosure: noop, onAddInside: noop }}
      backlogTab={<div>the Product Backlog</div>}>
      <SprintBoard state={s} onEstimate={noop} onToggleTask={noop} onFinishItem={noop}
        onStartItem={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop}
        onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop}
        onBuilding={noop} rail={<div />} />
    </ZooShell>
  </MemoryRouter>,
);

/** How many times the verdict is written on the screen, in the words the player reads. */
const timesSaid = (container: HTMLElement, s: ZooGameState) => {
  const verdict = goalLine(s).line;
  // Only what is actually drawn: a tab that is not the one you are looking at still has its
  // markup, and a copy nobody can see is not a duplicate. `hidden` on the pane is how the shell
  // puts a tab away - looked for on an ANCESTOR, because the strip's own class is `hidden lg:flex`
  // and it is shown at every width this game is played at.
  const shown = [...container.querySelectorAll('[data-part="goal-verdict"], [data-part="goal-line"]')]
    .filter((el) => !el.parentElement?.closest('.hidden'));
  return shown.filter((el) => (el.textContent ?? '').includes(verdict)).length;
};

describe('the Sprint Goal on the Sprint Backlog', () => {
  it('is said once', () => {
    const s = sprint();
    const { container } = screen(s, 'sprint');
    expect(timesSaid(container, s), 'the verdict is printed twice on one screen').toBe(1);
  });

  it('is the strip that keeps it - the one that is on every screen', () => {
    const { container } = screen(sprint(), 'sprint');
    expect(container.querySelector('[data-part="goal-line"]'),
      'nothing says whether the Sprint is safe').toBeTruthy();
    expect(container.querySelector('[data-part="goal-verdict"]'),
      'the board is still saying the strip’s arithmetic as well').toBeNull();
  });
});

describe('every other screen', () => {
  it('still has it in the strip, because nothing else is carrying it', () => {
    // The control. Without this the fix above is "delete the Sprint Goal from the header", which
    // would leave the Product Backlog and the Increment with no Goal on them at all.
    const s = sprint();
    const { container } = screen(s, 'backlog');
    expect(container.querySelector('[data-part="goal-line"]'),
      'no screen says what the Sprint is for').toBeTruthy();
    expect(timesSaid(container, s), 'it is said more than once here too').toBe(1);
  });
});

describe('the board’s banner', () => {
  it('still says the Goal itself, in full, beside the cards', () => {
    // What it is FOR, and what the strip - one truncated line at the top of the window - never
    // could. Taking the verdict off it does not take the Goal off it.
    const s = sprint();
    const { container } = screen(s, 'sprint');
    const banner = container.querySelector('[data-part="sprint-goal"]')!;
    expect(banner, 'the board stopped saying what this Sprint is for').toBeTruthy();
    expect(banner.textContent).toContain(s.sprintGoal);
    expect(banner.textContent, 'it is still carrying the strip’s arithmetic as well')
      .not.toContain(goalLine(s).line);
  });
});
