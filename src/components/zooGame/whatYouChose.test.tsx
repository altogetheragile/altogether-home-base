import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CardDialog } from './CardDialog';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { startOnTheBoard, whatIsLeft, readyToMove } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// Three things a player said, playing it.
//
// "Why is this giving a Pick it up option? All steps and ACs are met." The card behind the dialog
// has offered "Move it to Done" since it was written; the dialog - which is where the game puts an
// item's detail, and the only path to any of it without a pointer - offered the thing you do to
// work that is NOT finished.
//
// "The trees are all the same. I select pine and it looks like an oak." Every call into the plan's
// plant drawing passed the piece's TYPE, which is 'tree' for an oak, a pine, a palm, a blossom and
// a bare one alike, so the choice was thrown away at the door.

const finished = (): { state: ZooGameState; item: BacklogItem } => {
  const s = startOnTheBoard(initialZooState(1) as ZooGameState);
  const pen = s.backlog.find((it) => it.status === 'committed' && it.category === 'enclosure')!;
  const done: BacklogItem = {
    ...pen, started: true,
    tasks: (pen.tasks ?? []).map((t) => ({ ...t, done: true })),
    acceptance: pen.acceptance ?? [],
    acConfirmed: (pen.acceptance ?? []).map(() => true),
    design: { parts: { type: 'enclosure' }, colors: {}, copies: [] } as unknown as BacklogItem['design'],
    pos: { x: 500, y: 800 },
  };
  return { state: { ...s, backlog: s.backlog.map((it) => (it.id === pen.id ? done : it)) } as ZooGameState, item: done };
};

const dialog = (state: ZooGameState, item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <CardDialog state={state} item={item} onClose={() => {}} onBuilding={() => {}} {...props} />
  </MemoryRouter>,
);

describe('the card dialog, on work that is finished', () => {
  it('offers the move the card behind it offers', () => {
    const { state, item } = finished();
    // Asserted rather than guarded: a fixture that is not actually ready would make every
    // expectation below pass by not running, which is the quietest way to ship the bug back.
    expect(readyToMove(item), 'the fixture is not finished work at all').toBe(true);
    dialog(state, item, { onFinish: () => {} });
    // The dialog is portalled to the body, like the day's dock: `container` does not hold it.
    expect(screen.queryByRole('button', { name: /Move it to Done/ }),
      'the dialog on finished work offers no way to finish it').toBeTruthy();
  });

  it('does not make "Pick it up" the thing to do next on finished work', () => {
    const { state, item } = finished();
    expect(readyToMove(item)).toBe(true);
    dialog(state, item, { onFinish: () => {} });
    const first = document.querySelector('[data-part="dialog-move-to-done"]');
    expect(first, 'moving it to Done is not the primary').toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Pick it up →$/ }),
      'the old primary is still the primary').toBeNull();
  });

  it('says what is left when it is not finished, instead of nothing', () => {
    const s = startOnTheBoard(initialZooState(1) as ZooGameState);
    const pen = s.backlog.find((it) => it.status === 'committed' && it.category === 'enclosure')!;
    const started = { ...pen, started: true } as BacklogItem;
    const state = { ...s, backlog: s.backlog.map((it) => (it.id === pen.id ? started : it)) } as ZooGameState;
    dialog(state, started, { onFinish: () => {} });
    const said = document.querySelector('[data-part="what-is-left"]');
    expect(said, 'the dialog says nothing about what stands between here and Done').toBeTruthy();
    expect(said!.textContent, 'it does not agree with the card').toBe(whatIsLeft(state, started));
  });

  it('reads one rule, so the card and the dialog cannot disagree', () => {
    // The board and the column once kept two rules about whether a card could move, and they
    // disagreed: the card said "Ready" while the drop was refused in silence.
    const { state, item } = finished();
    expect(whatIsLeft(state, item)).toBe('Ready \u00b7 move it to Done');
  });
});

describe('a tree you chose', () => {
  const planted = (piece: string): ZooGameState => {
    const s = startOnTheBoard(initialZooState(1) as ZooGameState);
    return { ...s, backlog: [...s.backlog, {
      id: `p-${piece}`, name: `${piece} planting`, category: 'flora', template: 'tree', zone: 'Big Cats',
      status: 'open', sprintNumber: 1, openedIn: 1, estimate: 2, accessible: true, acceptance: [],
      started: true, pos: { x: 500, y: 800 },
      design: { parts: { type: 'tree', piece }, colors: { foliage: '#4e9146', trunk: '#7a5228' }, copies: [] },
    }] } as unknown as ZooGameState;
  };
  const drawingOf = (piece: string) => {
    const { container } = render(<ParkPlan state={planted(piece)} />);
    return container.querySelector(`[data-plan-item="p-${piece}"]`)!.innerHTML;
  };

  it('looks like the kind you picked, not like every other kind', () => {
    const kinds = ['oak', 'pine', 'palm', 'blossom', 'bare'];
    const drawn = kinds.map(drawingOf);
    const same: string[] = [];
    for (let i = 0; i < kinds.length; i++) {
      for (let j = i + 1; j < kinds.length; j++) {
        if (drawn[i] === drawn[j]) same.push(`${kinds[i]} and ${kinds[j]}`);
      }
    }
    expect(same, `these are drawn identically: ${same.join(', ')}`).toEqual([]);
  });

  it('draws a conifer as something with points on it', () => {
    expect(drawingOf('pine'), 'a pine is a circle, like everything else').toMatch(/<polygon/);
    expect(drawingOf('oak'), 'an oak has grown points').not.toMatch(/<polygon/);
  });

  it('draws a bare tree as branches rather than a crown', () => {
    expect(drawingOf('bare')).toMatch(/<line/);
  });

  it('still draws the kinds it has no name for', () => {
    // A plant inside a habitat carries a type and no piece. It gets the broad crown, as before.
    expect(drawingOf('something-new')).toMatch(/<circle/);
  });
});
