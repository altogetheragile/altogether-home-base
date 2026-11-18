import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState, ZooConnector } from './types';
import { checkCriterion } from './parkChecks';

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

const walk = (park: SVGSVGElement, key: string, times = 1) => {
  for (let i = 0; i < times; i += 1) fireEvent.keyDown(park, { key });
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

// The second scrum-master playtest walked the pen eight paces, pressed Enter once - which only
// starts a path - and finished three times with nothing laid: "I have no idea where the pen
// currently is or where the Lion Enclosure is relative to the entrance."
describe('the pen, said in words', () => {
  const where = (c: HTMLElement) => c.querySelector('[data-part="pen-where"]')?.textContent ?? '';

  it('says the order: where a path starts, each corner, and how to finish', () => {
    const said = pen(() => {}).getAttribute('aria-label') ?? '';
    expect(said).toMatch(/press Enter where the path starts/);
    expect(said).toMatch(/Enter twice on the last one to finish/);
  });

  it('says where the pen is, from the way in and from the thing the path is for, and whether a path is started', () => {
    const s = started();
    const forItem = s.backlog.find((it) => it.status === 'committed')!;
    const c = render(
      <MemoryRouter>
        <ParkPlan state={s} tool="path" runFor={forItem.id} onAddConnector={() => {}} onPlaceItem={() => {}} />
      </MemoryRouter>,
    ).container;
    const park = c.querySelector('[data-part="park-plan"]') as SVGSVGElement;
    fireEvent.focus(park);
    expect(c.querySelector('[data-part="pen-where"]')?.getAttribute('aria-live')).toBe('polite');
    // It steers for the nearest path a visitor can already walk from the way in, which is what a
    // new path has to reach, and the pen starts at the thing's door, and says so.
    expect(where(c)).toMatch(/No path started: Enter starts one here\. The nearest path from the way in is .*paces/);
    expect(where(c)).toContain(`You are at the ${forItem.name}.`);
    fireEvent.keyDown(park, { key: 'Enter' });
    expect(where(c)).toMatch(/^Laying a path/);
    const before = where(c);
    fireEvent.keyDown(park, { key: 'ArrowDown' });
    expect(where(c), 'walking the pen did not change what is said about where it is').not.toBe(before);
    fireEvent.keyDown(park, { key: 'ArrowRight', shiftKey: true });
    expect(where(c), 'walked away from it, the pen says which way back to the door').toMatch(new RegExp(`The ${forItem.name} is \\d+ paces left`));
  });
});

describe('a path that stops short', () => {
  // The scrum-master playtest laid the same path six times, ten paces short of the way in each time,
  // and the criterion only ever said "nothing reaches it yet". On the park the gap is plain to see;
  // to a keyboard player it was not there at all.
  const WALK = 'Can I walk to it from the way in?';
  const laid = (presses: [string, number][]) => {
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
    for (const [key, n] of presses) walk(park, key, n);
    fireEvent.keyDown(park, { key: 'Enter' });
    const runs = onAdd.mock.calls.map((call) => call[0] as ZooConnector);
    return { s: { ...s, connectors: [...(s.connectors ?? []), ...runs] }, forItem };
  };

  it('says how far short, in the paces the pen walks', () => {
    const { s, forItem } = laid([['ArrowRight', 12]]);
    const before = checkCriterion(started(), forItem, WALK);
    expect(before?.met, 'the park already reached it, so this proves nothing').toBe(false);
    const v = checkCriterion(s, forItem, WALK);
    expect(v?.met).toBe(false);
    expect(v?.evidence).toMatch(/stops about \d+ paces? short/);
  });

  it('is met once it is carried on to the promenade', () => {
    const { s, forItem } = laid([['ArrowDown', 6]]);
    expect(checkCriterion(s, forItem, WALK)?.met).toBe(true);
  });
});
