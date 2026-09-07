import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
          onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    ),
  };
};

describe('the Build state', () => {
  it('turns the board into a rail of tokens, and keeps everything reachable', () => {
    // Two states of the Sprint Backlog tab, decided by what you are doing rather than by a toggle.
    // With something in hand the park takes the width, so the board becomes one token per item down
    // the left edge: what else is in the Sprint, and a way back to any of it.
    const { container } = board('build');
    const rail = container.querySelector('[data-part="token-rail"]');
    expect(rail, 'the board is still three columns wide while the park needs the room').toBeTruthy();
    expect(container.querySelector('[data-part="next-step"]'), 'the item in hand went away').toBeTruthy();
    expect(rail!.textContent, 'the rail lost the rest of the Sprint').toMatch(/Lion|Paths|Planting/);
    expect(container.querySelectorAll('[data-part="board-card"]').length,
      'the full board is still drawn behind the park').toBe(0);
  });

  it('makes the next step the one thing being asked', () => {
    const { container } = board('build');
    const next = container.querySelector('[data-part="next-step"]');
    expect(next, 'nothing on the screen says what to do next').toBeTruthy();
    // The first step of the plan nobody has ticked, numbered as it is on the plan.
    expect(next!.textContent).toContain('3. Lay the ground, shelter and water');
    expect(next!.className, 'the next step is not the orange box').toMatch(/border-primary/);
  });

  it('leaves the building to the palette, and keeps the rest one line away', () => {
    // The six tools are on the park now, along its foot, which is where you are looking while you
    // build. What is left in the bench is the rest - colours, ground, shape - and it says so rather
    // than hiding: "How do I actually build anything?" was asked once and must not be asked twice.
    const { container } = board('build');
    const line = container.querySelector('[data-part="controls-line"]');
    expect(line, 'the bench is carrying the tools the park already has').toBeTruthy();
    expect(line!.textContent).toMatch(/More controls: colours · ground · shape/);

    fireEvent.click(line as HTMLElement);
    const studio = container.querySelector('[data-part="studio"]');
    expect(studio, 'asking for the rest of the controls opened nothing').toBeTruthy();
    expect(studio!.className, 'the rest of the controls are below the criteria').toMatch(/order-first/);
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
          onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onEndDay={noop}
          onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop}
          onDrawing={noop} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="controls-line"]'), 'the pen is behind a fold').toBeNull();
    expect(container.textContent, 'nothing offers to draw the route').toMatch(/Draw its route/);
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
          onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
          onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
          onAssignDev={noop} onRenameMember={noop} onOpen={noop} onEndDay={noop}
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

  it('is the same bench whichever way you came to it', () => {
    // There is one Sprint Backlog screen, so there is one bench on it, on the work in hand.
    const { container } = board('plan');
    expect(container.querySelector('[data-part="next-step"]'), 'the bench has no work on it').toBeTruthy();
  });
});
