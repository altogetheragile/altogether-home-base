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

const board = (_unused: 'plan' | 'build', over: Partial<ZooGameState> = {}, part: { id: string; key: string } | null = null) => {
  const s = state(over);
  const held = s.backlog.find((it) => it.started)!;
  return {
    held,
    ...render(
      <MemoryRouter>
        <SprintBoard state={s} building={held.id} edit={edit} part={part}
          onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    ),
  };
};

describe('the Build state', () => {
  it('keeps the board and the thing in your hands on one screen', () => {
    // Plan and Build were two states with a switch between them, and the switch was reported as
    // confusing: the board and the item you are building are the same work.
    const { container } = board('build');
    expect(container.textContent, 'the board went away while something was in hand').toMatch(/To Do/);
    expect(container.textContent).toMatch(/Doing/);
    expect(container.querySelector('[data-part="next-step"]'), 'the item in hand went away').toBeTruthy();
  });

  it('makes the next step the one thing being asked', () => {
    const { container } = board('build');
    const next = container.querySelector('[data-part="next-step"]');
    expect(next, 'nothing on the screen says what to do next').toBeTruthy();
    // The first step of the plan nobody has ticked, numbered as it is on the plan.
    expect(next!.textContent).toContain('3. Lay the ground, shelter and water');
    expect(next!.className, 'the next step is not the orange box').toMatch(/border-primary/);
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

  it('never folds away the only way to make progress', () => {
    // A pathway is drawn with the pen, and the pen is one of these controls. Folded, the park said
    // "pick up the pen on the design bench" with no bench on the screen to pick it up from - which
    // is where a live game stopped dead.
    const s = state();
    const path = s.backlog.find((it) => it.category === 'path')!;
    const held = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === path.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true }
        : { ...it, started: false, status: it.status === 'committed' ? 'backlog' as const : it.status })),
    } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintBoard state={held} building={path.id} edit={edit}
          onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop}
          onDrawing={noop} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="controls-line"]'), 'the pen is behind a fold').toBeNull();
    expect(container.textContent, 'nothing offers to draw the route').toMatch(/Draw its route/);
  });

  it('names the controls this item actually has', () => {
    // "ground · fence · water · planting" on a pathway is a label for a different item.
    const { container } = board('build');
    expect(container.querySelector('[data-part="controls-line"]')!.textContent).toMatch(/ground · fence · water/);
  });

  it('does not offer a Product Owner the Developers’ bench', () => {
    // Reported from a live game: sitting as the Product Owner, the Build state put a design studio
    // and a plan step in front of them - work the seat gate then refused. A screen that invites
    // what the rules refuse teaches the opposite of the accountability it is trying to teach.
    const s = state();
    const held = s.backlog.find((it) => it.started)!;
    const { container } = render(
      <MemoryRouter>
        <SprintBoard state={s} building={held.id} edit={edit} canBuild={false}
          onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="controls-line"]'), 'the bench was offered to a Product Owner').toBeNull();
    expect(container.textContent, 'the studio is open to somebody who cannot build').not.toMatch(/How it is made/);
    // What they get instead: what the Developers are on, and what is theirs to do about it.
    const next = container.querySelector('[data-part="next-step"]')!;
    expect(next.textContent).toMatch(/The Developers are on/);
    expect(next.textContent).toMatch(/tick what the build actually meets/i);
    // ...and the acceptance criteria, which ARE the Product Owner's.
    expect(container.textContent).toMatch(/Acceptance criteria/i);
  });

  it('folds the controls on every screen now there is only one', () => {
    const { container } = board('plan');
    expect(container.querySelector('[data-part="controls-line"]'), 'the studio is open beside the board again').toBeTruthy();
  });
});
