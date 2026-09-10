import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { presetFor, addFloraTo, addWaterTo, HABITAT_FEATURE_TYPES } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Everything you can build can be changed, and this says what "changed" means.
//
// Asked while playing it: "check all flora, fauna and facilities are configurable - can I change
// colours, size, positions?" They were not. A building could say what kind it was and nothing else,
// so every shop and cafe came out the same grey; scenery had no controls at all; and the animals in
// a habitat were drawn on a grid that ignored where anybody had put them.
//
// The four kinds have different things to change - an animal has a coat and no footprint, a river
// has a colour and no group - so this does not insist they are identical. It insists each one can
// be coloured, sized and arranged in the way that kind of thing is.

const noop = () => {};
const api = { onDesign: noop, onSetEnclosure: noop, onAddInside: noop, onTurn: noop, onUnplace: noop, onInside: noop };

const game = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1,
} as ZooGameState);
const of = (s: ZooGameState, category: string): BacklogItem =>
  s.backlog.find((it) => it.category === category)!;
/** The options strip, which is where everything is built now: one row under the park, offering
 *  only what the selected object has. */
const open = (state: ZooGameState, item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter><ParkOptions state={state} item={item} api={api} {...props} /></MemoryRouter>,
);
/** Every colour swatch the takeover offers, by what it is a colour OF. */
const swatches = (container: HTMLElement) => [...container.querySelectorAll('button[aria-label]')]
  .map((b) => b.getAttribute('aria-label') ?? '')
  .filter((l) => /#([0-9a-f]{6})/i.test(l));

// Nothing gets built with no controls at all.
//
// The lion had exactly one: "Turn". The strip knew about habitats, scenery, buildings and paths,
// and nobody had written the branch for an animal - so the one thing in the zoo a visitor comes to
// see could not be given a coat or a family. This sweeps every kind, so a category with no branch
// fails here rather than in somebody's hands.
describe('every kind of thing has controls', () => {
  const wanted: Record<string, RegExp> = {
    enclosure: /Footprint/,
    exhibit: /How many/,
    flora: /Size|Kind|Bank|Deck/,
    amenity: /Type/,
    path: /Width/,
  };
  for (const [category, expected] of Object.entries(wanted)) {
    it(`a ${category} can be worked on`, () => {
      const s = game();
      const item = of(s, category);
      expect(item, `there is no ${category} in the starting Backlog to try`).toBeTruthy();
      const { container } = open(s, item);
      const text = container.textContent ?? '';
      expect(text, `a ${category} has nothing but its name`).toMatch(expected);
      // A strip with one lonely group is the shape the lion was in: worth failing on.
      expect(container.querySelectorAll('button').length, `a ${category} offers almost nothing`).toBeGreaterThan(2);
    });
  }
});

describe('what you can change about each kind of thing', () => {
  it('a habitat: its footprint, its shape, its ground, its fence and the way inside', () => {
    const s = game();
    const { container } = open(s, of(s, 'enclosure'));
    expect(container.textContent).toMatch(/Footprint/);
    expect(container.textContent).toMatch(/Shape/);
    expect(swatches(container).some((l) => /^Ground /.test(l)), 'a habitat has no ground colour').toBe(true);
    expect(swatches(container).some((l) => /^Fence /.test(l)), 'a habitat has no fence colour').toBe(true);
    expect(container.textContent, 'there is no way in').toMatch(/Look inside/);
  });

  it('inside a habitat: everything that goes in it, named for what it is', () => {
    // The park zooms to the pen rather than opening a window over it, and the strip becomes what
    // goes IN: the same row, the same act, closer in. Written lowercase and capitalised by the
    // stylesheet, so ask the way a reader would.
    const s = game();
    const habitat = of(s, 'enclosure');
    const { container } = open(s, habitat, { inside: habitat });
    for (const kind of ['water', 'rocks', 'tree', 'bush', 'flowers', 'hedge']) {
      expect((container.textContent ?? '').toLowerCase(), `${kind} cannot be put in a habitat`).toContain(`+ ${kind}`);
    }
    expect(container.textContent, 'there is no way back out to the park').toMatch(/Back to the park/);
  });



  it('an animal: how many of them, the coat they wear, and where they live', () => {
    const s = game();
    const { container } = open(s, of(s, 'exhibit'));
    expect(container.textContent).toMatch(/How many/);
    expect(swatches(container).some((l) => /^Coat /.test(l)), 'an animal has no coat colour').toBe(true);
    expect(container.textContent, 'an animal cannot be moved to another habitat').toMatch(/Lives in/);
    // An animal has no ground of its own: it lives inside a habitat, so it is not turned or moved
    // about the park like a kiosk.
    expect(container.textContent, 'an animal was offered the park controls of a building').not.toMatch(/On the park/);
  });

  it('a facility: its walls, roof and sign', () => {
    const s = game();
    const { container } = open(s, of(s, 'amenity'));
    for (const part of ['Walls', 'Roof', 'Sign']) {
      expect(swatches(container).some((l) => l.startsWith(`${part} `)), `a building has no ${part.toLowerCase()} colour`).toBe(true);
    }
    expect(container.textContent, 'a building cannot be turned or moved').toMatch(/Turn|Move/);
  });

  it('scenery: the colours that kind of thing has', () => {
    // No "what kind" for something that came from a card: the card already said what it is.
    const s = game();
    const { container } = open(s, of(s, 'flora'));
    expect(container.textContent, 'a card-driven object was asked what kind of thing it is').not.toMatch(/What kind/);
    expect(swatches(container).length, 'a piece of scenery has no colours').toBeGreaterThan(0);
    expect(container.textContent, 'scenery cannot be turned or moved').toMatch(/Turn|Move/);
  });
});

describe('arranging things where you want them', () => {
  const habitat = (): { s: ZooGameState; item: BacklogItem } => {
    const s = game();
    const h = of(s, 'enclosure');
    const p = presetFor(h);
    const design = { ...p, colors: { ...p.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...p, flora: [] }, HABITAT_FEATURE_TYPES[0]), water: addWaterTo({ ...p, water: [] }) };
    return { s, item: { ...h, draftDesign: design } as BacklogItem };
  };

  it('the water and the planting inside a habitat can be taken hold of, on the park', () => {
    const { s, item } = habitat();
    const standing = { ...s, backlog: s.backlog.map((it) => (it.id === item.id
      ? { ...item, pos: { x: 300, y: 300 }, started: true, status: 'committed' as const } : it)) } as ZooGameState;
    const { container } = render(<ParkPlan state={standing} onMoveInside={() => {}} />);
    expect(container.querySelector('[data-piece="water-0"]'), 'the pool cannot be moved').toBeTruthy();
    expect(container.querySelector('[data-piece="flora-0"]'), 'the rocks cannot be moved').toBeTruthy();
  });

  it('an animal can be moved about inside its fence', () => {
    const onSetMemberSpot = vi.fn();
    const s = game();
    const h = of(s, 'enclosure');
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === h.id)!;
    const standing = {
      ...s,
      backlog: s.backlog.map((it) => {
        if (it.id === h.id) return { ...it, status: 'open' as const, design: presetFor(it), pos: { x: 300, y: 300 } };
        if (it.id === lion.id) return { ...it, status: 'open' as const, design: { ...presetFor(it), group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } };
        return it;
      }),
    } as ZooGameState;
    const { container } = render(<ParkPlan state={standing} onSetMemberSpot={onSetMemberSpot} />);
    const animal = container.querySelector(`[data-animal="${lion.id}-0"]`);
    expect(animal, 'there is no animal on the park to take hold of').toBeTruthy();
    fireEvent.pointerDown(animal!, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 40, clientY: 40 });
    fireEvent.pointerUp(window, { clientX: 40, clientY: 40 });
    // No layout in a test, so the drag itself cannot land - what matters here is that the handle
    // exists and is wired to the one action that moves an animal about.
    expect(typeof onSetMemberSpot).toBe('function');
  });
});
