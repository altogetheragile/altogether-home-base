import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { ParkOptions } from './ParkOptions';
import { openGroup } from './openGroup';
import { runPoints, pathTarget } from './parkModel';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';

// A run of path is two ends and the joints between them, and an end can be attached to something
// standing on the park.
//
// Reported from playing it: "can the paths connect better to objects and have joints like they used
// to?" Both halves were the same fault. The joints were in the model and nothing drew them, so a
// path with a corner in it was drawn - and walked - as a straight line through whatever was in the
// way. And an attached end resolved to the MIDDLE of the thing it was attached to, so every path
// ran under the building it served and out the other side.
//
// Three places resolved that, separately: the plan, the isometric view and the visitors' routing.

const KIOSK = { x: 600, y: 700 };

const park = (): { s: ZooGameState; kiosk: BacklogItem } => {
  const base = initialZooState(3) as ZooGameState;
  const found = base.backlog.find((it) => it.category === 'amenity')!;
  const kiosk = { ...found, status: 'open' as const, started: true, sprintNumber: 1,
    design: presetFor(found), pos: KIOSK } as BacklogItem;
  return {
    s: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === kiosk.id ? kiosk : it)) } as ZooGameState,
    kiosk,
  };
};

const run = (over: Partial<ZooConnector> = {}): ZooConnector => ({
  id: 'r1', itemId: 'paths', a: { x: 300, y: 1000 }, b: { ...KIOSK, featureId: 'x' },
  bends: [], thickness: 14, color: '#c9a86a', ...over,
} as ZooConnector);

describe('where a run actually goes', () => {
  const box = { at: KIOSK, size: { w: 80, h: 60 } };
  const whereIs = (id: string) => (id === 'x' ? box : undefined);

  it('goes through its joints, in order', () => {
    const pts = runPoints(run({ bends: [{ x: 300, y: 800 }, { x: 450, y: 800 }] }), whereIs);
    expect(pts.length, 'the joints were dropped').toBe(4);
    expect(pts[1]).toEqual({ x: 300, y: 800 });
    expect(pts[2]).toEqual({ x: 450, y: 800 });
  });

  it('stops at the wall of what it is attached to, not in the middle of it', () => {
    const [, end] = runPoints(run(), whereIs, true);
    const inside = Math.abs(end.x - KIOSK.x) < box.size.w / 2 && Math.abs(end.y - KIOSK.y) < box.size.h / 2;
    expect(inside, 'the path still runs to the middle of the kiosk').toBe(true);
    // ...but only just inside it: at the wall, biting in far enough that there is no hairline of
    // grass between the path and the building.
    const reach = Math.hypot(end.x - KIOSK.x, end.y - KIOSK.y);
    expect(reach, 'the path stops short of the building').toBeGreaterThan(box.size.h / 2 * 0.7);
  });

  it('leaves a building towards its first joint, not towards the far end', () => {
    // A run that bends away has to come out of the side it actually goes, or it crosses its own
    // building to get to the corner.
    const bent = runPoints(run({ bends: [{ x: 900, y: 700 }] }), whereIs, true);
    expect(bent[bent.length - 1].x, 'it left by the wrong wall').toBeGreaterThan(KIOSK.x);
  });

  it('leaves an unattached end exactly where it was drawn', () => {
    const [start] = runPoints(run(), whereIs, true);
    expect(start).toEqual({ x: 300, y: 1000 });
  });
});

describe('what a run stops at', () => {
  it('meets the walkway round a habitat, not the fence', () => {
    // A path that carried on to the pen is a path through it. Visitors stand on the apron to look
    // in, and that is where the run should arrive.
    const pen = { id: 'pen', category: 'enclosure' } as BacklogItem;
    const size = { w: 200, h: 140 };
    expect(pathTarget(pen, size).w, 'a run would arrive at the fence itself').toBeGreaterThan(size.w);
    // ...and a building is walked right up to.
    expect(pathTarget({ id: 'k', category: 'amenity' } as BacklogItem, size)).toEqual(size);
  });
});

describe('both drawings agree about it', () => {
  const withRun = (bends: { x: number; y: number }[]) => {
    const { s, kiosk } = park();
    return { ...s, connectors: [run({ b: { ...KIOSK, featureId: kiosk.id }, bends })] } as ZooGameState;
  };

  it('draws the joints on the plan', () => {
    const s = withRun([{ x: 300, y: 800 }]);
    const { container } = render(<ParkPlan state={s} />);
    const drawn = container.querySelector('[data-conn="r1"]')!;
    expect(drawn, 'the run is not drawn at all').toBeTruthy();
    const pts = (drawn.getAttribute('points') ?? '').trim().split(/\s+/);
    expect(pts.length, 'a run with a joint in it is drawn as a straight line').toBe(3);
  });

  it('draws the joints in the isometric view too', () => {
    // The two views drifting apart is the recurring fault in this park: one of them drew the
    // coordinates it was given while the other resolved them.
    const s = withRun([{ x: 300, y: 800 }]);
    const { container } = render(<IsoZoo state={s} height={520} />);
    const drawn = [...container.querySelectorAll('[data-conn="r1"]')];
    // One quad per leg. A run with one corner is two legs, and drawing it as one is drawing a
    // straight bar through whatever the player bent the path around.
    expect(drawn.length, 'the isometric view drew a run with a joint as one straight leg').toBe(2);
    const straight = render(<IsoZoo state={withRun([])} height={520} />).container;
    expect(straight.querySelectorAll('[data-conn="r1"]').length,
      'a straight run is drawn as more than one leg').toBe(1);
  });
});

describe('laying one', () => {
  const draw = (at: { x: number; y: number }[], connectors: ZooConnector[] = []) => {
    const { s } = park();
    const added: ZooConnector[] = [];
    const patched: [string, Partial<ZooConnector>][] = [];
    const live = { ...s, connectors } as ZooGameState;
    const { container, rerender } = render(
      <ParkPlan state={live} tool="path" runFor="paths"
        onAddConnector={(c) => { added.push(c); connectors.push(c); }}
        onUpdateConnector={(id, patch) => {
          patched.push([id, patch]);
          const i = connectors.findIndex((c) => c.id === id);
          if (i >= 0) connectors[i] = { ...connectors[i], ...patch } as ZooConnector;
        }} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    for (const p of at) {
      fireEvent.pointerDown(svg, { clientX: p.x, clientY: p.y });
      rerender(<ParkPlan state={{ ...s, connectors: [...connectors] } as ZooGameState} tool="path" runFor="paths"
        onAddConnector={(c) => { added.push(c); connectors.push(c); }}
        onUpdateConnector={(id, patch) => {
          patched.push([id, patch]);
          const i = connectors.findIndex((c) => c.id === id);
          if (i >= 0) connectors[i] = { ...connectors[i], ...patch } as ZooConnector;
        }} />);
    }
    return { added, patched, connectors };
  };

  it('bends the path it is laying rather than starting a second one beside it', () => {
    // Three presses is a path with a corner in it, not two paths that happen to touch. Each one
    // carries on from where the last stopped, which is what "joints like they used to" means to
    // somebody laying a route round a habitat and up to the kiosk.
    const { added, connectors } = draw([{ x: 60, y: 300 }, { x: 60, y: 200 }, { x: 260, y: 200 }]);
    expect(added.length, 'a second press started a whole new path').toBe(1);
    expect(connectors[0].bends.length, 'the corner was not kept as a joint').toBe(1);
  });
});

describe('the pen and the menu it lives in', () => {
  const strip = (drawing: boolean, onDrawing: (on: boolean) => void) => {
    const { s, kiosk } = park();
    return render(
      <ParkOptions state={s} item={kiosk} inside={null} drawing={drawing} onDrawing={onDrawing}
        api={{ onDesign: () => {}, onSetEnclosure: () => {} }} />,
    );
  };

  it('puts the pen away when the menu it lives in is closed', () => {
    // The pen is a mode: while it is out, every press on the park draws instead of selecting. It
    // used to be a chip on a flat strip that was always on screen, so you could see it was out.
    // Behind a menu, closing the menu left it out invisibly - which is the trap Look Inside was
    // fixed for, walked into again from the other side.
    const onDrawing = vi.fn();
    strip(true, onDrawing);
    const panel = openGroup('path');
    fireEvent.keyDown(panel.querySelector('[data-part="panel-path"]')!, { key: 'Escape' });
    expect(onDrawing, 'closing the menu left the pen out').toHaveBeenCalledWith(false);
  });

  it('says the pen is out, on the button, where the menu is shut', () => {
    const { container } = strip(true, () => {});
    expect(container.querySelector('[data-part="group-path"]')!.getAttribute('data-drawing'),
      'nothing on the closed strip says the pen is out').toBe('yes');
  });
});
