import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import { CANVAS_W } from './parkLayout';
import type { BacklogItem, ZooGameState } from './types';

// How long a river is, how wide, and which way it runs.
//
// A river has to reach both banks and a bridge has to cross it, so a size is a measurement and not
// a design. The blueprint grew grips on whatever you were working on; this view had none, so a
// river drawn here could only be moved - which is the last thing keeping two drawings of one park.

const RIVER = 'f-river';
const ENC = 'e-box';

function withRiver(): ZooGameState {
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const one = base.backlog.find((it) => it.category === 'enclosure')!;
  const river: BacklogItem = {
    ...one, id: RIVER, name: 'River', category: 'flora', template: 'river', status: 'done',
    enclosureId: undefined, pos: { x: 300, y: 300 }, size: { w: 200, h: 40 },
    design: { parts: { type: 'river' }, colors: {} },
  } as BacklogItem;
  const enc: BacklogItem = { ...one, id: ENC, status: 'done', enclosureSize: 'medium', pos: { x: 600, y: 200 } } as BacklogItem;
  return { ...base, backlog: [river, enc, ...base.backlog.filter((it) => it.id !== one.id)] } as ZooGameState;
}

function sized(svg: SVGElement) {
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** The grips, by what each one says it is for. */
const grip = (container: HTMLElement, hint: RegExp) =>
  [...container.querySelectorAll('circle')].find((c) => hint.test(c.querySelector('title')?.textContent ?? ''));

describe('sizing a landscape feature where it lies', () => {
  it('offers a grip for its length, its width and its facing', () => {
    const { container } = render(
      <IsoZoo state={withRiver()} selected={RIVER} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={() => {}} />,
    );
    expect(!!grip(container, /longer or shorter/), 'nothing to make a river longer with').toBe(true);
    expect(!!grip(container, /wider or narrower/), 'nothing to make a river wider with').toBe(true);
    expect(!!grip(container, /turn it/), 'nothing to turn a river with').toBe(true);
  });

  it('grows towards the far bank, holding the near edge where it is', () => {
    // Growing from the middle walks the river backwards as you lengthen it.
    const onSetSize = vi.fn();
    const onPlaceItem = vi.fn();
    const { container } = render(
      <IsoZoo state={withRiver()} selected={RIVER} onPlaceItem={onPlaceItem} onSetSize={onSetSize} onSetRot={() => {}} />,
    );
    sized(container.querySelector('svg')!);
    const g = grip(container, /longer or shorter/)!;
    fireEvent.pointerDown(g, { clientX: 400, clientY: 350 });
    fireEvent.pointerMove(window, { clientX: 700, clientY: 500 });
    fireEvent.pointerUp(window, { clientX: 700, clientY: 500 });

    expect(onSetSize, 'the river was never resized').toHaveBeenCalled();
    const [id, size] = onSetSize.mock.calls[onSetSize.mock.calls.length - 1] as [string, { w: number; h: number }];
    expect(id).toBe(RIVER);
    expect(size.h, 'lengthening a river changed how wide it is').toBe(40);
    expect(size.w).toBeGreaterThanOrEqual(40);
    expect(size.w).toBeLessThanOrEqual(CANVAS_W);
    // The near edge stayed at 200, so the middle is half the new length past it.
    const [, pos] = onPlaceItem.mock.calls[onPlaceItem.mock.calls.length - 1] as [string, { x: number; y: number }];
    expect(pos.x, 'the river moved instead of growing').toBeCloseTo(200 + size.w / 2, 0);
    expect(pos.y, 'lengthening a river moved it up or down the park').toBe(300);
  });

  it('settles landscape on fifteens, and a box on quarters', () => {
    // A river at 37 degrees still looks like a river. A building at 37 degrees stops agreeing with
    // its own roof, and with every other box in an isometric park.
    const onSetRot = vi.fn();
    const river = render(
      <IsoZoo state={withRiver()} selected={RIVER} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={onSetRot} />,
    );
    sized(river.container.querySelector('svg')!);
    fireEvent.pointerDown(grip(river.container, /turn it/)!, { clientX: 400, clientY: 300 });
    fireEvent.pointerMove(window, { clientX: 560, clientY: 470 });
    fireEvent.pointerUp(window, { clientX: 560, clientY: 470 });
    const landRot = onSetRot.mock.calls[onSetRot.mock.calls.length - 1][1] as number;
    expect(landRot % 15, `a river settled at ${landRot} degrees`).toBe(0);

    onSetRot.mockClear();
    const box = render(
      <IsoZoo state={withRiver()} selected={ENC} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={onSetRot} />,
    );
    sized(box.container.querySelector('svg')!);
    fireEvent.pointerDown(grip(box.container, /turn it/)!, { clientX: 400, clientY: 300 });
    fireEvent.pointerMove(window, { clientX: 560, clientY: 470 });
    fireEvent.pointerUp(window, { clientX: 560, clientY: 470 });
    const boxRot = onSetRot.mock.calls[onSetRot.mock.calls.length - 1][1] as number;
    expect(boxRot % 90, `a habitat settled at ${boxRot} degrees`).toBe(0);
  });

  it('does not offer to resize a habitat: that is a footprint, chosen on the bench', () => {
    const { container } = render(
      <IsoZoo state={withRiver()} selected={ENC} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={() => {}} />,
    );
    expect(!!grip(container, /longer or shorter/), 'a habitat was offered a length to drag').toBe(false);
    expect(!!grip(container, /turn it/), 'a habitat could not be turned').toBe(true);
  });

  it('puts the grips away while a path is being drawn', () => {
    // Grips sitting on the ground under a pen are three things to catch a run on.
    const { container } = render(
      <IsoZoo state={withRiver()} selected={RIVER} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={() => {}}
        tool="connect" onAddConnector={() => {}} />,
    );
    expect(!!grip(container, /longer or shorter/), 'a grip was left out under the pen').toBe(false);
    expect(!!grip(container, /turn it/), 'a grip was left out under the pen').toBe(false);
  });
});
