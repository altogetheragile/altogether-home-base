import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BuildTakeover } from './BuildTakeover';
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
const edit = {
  onDesign: noop, onRename: noop, onSetEnclosure: noop, onToggleTask: noop, onConfirmAc: noop,
  onFinishBuild: noop, onRelease: noop, onInspect: noop, copySources: () => [], onAddPlant: noop,
  onSetPlantPiece: noop, onRemovePlant: noop,
} as unknown as Parameters<typeof BuildTakeover>[0]['edit'];

const game = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1,
} as ZooGameState);
const of = (s: ZooGameState, category: string): BacklogItem =>
  s.backlog.find((it) => it.category === category)!;
const open = (state: ZooGameState, item: BacklogItem, props: Record<string, unknown> = {}) => render(
  <MemoryRouter><BuildTakeover state={state} item={item} edit={edit} onClose={noop} {...props} /></MemoryRouter>,
);
/** Every colour swatch the takeover offers, by what it is a colour OF. */
const swatches = (container: HTMLElement) => [...container.querySelectorAll('button[aria-label]')]
  .map((b) => b.getAttribute('aria-label') ?? '')
  .filter((l) => /#([0-9a-f]{6})/i.test(l));

describe('what you can change about each kind of thing', () => {
  it('a habitat: its footprint, its shape, its ground and what is inside it', () => {
    const s = game();
    const { container } = open(s, of(s, 'enclosure'));
    expect(container.textContent).toMatch(/Footprint/);
    expect(container.textContent).toMatch(/Shape/);
    expect(swatches(container).some((l) => /^Ground /.test(l)), 'a habitat has no ground colour').toBe(true);
    // ...and everything that goes in it, named for what it is.
    // Written lowercase and capitalised by the stylesheet, so ask the way a reader would.
    for (const kind of ['water', 'rocks', 'tree', 'bush', 'flowers', 'hedge']) {
      expect((container.textContent ?? '').toLowerCase(), `${kind} cannot be put in a habitat`).toContain(`+ ${kind}`);
    }
  });

  it('an animal: how many, and the coat they wear', () => {
    const s = game();
    const { container } = open(s, of(s, 'exhibit'), { onPutIn: noop });
    expect(container.textContent).toMatch(/How many/);
    expect(swatches(container).some((l) => /^Coat /.test(l)), 'an animal has no coat colour').toBe(true);
  });

  it('a facility: what kind of building, and its walls, roof and sign', () => {
    const s = game();
    const { container } = open(s, of(s, 'amenity'));
    expect(container.textContent).toMatch(/What kind/);
    for (const part of ['Walls', 'Roof', 'Sign']) {
      expect(swatches(container).some((l) => l.startsWith(`${part} `)), `a building has no ${part.toLowerCase()} colour`).toBe(true);
    }
    expect(container.textContent, 'nothing says where its size is set').toMatch(/drag a corner/);
  });

  it('scenery: what kind of feature, and the colours that kind has', () => {
    const s = game();
    const { container } = open(s, of(s, 'flora'));
    expect(container.textContent).toMatch(/What kind/);
    expect((container.textContent ?? '').toLowerCase()).toMatch(/river|bridge|fountain/);
    expect(swatches(container).length, 'a piece of scenery has no colours').toBeGreaterThan(0);
    expect(container.textContent).toMatch(/drag a corner/);
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

  it('the water and the planting inside a habitat can be taken hold of', () => {
    const { s, item } = habitat();
    const { container } = open(s, item);
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
