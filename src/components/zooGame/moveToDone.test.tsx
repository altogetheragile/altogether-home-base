import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import { readyToMove, startItem, setDraftDesign, suggestTasks } from './engine';
import { applyParkChecks } from './parkChecks';
import { isDesignDone, currentDesign, homeSizeOf, presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Moving a card to Done, and the one rule that says whether it may.
//
// Reported from playing it, three times: "I'm still sticking at move Lion to Done" - on a card
// reading "Ready · move it to Done", with every criterion green and Priya's acceptance in.
//
// There were two rules. The card's words came from the engine's `readyToMove`; the column's gate
// was a second rule the board kept to itself, which also asked `isDesignDone` - and that measured
// whether the lions fit against a copy of the habitat's size kept on the ANIMAL. So a family failed
// it however large the pen was, the drop was refused, and the refusal was suppressed because the
// card said it was ready. Silence, on a gesture that should have worked.
//
// Two things hold it now: the gate is `readyToMove` and nothing else, and the move is a button as
// well as a drag, because a card that says "move it to Done" and can only be dragged is asking for
// a gesture that does not always land on a tablet.

const noop = () => {};

/** A lion family, in a large habitat, built and accepted - everything Done asks for. */
function acceptedFamily(homeSize: 'small' | 'medium' | 'large' = 'large'): ZooGameState {
  const s = initialZooState(3);
  const habitat = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === habitat.id)!;
  const design = {
    ...presetFor(lion),
    group: { males: 1, females: 2, juveniles: 1, cubs: 2 },
    colors: { coat: '#c8761f' },
  };
  const accepted = (it: BacklogItem): BacklogItem => ({
    ...it,
    status: 'committed', sprintNumber: 1, started: true, design,
    // The animal keeps a stale copy of its home's size. It is the pen that counts.
    enclosureSize: 'medium',
    acConfirmed: (it.acceptance ?? []).map(() => true),
    tasks: (it.tasks?.length ? it.tasks : [
      { id: 'a', label: 'Decide how many, and of what ages', done: false },
      { id: 'b', label: 'Check they fit the habitat', done: false },
      { id: 'c', label: "Get the PO's sign-off", done: false },
    ]).map((t) => ({ ...t, done: true })),
  });
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    committedIds: [habitat.id, lion.id],
    backlog: s.backlog.map((it) => {
      if (it.id === lion.id) return accepted(it);
      if (it.id === habitat.id) return { ...it, enclosureSize: homeSize, status: 'done', sprintNumber: 1, started: true, design: presetFor(it) };
      return it;
    }),
  } as ZooGameState;
}

const lionOf = (s: ZooGameState) => s.backlog.find((it) => it.category === 'exhibit' && it.started)!;

const board = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <SprintBoard state={state}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop}
      onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
      onStartDay={noop} onBuilding={noop} {...props} />
  </MemoryRouter>,
);

describe('a family of lions in a habitat big enough for them', () => {
  it('is judged against the pen they live in, not a copy kept on the animal', () => {
    const s = acceptedFamily('large');
    const lion = lionOf(s);
    expect(homeSizeOf(lion, s.backlog), 'the animal answered for its own size').toBe('large');
    expect(isDesignDone(lion, currentDesign(lion), homeSizeOf(lion, s.backlog)),
      'a family in a large pen still did not count as built').toBe(true);
  });

  it('may be moved to Done', () => {
    expect(readyToMove(lionOf(acceptedFamily('large'))),
      'everything was in and the card still could not move').toBe(true);
  });

  it('offers the move as a button, not only as a drag', () => {
    const onFinishItem = vi.fn();
    const { container } = board(acceptedFamily('large'), { onFinishItem });
    const move = container.querySelector('[data-part="move-to-done"]') as HTMLButtonElement | null;
    expect(move, 'a card that is ready offers no way to move it but dragging').toBeTruthy();
    fireEvent.click(move!);
    expect(onFinishItem, 'pressing it did nothing').toHaveBeenCalledWith(lionOf(acceptedFamily('large')).id);
  });
});

describe('a pride crammed into a small habitat', () => {
  it('cannot move, and the board does not offer the move', () => {
    const s = acceptedFamily('small');
    // The plan is ticked by hand in this state, so the card can still be ready - what must not
    // happen is the board offering a move it will then refuse, or refusing one it offered.
    const { container } = board(s);
    const offered = !!container.querySelector('[data-part="move-to-done"]');
    expect(offered, 'the board and the rule disagreed about whether this card may move')
      .toBe(readyToMove(lionOf(s)));
  });
});

describe('a plan the park ticks off by itself', () => {
  it('is still the Developers saying it is built, so the draft becomes the design', () => {
    // The draft was only ever committed inside `toggleItemTask`, which was true while every step was
    // ticked by hand. Once the park ticked them, an item could have a finished plan and no design at
    // all - and Done asks for one, so the card read "Next: finish the plan" over a finished plan.
    const s = initialZooState(3);
    const habitat = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    let g = {
      ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: 80,
      backlog: s.backlog.map((it) => (it.id === habitat.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, tasks: suggestTasks(it) } : it)),
    } as ZooGameState;
    g = startItem(g, habitat.id, 'developer');
    // A habitat with ground under their feet, somewhere to shelter and water in it: everything the
    // plan asks for, drawn on the park and never once ticked by hand.
    g = setDraftDesign(g, habitat.id, {
      parts: {}, colors: { ground: '#c8a06a', fence: '#8a6a3b' },
      water: [{ x: 0.2, y: 0.2, w: 0.3, h: 0.2 }], flora: [{ type: 'rock', x: 0.6, y: 0.6, s: 1 }],
    });
    const before = g.backlog.find((it) => it.id === habitat.id)!;
    expect(before.design, 'this test needs an item that has not been built yet').toBeFalsy();
    const after = applyParkChecks(g).backlog.find((it) => it.id === habitat.id)!;
    expect((after.tasks ?? []).filter((t) => t.label.trim() && !/sign[- ]?off/i.test(t.label)).every((t) => t.done),
      'the park did not tick the plan off').toBe(true);
    expect(after.design, 'the plan was finished and nothing was ever committed as built').toBeTruthy();
  });
});

describe('the words on the card and the gate on the column', () => {
  it('are the same rule', () => {
    // Whatever the state, a card offering the move must be a card the move will accept. This is the
    // shape of the bug rather than one instance of it: two rules that agreed most of the time.
    for (const home of ['small', 'medium', 'large'] as const) {
      const s = acceptedFamily(home);
      const { container } = board(s);
      const card = [...container.querySelectorAll('[data-part="board-card"]')]
        .find((c) => /Lion/.test(c.textContent ?? '') && !/Enclosure/.test(c.textContent ?? ''));
      const says = /move it to Done/i.test(card?.textContent ?? '');
      const gate = !!container.querySelector('[data-part="move-to-done"]');
      expect(says, `the card's words and the rule disagree in a ${home} habitat`)
        .toBe(readyToMove(lionOf(s)));
      expect(gate, `the card says "move it to Done" in a ${home} habitat and the column will not take it`)
        .toBe(says);
    }
  });
});
