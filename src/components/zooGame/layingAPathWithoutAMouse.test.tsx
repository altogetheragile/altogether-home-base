import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState, ZooConnector } from './types';

// Laying a path with the keyboard.
//
// A newcomer played the live game cold for 250 steps, got an entire enclosure configured - paddock,
// size, surface, perimeter, what goes inside it - and then delivered nothing, in any Sprint,
// because of this:
//
//   "The 'Drawing - press each corner in turn' instruction says to click corners on the park map,
//    but I cannot."
//
// The pen was pointer-only. Not awkward without a mouse: impossible. The park took focus when
// something was waiting to be PUT DOWN and at no other time, every item went to tabIndex -1 while
// the pen was out, and no key did anything. And a path running to a thing is a criterion the park
// judges for itself in `parkChecks`, so it cannot be ticked past and shrugged off - which means a
// keyboard user could not finish one item in this game, ever.

const started = (): ZooGameState => {
  const s = startOnTheBoard(initialZooState(1) as ZooGameState);
  const first = s.backlog.find((it) => it.status === 'committed')!;
  return reducer(s, { type: 'START_ITEM', id: first.id });
};

const pen = (onAddConnector: (c: ZooConnector) => void) => {
  const c = render(
    <MemoryRouter>
      <ParkPlan state={started()} tool="path" onAddConnector={onAddConnector} onPlaceItem={() => {}} />
    </MemoryRouter>,
  ).container;
  return c.querySelector('[data-part="park-plan"]') as SVGSVGElement;
};

describe('the park, while the pen is out', () => {
  it('can be reached at all', () => {
    const park = pen(() => {});
    expect(park.getAttribute('tabindex'), 'nothing can put focus on the park, so no key can reach it')
      .toBe('0');
    expect(park.getAttribute('role'), 'the park is still announced as a picture, which takes no keys')
      .toBe('application');
  });

  it('says what the keys do, since nothing else on the page does', () => {
    const said = pen(() => {}).getAttribute('aria-label') ?? '';
    expect(said, 'it still describes itself as a view of the zoo').toMatch(/laying a path/i);
    expect(said, 'the arrows are not mentioned').toMatch(/arrow keys/i);
    expect(said, 'nothing says how to press a corner').toMatch(/Enter/);
    expect(said, 'there is no way out of the pen that anybody is told about').toMatch(/Escape/);
  });
});

describe('walking the pen', () => {
  const walk = (park: SVGSVGElement, key: string, times = 1) => {
    for (let i = 0; i < times; i += 1) fireEvent.keyDown(park, { key });
  };

  it('shows where it is standing before anything is pressed', () => {
    // A pointer shows itself. The arrows do not, and without this the first thing a keyboard player
    // sees is the result of a press they had no way to aim.
    const onAdd = vi.fn();
    const park = pen(onAdd);
    fireEvent.focus(park);
    expect(park.closest('div')?.querySelector('[data-part="pen-at"]')
      ?? park.querySelector('[data-part="pen-at"]'), 'the pen is invisible until it has drawn').toBeTruthy();
  });

  it('lays a run between two pressed corners', () => {
    const onAdd = vi.fn();
    const park = pen(onAdd);
    fireEvent.focus(park);
    fireEvent.keyDown(park, { key: 'Enter' });          // the pen goes down
    expect(onAdd, 'one press laid a path, with nothing to lay it to').not.toHaveBeenCalled();
    walk(park, 'ArrowRight', 6);                        // ...and walks somewhere else
    fireEvent.keyDown(park, { key: 'Enter' });          // ...and presses the far corner
    expect(onAdd, 'two pressed corners laid no path').toHaveBeenCalledTimes(1);

    const run = onAdd.mock.calls[0][0] as ZooConnector;
    expect(run.a, 'the run has no start').toBeTruthy();
    expect(run.b, 'the run has no end').toBeTruthy();
    expect(Math.hypot(run.b.x - run.a.x, run.b.y - run.a.y),
      'the two corners are the same corner, so the run is a dot').toBeGreaterThan(20);
  });

  it('belongs to the item it was drawn for, so the item can be finished', () => {
    // Without `itemId` a drawn path belongs to no Backlog item, and the thing it was drawn for
    // cannot be accepted. The same fault this file's pointer path already carries a note about.
    const onAdd = vi.fn();
    const s = started();
    const forItem = s.backlog.find((it) => it.status === 'committed')!;
    const c = render(
      <MemoryRouter>
        <ParkPlan state={s} tool="path" runFor={forItem.id} onAddConnector={onAdd} onPlaceItem={() => {}} />
      </MemoryRouter>,
    ).container;
    const park = c.querySelector('[data-part="park-plan"]') as SVGSVGElement;
    fireEvent.focus(park);
    fireEvent.keyDown(park, { key: 'Enter' });
    walk(park, 'ArrowRight', 6);
    fireEvent.keyDown(park, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalled();
    expect((onAdd.mock.calls[0][0] as ZooConnector).itemId,
      'the path belongs to nothing, so the item it was drawn for cannot be accepted').toBe(forItem.id);
  });

  it('puts the pen away on Escape, rather than trapping somebody in it', () => {
    const onAdd = vi.fn();
    const park = pen(onAdd);
    fireEvent.focus(park);
    fireEvent.keyDown(park, { key: 'Enter' });
    fireEvent.keyDown(park, { key: 'Escape' });
    // The pen is up: walking and pressing now starts a fresh path rather than finishing the old one.
    walk(park, 'ArrowRight', 6);
    fireEvent.keyDown(park, { key: 'Enter' });
    expect(onAdd, 'Escape did not lift the pen - the half-drawn run was finished anyway')
      .not.toHaveBeenCalled();
  });

  it('takes a bigger step with Shift held, as putting something down does', () => {
    const a = vi.fn(); const b = vi.fn();
    const one = pen(a); fireEvent.focus(one);
    fireEvent.keyDown(one, { key: 'Enter' });
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    fireEvent.keyDown(one, { key: 'Enter' });

    const two = pen(b); fireEvent.focus(two);
    fireEvent.keyDown(two, { key: 'Enter' });
    fireEvent.keyDown(two, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(two, { key: 'Enter' });

    const far = (fn: ReturnType<typeof vi.fn>) => {
      const r = fn.mock.calls[0][0] as ZooConnector;
      return Math.abs(r.b.x - r.a.x);
    };
    expect(a).toHaveBeenCalled(); expect(b).toHaveBeenCalled();
    expect(far(b), 'Shift walks no further than a bare arrow').toBeGreaterThan(far(a));
  });
});
