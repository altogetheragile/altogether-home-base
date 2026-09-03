import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import type { BacklogItem, ZooGameState } from './types';

// The other trees a planting plants.
//
// One planting item is several trees, each standing somewhere of its own. They are all drawn from
// the same item, so without knowing which one was grabbed, dragging the third tree walked the whole
// planting across the park - and there was no way to take one out.

const PLANTING = 'f-trees';

/** A planting standing in the park, with two more of itself beside it. */
function planted(): ZooGameState {
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const one = base.backlog.find((it) => it.category === 'enclosure')!;
  const trees: BacklogItem = {
    ...one, id: PLANTING, name: 'Trees', category: 'flora', template: 'tree', status: 'done',
    enclosureId: undefined, pos: { x: 250, y: 250 },
    copies: [{ x: 420, y: 300 }, { x: 520, y: 380 }],
    design: { parts: { type: 'tree' }, colors: {} },
  } as BacklogItem;
  return { ...base, backlog: [trees, ...base.backlog.filter((it) => it.id !== one.id)] } as ZooGameState;
}

function sized(svg: SVGElement) {
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

describe('the other trees a planting plants', () => {
  it('moves the one that was grabbed, and leaves the planting where it is', () => {
    const onMoveCopy = vi.fn();
    const onPlaceItem = vi.fn();
    const { container } = render(
      <IsoZoo state={planted()} onPlaceItem={onPlaceItem} onMoveCopy={onMoveCopy} />,
    );
    sized(container.querySelector('svg')!);
    const second = container.querySelector(`[data-copy="${PLANTING}:1"]`);
    expect(second, 'the second tree is not something a pointer can tell apart').toBeTruthy();
    fireEvent.pointerDown(second!, { clientX: 400, clientY: 350 });
    fireEvent.pointerMove(window, { clientX: 520, clientY: 420 });
    fireEvent.pointerUp(window, { clientX: 520, clientY: 420 });

    expect(onMoveCopy, 'the tree was not moved').toHaveBeenCalled();
    const [id, index] = onMoveCopy.mock.calls[onMoveCopy.mock.calls.length - 1] as [string, number];
    expect(id).toBe(PLANTING);
    expect(index, 'the wrong tree moved').toBe(1);
    expect(onPlaceItem, 'grabbing one tree walked the whole planting across the park').not.toHaveBeenCalled();
  });

  it('offers a way to take one out, on whatever is open on the bench', () => {
    // Not on hover: the machine this game is mostly played on has no hover at all.
    const onRemoveCopy = vi.fn();
    const { container } = render(
      <IsoZoo state={planted()} onPlaceItem={() => {}} building={PLANTING} onRemoveCopy={onRemoveCopy} />,
    );
    const outs = [...container.querySelectorAll('g')].filter((g) => /Take this one out/.test(g.querySelector('title')?.textContent ?? ''));
    expect(outs.length, 'there is no way to take one of the trees out').toBe(2);
    fireEvent.click(outs[1]);
    expect(onRemoveCopy).toHaveBeenCalledWith(PLANTING, 1);
  });

  it('offers it only for the thing on the bench, and never under the pen', () => {
    const nothingOpen = render(<IsoZoo state={planted()} onPlaceItem={() => {}} onRemoveCopy={() => {}} />);
    expect([...nothingOpen.container.querySelectorAll('title')].some((t) => /Take this one out/.test(t.textContent ?? '')),
      'trees nobody has open offered to remove themselves').toBe(false);

    const drawing = render(
      <IsoZoo state={planted()} onPlaceItem={() => {}} building={PLANTING} onRemoveCopy={() => {}}
        tool="connect" onAddConnector={() => {}} />,
    );
    expect([...drawing.container.querySelectorAll('title')].some((t) => /Take this one out/.test(t.textContent ?? '')),
      'a way to delete a tree was left lying under the pen').toBe(false);
  });
});
