import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { EditApi } from './ParkView';
import type { ZooGameState } from './types';

// The Build state's attention order, drawn rather than described.
//
// "A learner in the middle of a build day sees a strip of twelve equal pills, three tabs, a heading,
// chips, a toggle, a goal band, a rail, a bench, a park and a dock. When nothing is bigger, nothing
// is important." So in Build: the board greys back, the item in hand is the card, its next step is
// the only orange box, and the controls fold to one line until a part of the thing is touched.
//
// Counted, with the strip: clock, goal line, next step, park. Four things asking for attention.

const noop = () => {};
const edit = new Proxy({}, { get: () => noop }) as unknown as EditApi;

/** A Sprint with one item started, which is what the Build state is about. */
const state = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const held = base.backlog.find((it) => it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    committedIds: [held.id],
    backlog: base.backlog.map((it) => (it.id === held.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true,
        tasks: [{ id: 't1', label: 'Set the footprint size', done: true }, { id: 't2', label: 'Fence it securely', done: true },
          { id: 't3', label: 'Lay the ground, shelter and water', done: false }, { id: 't4', label: 'Get the PO’s sign-off', done: false }] }
      : it)),
    ...over,
  } as ZooGameState;
};

const board = (mode: 'plan' | 'build', over: Partial<ZooGameState> = {}, part: { id: string; key: string } | null = null) => {
  const s = state(over);
  const held = s.backlog.find((it) => it.started)!;
  return {
    held,
    ...render(
      <MemoryRouter>
        <SprintBoard state={s} mode={mode} building={held.id} edit={edit} part={part}
          onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    ),
  };
};

describe('the Build state', () => {
  it('greys the board back to a rail', () => {
    const { container } = board('build');
    const rail = container.querySelector('[data-part="board-rail"]');
    expect(rail, 'the board vanished entirely in Build').toBeTruthy();
    expect(rail!.className, 'the rail is asking for as much attention as the work').toMatch(/opacity-60/);
    // It is still the board: where the Sprint stands, in three groups.
    expect(rail!.textContent).toMatch(/Doing/);
    expect(rail!.textContent).toMatch(/To Do/);
    expect(rail!.textContent).toMatch(/Done/);
  });

  it('makes the next step the one thing being asked', () => {
    const { container } = board('build');
    const next = container.querySelector('[data-part="next-step"]');
    expect(next, 'nothing on the screen says what to do next').toBeTruthy();
    // The first step of the plan nobody has ticked, numbered as it is on the plan.
    expect(next!.textContent).toContain('3. Lay the ground, shelter and water');
    expect(next!.className, 'the next step is not the orange box').toMatch(/border-primary/);
  });

  it('leaves the Plan state’s furniture in the Plan state', () => {
    // The question is about what to take on, and the Sprint Goal is on the strip. Neither belongs
    // on a screen whose whole job is the one thing in your hands.
    const build = board('build').container;
    const plan = board('plan').container;
    // The element that SAYS it, not an ancestor that contains it: every wrapper up to the root
    // contains the words, so asking "does anything contain this" always answers yes.
    const visible = (c: HTMLElement, re: RegExp) => [...c.querySelectorAll('h2, h3, div, span')]
      .some((el) => re.test(el.textContent ?? '') && el.children.length === 0 && !el.closest('.hidden'));
    expect(visible(plan, /What can we finish today\?/), 'Plan lost its own question').toBe(true);
    expect(visible(build, /What can we finish today\?/), 'the Plan question is still on the Build screen').toBe(false);
    expect(visible(build, /commitment of the Sprint Backlog/), 'the goal band is said twice').toBe(false);
  });

  it('folds the controls to one line until a part is touched', () => {
    const { container } = board('build');
    const line = container.querySelector('[data-part="controls-line"]');
    expect(line, 'the controls are open beside the work again').toBeTruthy();
    expect(line!.textContent).toMatch(/Controls: size · shape · ground · fence · water · planting/);
    // Ask for them and they open.
    fireEvent.click(line as HTMLElement);
    expect(container.querySelector('[data-part="controls-line"]')).toBeNull();
    expect(screen.getAllByText(/How it is made/).length).toBeGreaterThan(0);
  });

  it('opens them by itself when you touch a part of the thing on the park', () => {
    // That link is the whole reason a row of coloured squares is comprehensible: you tap the ground
    // out there and watch its control light up in here.
    const s = state();
    const held = s.backlog.find((it) => it.started)!;
    const { container } = board('build', {}, { id: held.id, key: 'ground' });
    expect(container.querySelector('[data-part="controls-line"]'), 'touching a part left the controls folded away').toBeNull();
  });

  it('keeps the controls open in Plan, where the bench is a bench', () => {
    const { container } = board('plan');
    expect(container.querySelector('[data-part="controls-line"]')).toBeNull();
  });
});
