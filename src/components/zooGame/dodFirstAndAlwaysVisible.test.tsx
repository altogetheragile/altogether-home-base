import { describe, it, expect } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { initialZooState, DEFAULT_BRIEF, DEFAULT_DOD } from './config';
import { writeBacklog } from './engine';
import { ItemBench } from './BacklogBench';
import { JourneyLine } from './JourneyLine';
import type { ZooGameState } from './types';

// "I still cannot see the DoD after it is created. Also, the DoD tells us what finished looks like.
// We cannot size PBIs without an understanding of the DoD. It should be created before we size any
// PBIs."
//
// Two changes. Nothing can be sized on the refinement screen until the Scrum Team has agreed a
// Definition of Done (or chosen to start without one). And once agreed, it is one press away from
// anywhere: the Definition of Done step on the journey line opens it.

const noop = () => {};
const written = (over: Partial<ZooGameState> = {}) =>
  ({ ...writeBacklog(initialZooState(3), DEFAULT_BRIEF), phase: 'refine', ...over } as ZooGameState);

/** An unsized habitat on the bench, which opens with the sizing cards out once sizing is allowed. */
const bench = (over: Partial<ZooGameState>) => {
  const base = initialZooState(3);
  const item = { ...base.backlog.find((it) => it.category === 'enclosure')!, unsized: true };
  const s = { ...base, phase: 'refine', backlog: base.backlog.map((it) => (it.id === item.id ? item : it)), ...over } as ZooGameState;
  return render(<ItemBench state={s} item={item} onEstimate={noop} onRefinePbi={noop} onSplitEpic={noop} onSetUseStories={noop} onClose={noop} />).container;
};
const sizing = (c: HTMLElement) => !!c.querySelector('[data-part="poker-card"]')
  || [...c.querySelectorAll('button')].some((b) => /^Size it/.test(b.textContent ?? ''));

describe('nothing is sized before the Definition of Done', () => {
  it('offers no sizing while the team has not agreed what Done means', () => {
    const c = bench({ dodAgreed: false });
    expect(sizing(c), 'sizing offered before Done is agreed').toBe(false);
    expect(c.querySelector('[data-part="size-after-dod"]')?.textContent).toMatch(/once the Scrum Team agrees the Definition of Done/);
  });

  it('offers it once Done is agreed', () => {
    expect(sizing(bench({ dodAgreed: true, definitionOfDone: DEFAULT_DOD }))).toBe(true);
    // ...and starting without one is a choice made, so sizing is open then too.
    expect(sizing(bench({ dodAgreed: true, definitionOfDone: [] }))).toBe(true);
  });
});

describe('Sprint Planning is not a way round it', () => {
  it('offers no way to Planning until Done is agreed, or the team chooses to start without one', async () => {
    const { RefineBacklog } = await import('./RefineBacklog');
    const { MemoryRouter } = await import('react-router-dom');
    const screen = (over: Partial<ZooGameState>) => render(
      <MemoryRouter>
        <RefineBacklog state={written(over)} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
          onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
          onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
          onDuplicatePbi={noop} onPlan={noop} />
      </MemoryRouter>,
    ).baseElement;
    const toPlanning = (c: HTMLElement) => [...c.querySelectorAll('button')].some((b) => /^Go to Sprint Planning/.test(b.textContent ?? ''));
    expect(toPlanning(screen({ dodAgreed: false })), 'Planning, and its sizing, before Done is agreed').toBe(false);
    cleanup();
    expect(toPlanning(screen({ dodAgreed: true, definitionOfDone: [] }))).toBe(true);
  });
});

describe('the agreed Definition of Done is one press away', () => {
  it('opens from its step on the journey line, in any phase', () => {
    const s = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 2,
      dodAgreed: true, definitionOfDone: DEFAULT_DOD } as ZooGameState;
    const { baseElement, container } = render(<JourneyLine state={s} />);
    const step = container.querySelector('[data-part="journey-dod"]') as HTMLButtonElement;
    expect(step, 'the Definition of Done step cannot be opened').toBeTruthy();
    fireEvent.click(step);
    const list = baseElement.querySelector('[data-part="journey-dod-list"]')!;
    for (const line of DEFAULT_DOD) expect(list.textContent).toContain(line);
  });

  it('is not a button before anything is agreed', () => {
    const { container } = render(<JourneyLine state={written({ dodAgreed: false })} />);
    expect(container.querySelector('[data-part="journey-dod"]')).toBeNull();
  });
});
