import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { ParkInspector } from './ParkInspector';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { ENTRANCE } from './parkNetwork';
import { CANVAS_W, FRONT_Y } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// The way in, drawn.
//
// Every habitat has to answer "can I walk to it from the way in?", and the way in was a coordinate
// that nothing on the screen drew: no gate, no arrow, no break in the band, no label, at any zoom.
// So the game asked for a path to a place the park did not show. Reported from a play-through:
// "the entrance is invisible, and the path tool costs you twenty minutes because of it" - twenty
// deliberate attempts, passed by accident rather than by understanding.
//
// It is terrain, like the river: it was there before the zoo was, it is on nobody's Product Backlog,
// and it cannot be moved. The Entrance you can BUILD is the arch and the signage over it.

const park = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);

describe('the way in', () => {
  it('is drawn on the park, where the routing says it is', () => {
    const { container } = render(<ParkPlan state={park()} height={520} />);
    const gate = container.querySelector('[data-part="way-in"]')!;
    expect(gate, 'the park asks for a path to a place it does not draw').toBeTruthy();
    // Where the routing actually starts from, not a second opinion about where the front door is.
    expect(ENTRANCE).toEqual({ x: CANVAS_W / 2, y: FRONT_Y });
    const xs = [...gate.querySelectorAll('rect, line, text')]
      .map((el) => Number(el.getAttribute('x') ?? el.getAttribute('x1') ?? NaN))
      .filter((n) => Number.isFinite(n));
    expect(Math.min(...xs), 'the gate is drawn somewhere other than the way in')
      .toBeGreaterThan(ENTRANCE.x - 120);
    expect(Math.max(...xs)).toBeLessThan(ENTRANCE.x + 120);
  });

  it('says what it is, because a break in a band is only a break in a band', () => {
    const { container } = render(<ParkPlan state={park()} height={520} />);
    expect(container.querySelector('[data-part="way-in"]')!.textContent, 'the gate is not named')
      .toMatch(/way in/i);
  });

  it('is there before anybody has built anything', () => {
    // Terrain. A learner meets this criterion in Sprint 1, on an empty park.
    const bare = { ...park(), backlog: [] } as ZooGameState;
    expect(render(<ParkPlan state={bare} height={520} />).container.querySelector('[data-part="way-in"]'),
      'the way in appears only once something has been built').toBeTruthy();
  });

  it('does not take the pointer, so a run can be drawn through it', () => {
    const { container } = render(<ParkPlan state={park()} height={520} />);
    expect(container.querySelector('[data-part="way-in"]')!.getAttribute('pointer-events'),
      'the thing a path has to reach swallows the presses aimed at it').toBe('none');
  });
});

describe('while something is in your hand', () => {
  it('outlines and names the ground it is allowed to stand on', () => {
    // "Outside the Big Cats area" is a true refusal about a boundary drawn faintly and named once,
    // in grey, at the other end of it.
    const s = park();
    const it0 = s.backlog.find((x) => x.status === 'committed' && x.category === 'enclosure')!;
    const { container } = render(
      <ParkPlan state={s} height={520} placing={{ id: it0.id, w: 120, h: 90 }} onPlace={() => {}} />,
    );
    const ground = container.querySelector('[data-part="its-ground"]');
    expect(ground, 'the area a thing belongs to is not drawn while it is being placed').toBeTruthy();
    expect(ground!.textContent, 'the outlined ground is not named').toBe(it0.zone);
  });

  it('draws it only while something is being placed', () => {
    expect(render(<ParkPlan state={park()} height={520} />).container.querySelector('[data-part="its-ground"]'),
      'the park is outlining an area with nothing in the air').toBeNull();
  });
});

describe('the acceptance criteria panel, while the pen is out', () => {
  const item = (s: ZooGameState): BacklogItem => s.backlog.find((x) => x.status === 'committed')!;

  /** Opened by somebody who wanted to read what they had to satisfy - which is what leaves it open
   *  over the park when they then pick up the pen. It is a pill until asked for. */
  const opened = (s: ZooGameState, quiet?: boolean) => {
    const r = render(<ParkInspector state={s} item={item(s)} quiet={quiet} />);
    const pill = r.container.querySelector('[data-part="park-inspector"][data-collapsed="yes"]');
    if (pill) fireEvent.click(pill);
    return r.container;
  };

  it('is the whole panel when it is asked for', () => {
    expect(opened(park()).querySelector('[data-part="park-inspector"]')!.getAttribute('data-collapsed'),
      'the criteria stay a pill even when somebody opens them').not.toBe('yes');
  });

  it('comes down to a pill again the moment the pen comes out', () => {
    // It used to stay a full panel at 45%: still half the park, over the very ground somebody was
    // clicking into, and no way to put it away without stopping drawing.
    const panel = opened(park(), true).querySelector('[data-part="park-inspector"]')!;
    expect(panel.getAttribute('data-collapsed'), 'the pen is out and the panel is still in the way').toBe('yes');
    expect(panel.className, 'the panel is dimmed rather than got out of the way').not.toMatch(/opacity-45/);
    expect(panel.className, 'it can still swallow a press meant for the park').toMatch(/pointer-events-none/);
  });
});
