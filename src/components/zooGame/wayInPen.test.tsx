import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { ZooShell } from './ZooShell';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { presetFor, PATH_WIDTHS } from './design';
import type { ItemDesign } from './design';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';

// The pen, in the player's hand.
//
// Both of these were found by playing it, and both are the same shape of fault: the rule was right
// and the control was missing, so the one criterion the park answers by looking for a path could not
// be met by hand at all. The Developers laid runs and a person could not.

const game = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const pen = base.backlog.find((it) => it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintNumber: 1,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    committedIds: [pen.id],
    backlog: base.backlog.map((it) => (it.id === pen.id
      // In hand: started, being built, and standing wherever the park seated it. No `pos` - nobody
      // has dragged it, which is the ordinary case and was the broken one.
      ? { ...it, status: 'committed' as const, started: true, sprintNumber: 1, design: presetFor(it) } : it)),
    ...over,
  } as ZooGameState;
};
const penOf = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.category === 'enclosure')!;

describe('the pen is offered for a habitat', () => {
  it('even when nobody has dragged it, because the park seated it', () => {
    // Reported by playing it: the strip offered a fence, a footprint, a ground and a turn, and no
    // way to draw the path its own criterion asks for. The control was gated on the item carrying a
    // position of its own, which only happens once somebody has moved it.
    const s = game();
    const { container } = render(
      <MemoryRouter>
        <ParkOptions state={s} item={penOf(s)} inside={null} onDrawing={() => {}}
          api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {} }} />
      </MemoryRouter>,
    );
    const strip = container.querySelector('[data-part="park-options"]')!;
    expect(strip.textContent, 'the habitat was offered no pen to draw its way in with')
      .toMatch(/Draw a path to it/i);
  });
});

describe('how wide the path is', () => {
  it('is asked of a habitat too, not only of a pathway item', () => {
    // Reported from playing it: "how can I set the path width?" A habitat holding the pen was given
    // the pen and nothing else, so the same path drawn from the Main Pathways could be a track or a
    // boulevard and the one drawn to a pen could only be whatever the default was.
    const s = game();
    const chosen: ItemDesign[] = [];
    const { container } = render(
      <MemoryRouter>
        <ParkOptions state={s} item={penOf(s)} inside={null} onDrawing={() => {}}
          api={{ onDesign: (_id, d) => chosen.push(d), onSetEnclosure: () => {}, onAddInside: () => {} }} />
      </MemoryRouter>,
    );
    const strip = container.querySelector('[data-part="park-options"]')!;
    expect(strip.textContent, 'the habitat was given the pen and no width to draw at').toMatch(/Width/);
    const wide = [...strip.querySelectorAll('button')]
      .find((x) => x.textContent?.trim() === PATH_WIDTHS[PATH_WIDTHS.length - 1].label)!;
    expect(wide, 'the widths are not offered as something to press').toBeTruthy();
    fireEvent.click(wide);
    expect(chosen[0]?.parts.thickness, 'pressing a width changed nothing about the habitat')
      .toBe(PATH_WIDTHS[PATH_WIDTHS.length - 1].key);
  });
});

describe('a run already laid can be taken back up', () => {
  it('is listed on the habitat that owns it, with a way to lift it', () => {
    // Reported from playing it: "how do I delete a path mistake?" The runs of a pathway item were
    // listed on its own strip with a bin on each; a habitat's runs were not listed anywhere, so a
    // run drawn to the wrong place could only be worked around.
    const s = game();
    const pen = penOf(s);
    const lifted: string[] = [];
    const withRun = { ...s, connectors: [{ id: 'r1', itemId: pen.id,
      a: { x: 300, y: 1060 }, b: { x: 300, y: 800 }, bends: [], thickness: 9, color: '#c9a86a' }] } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <ParkOptions state={withRun} item={pen} inside={null} onDrawing={() => {}}
          api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {},
            onRemoveRun: (id: string) => lifted.push(id) }} />
      </MemoryRouter>,
    );
    const strip = container.querySelector('[data-part="park-options"]')!;
    expect(strip.textContent, 'the habitat does not say what runs it has').toMatch(/1 run/);
    const bin = strip.querySelector('[data-part="remove-run"]') as HTMLButtonElement | null;
    expect(bin, 'there is no way to take a run back up from the habitat that owns it').toBeTruthy();
    fireEvent.click(bin!);
    expect(lifted, 'pressing it lifted nothing').toEqual(['r1']);
  });
});

describe('the pen wins while it is out', () => {
  it('draws where you press, instead of putting the habitat down there', () => {
    // The fault behind "how can I get the Product Owner to review?": an item waiting to be built on
    // the park wanted the same press as the pen, and took it. The first click set the habitat down
    // where the path should have started, so the run was never begun and the criterion could not be
    // met - with the chip still saying "click where it starts, then where it ends".
    const s = game();
    const pen = penOf(s);
    const laid: ZooConnector[] = [];
    const placed: string[] = [];
    const { container } = render(
      <MemoryRouter>
        <ParkPlan state={s} tool="path" runFor={pen.id}
          placing={{ id: pen.id, w: 172, h: 114 }}
          onPlace={(id: string) => placed.push(id)}
          onAddConnector={(c: ZooConnector) => laid.push(c)} />
      </MemoryRouter>,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(svg, { clientX: 60, clientY: 700 });
    fireEvent.pointerDown(svg, { clientX: 140, clientY: 420 });
    expect(placed, 'the press put the habitat down instead of drawing').toEqual([]);
    expect(laid.length, 'two presses with the pen out drew nothing').toBe(1);
    expect(laid[0].itemId).toBe(pen.id);
  });
});

describe('a run drawn to a habitat belongs to it', () => {
  it('is the habitat’s own work, not a run that belongs to nobody', () => {
    // The other half. Without this the run counted for the criterion - the park only asks whether
    // anything reaches the pen - but it belonged to no item, so the Developers laid a second one
    // beside it and the work the player did was not the work the card was Done by.
    const s = game();
    const pen = penOf(s);
    const laid: ZooConnector[] = [];
    const { container } = render(
      <MemoryRouter>
        <ZooShell state={s} onSetClockPaused={() => {}} building={pen.id} drawing
          drawRoute={{ id: pen.id, name: pen.name, style: { thickness: 14, color: '#c9a86a' } }}
          onAddConnector={(c: ZooConnector) => laid.push(c)}><div>the board</div></ZooShell>
      </MemoryRouter>,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    // jsdom lays nothing out, and the park maps a pointer through its own box.
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(svg, { clientX: 40, clientY: 700 });
    fireEvent.pointerDown(svg, { clientX: 120, clientY: 400 });
    expect(laid.length, 'two clicks on the park drew nothing').toBe(1);
    expect(laid[0].itemId, 'the run the player drew belonged to nobody').toBe(pen.id);
  });
});
