import { describe, it, expect } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { openGroup, showEverything } from './openGroup';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { footprintFor, floraPalette, piecesFor, presetFor, currentDesign, plantScale, type ItemDesign } from './design';
import { removePlant } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// A planting item is a clump, not one tree.
//
// Reported from playing it, all three in one breath: "we can only add one tree and one type of
// tree - there used to be the ability to plant multiple trees of different types. Also, the tree
// size buttons do nothing and a lot of the colour options are pointless - blue trees?"
//
// All three were the same shape of fault: the model could do it and the strip could not say so. The
// game has held several plants per item for months, each with its own kind and its own spot, and the
// park draws them and lets them be dragged and taken out - but the only way to add one was an action
// no screen sent. The size chips wrote a size nothing read. And one palette served every slot, so
// choosing foliage meant picking green out of a row that also offered sky blue.

const planting = (over: Partial<BacklogItem> = {}): { state: ZooGameState; item: BacklogItem } => {
  const base = initialZooState(3) as ZooGameState;
  // A PLANTING item, said outright. This took the first flora item in the Backlog, which was the
  // area's planting until the area stopped having one - and the first flora is now the Bridge,
  // which is filed under flora and is not a plant.
  const found = base.backlog.find((it) => it.category === 'flora' && it.template === 'tree')!;
  const item = { ...found, status: 'committed' as const, started: true, sprintNumber: 1,
    design: presetFor(found), ...over } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === item.id ? item : it)) } as ZooGameState,
    item,
  };
};

const mount = (state: ZooGameState, item: BacklogItem, api: Record<string, unknown> = {}) => render(
  <ParkOptions state={state} item={item} inside={null}
    api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {}, ...api }} />,
);

/** What the How many menu holds once it is open - the clump, and the way to add to it.
 *
 *  The controls used to be laid out flat on the strip, then all together under Planting. They are
 *  split by the question they answer now: Planting is what KIND of thing this is, Size is how big
 *  it grew, How many is the clump. */
const strip = (state: ZooGameState, item: BacklogItem, api: Record<string, unknown> = {}) => {
  cleanup();                 // one strip at a time: the panels are portalled to a shared body
  mount(state, item, api);
  showEverything();
  return openGroup('clump').querySelector('[data-part="panel-clump"]')!;
};

describe('planting more than one thing', () => {
  it('offers every kind of plant, not just the one the card came as', () => {
    const { state, item } = planting();
    const planted: [string, string][] = [];
    const said = strip(state, item, { onAddCopy: (id: string, p: string) => planted.push([id, p]) });
    expect(said.textContent, 'there is no way to plant a second thing').toMatch(/Plant another/i);
    // Every piece of the family, so an oak can stand beside a blossom beside a bush.
    for (const p of piecesFor('tree')) {
      expect(said.textContent, `${p.label} cannot be planted`).toContain(p.label);
    }
    fireEvent.click([...said.querySelectorAll('button')].find((b) => /Oak/.test(b.textContent ?? ''))!);
    expect(planted, 'pressing it planted nothing').toEqual([[item.id, 'oak']]);
  });

  it('lists what is planted, with the kind of each one and a way to take it out', () => {
    const { state, item } = planting({ copies: [{ x: 300, y: 300, piece: 'pine' }, { x: 346, y: 300, piece: 'blossom' }] } as Partial<BacklogItem>);
    const changed: [number, string][] = [];
    const pulled: number[] = [];
    const said = strip(state, item, {
      onSetCopyPiece: (_id: string, i: number, p: string) => changed.push([i, p]),
      onRemovePlant: (_id: string, i: number) => pulled.push(i),
    });
    expect(said.textContent, 'it does not say how many plants this is').toMatch(/3 plants/);
    // Row 0 is the item's own plant, so the pine it was given is row 1 and the blossom is row 2.
    const pick = said.querySelector('[data-part="copy-2"]') as HTMLSelectElement;
    expect(pick.value, 'the third plant forgot what it is').toBe('blossom');
    fireEvent.change(pick, { target: { value: 'palm' } });
    expect(changed, 'changing one changed nothing').toEqual([[1, 'palm']]);
    fireEvent.click(said.querySelector('[data-part="remove-copy-1"]')!);
    expect(pulled, 'there is no way to take one out').toEqual([1]);
  });

  it('says nothing about plants for a river, which is not a clump', () => {
    // Not even a menu: there is one river and it is the item. It used to be an empty section of a
    // menu about something else.
    const { state, item } = planting({ template: 'river', design: { parts: { type: 'river' }, colors: {} } } as Partial<BacklogItem>);
    cleanup();
    mount(state, item, { onAddCopy: () => {} });
    showEverything();
    expect(document.querySelector('[data-part="group-clump"]'),
      'a river was offered a second river beside it').toBeNull();
  });
});

describe('the clump is one list', () => {
  // Reported from playing it, with the trail: "I add an oak and two appear in the studio and the
  // isometric view."
  //
  // Both drawings were right and the strip was lying. A planting item is a clump of N plants and the
  // FIRST of them is the item itself - it has a spot and a piece like any other, it is simply the one
  // the card arrived as. The strip listed only the extras, under a heading that counted them all: "2
  // plants" over a single row. So the first press of "Plant another" stood a second tree beside a
  // tree that had no row, and from the park that reads as one press planting two.
  //
  // One question, one answer: the list IS the clump, and the count is the length of the list.

  it('counts what it lists, and lists what is planted', () => {
    for (const copies of [[], [{ x: 300, y: 300, piece: 'pine' }], [{ x: 300, y: 300, piece: 'pine' }, { x: 346, y: 300, piece: 'oak' }]]) {
      const { state, item } = planting({ copies } as Partial<BacklogItem>);
      const said = strip(state, item, { onSetCopyPiece: () => {}, onRemovePlant: () => {} });
      const rows = said.querySelectorAll('[data-part^="copy-"]').length;
      expect(rows, 'the strip lists fewer plants than the item has').toBe(copies.length + 1);
      expect(said.querySelector('[data-part="plants"]')?.textContent,
        `${rows} rows are not headed as ${rows}`).toMatch(new RegExp(`^${rows} plants?`));
    }
  });

  it('says one plant before anything has been added, so adding one says two', () => {
    // The press that started the report. It plants one; the count has to go up by one.
    const { state, item } = planting();
    expect(strip(state, item, { onSetCopyPiece: () => {}, onAddCopy: () => {} })
      .querySelector('[data-part="plants"]')?.textContent,
      'a planting that has not been added to says nothing about what it is').toMatch(/^1 plant[^s]/);
    const after = planting({ copies: [{ x: 300, y: 300, piece: 'oak' }] } as Partial<BacklogItem>);
    expect(strip(after.state, after.item, { onSetCopyPiece: () => {} })
      .querySelector('[data-part="plants"]')?.textContent,
      'one press of Plant another did not read as one more plant').toMatch(/^2 plants/);
  });

  it('changes the item’s own plant from the first row, not a copy', () => {
    const { state, item } = planting({ copies: [{ x: 300, y: 300, piece: 'pine' }] } as Partial<BacklogItem>);
    const designed: ItemDesign[] = [];
    const copied: number[] = [];
    const said = strip(state, item, {
      onDesign: (_id: string, d: ItemDesign) => designed.push(d),
      onSetCopyPiece: (_id: string, i: number) => copied.push(i),
    });
    fireEvent.change(said.querySelector('[data-part="copy-0"]')!, { target: { value: 'blossom' } });
    expect(copied, 'changing the first plant changed one of the others').toEqual([]);
    expect(designed[0]?.parts.piece, 'the first row does not change the plant it names').toBe('blossom');
    expect(designed[0]?.colors?.foliage, 'a blossom was left painted like an oak').toBe('#e8a6c0');
  });

  it('lets the first plant be taken out, by the next one taking its place', () => {
    // It cannot simply be deleted - a planting item has to plant something - so the clump closes up
    // and the plant that was second stands where it already stood, still being what it was.
    const { state, item } = planting({ pos: { x: 400, y: 820 },
      copies: [{ x: 500, y: 900, piece: 'blossom' }, { x: 540, y: 900, piece: 'pine' }] } as Partial<BacklogItem>);
    const after = removePlant(state, item.id, 0).backlog.find((it) => it.id === item.id)!;
    expect(after.copies, 'the clump did not close up').toHaveLength(1);
    expect(after.pos, 'the plant that took its place moved somewhere else').toEqual({ x: 500, y: 900 });
    expect(currentDesign(after).parts.piece, 'it took the place but not the plant').toBe('blossom');
    expect((after.copies ?? [])[0].piece, 'the wrong plant was taken out').toBe('pine');
  });

  it('will not let the last plant be pulled up', () => {
    const { state, item } = planting();
    expect(removePlant(state, item.id, 0), 'a planting item was left planting nothing').toBe(state);
    const said = strip(state, item, { onSetCopyPiece: () => {}, onRemovePlant: () => {} });
    expect((said.querySelector('[data-part="remove-copy-0"]') as HTMLButtonElement).disabled,
      'the only plant offers to pull itself up').toBe(true);
  });
});

describe('the size of a plant', () => {
  // The chips used to write a FOOTPRINT: a rectangle on the park. It made the plan draw a bigger
  // slab, the Increment ignored it, and nothing in the simulation ever read it. Reported from
  // playing it, looking at a planting dragged out into a green slab: "what's the point of expanding
  // the trees?" There was none. How big a plant grew is a choice about the plant.

  it('is how big the plant grew, not how much ground it was given', () => {
    const { item } = planting();
    const one = footprintFor(item);
    const big = footprintFor({ ...item, draftDesign: { ...presetFor(item), parts: { ...presetFor(item).parts, size: 'large' } } } as BacklogItem);
    const small = footprintFor({ ...item, draftDesign: { ...presetFor(item), parts: { ...presetFor(item).parts, size: 'small' } } } as BacklogItem);
    expect(big.w, 'a tree grown large is no bigger than an ordinary one').toBeGreaterThan(one.w);
    expect(small.w, 'a sapling is no smaller than an ordinary one').toBeLessThan(one.w);
  });

  it('cannot be dragged out into a plot', () => {
    // A rectangle is not a thing a tree has, so a footprint written on one is ignored.
    const { item } = planting({ size: { w: 400, h: 300 } } as Partial<BacklogItem>);
    expect(footprintFor(item).w, 'a clump of trees was given a plot to fill').toBeLessThan(200);
  });

  it('is the kind’s own size until somebody chooses one', () => {
    const { item } = planting();
    expect(footprintFor(item).w, 'a plant nobody has sized has no size at all').toBeGreaterThan(0);
  });

  it('is the same choice in both drawings', () => {
    const { item } = planting();
    const big = { ...item, design: { ...presetFor(item), parts: { ...presetFor(item).parts, size: 'large' } } } as BacklogItem;
    expect(plantScale(big.design!), 'the Increment has no idea how big the plant grew').toBeGreaterThan(1);
    expect(plantScale(presetFor(item)), 'a plant nobody sized is drawn as something other than ordinary').toBe(1);
  });
});

describe('the colours offered', () => {
  it('has no blue trees in it', () => {
    const green = floraPalette('foliage', 'tree');
    expect(green, 'a tree can be painted sky blue').not.toContain('#7cc0e8');
    expect(green.length, 'there is nothing to choose between').toBeGreaterThan(2);
    // ...but blossom is pink and a bare tree in autumn is rust, so this is not "greens only".
    expect(green, 'blossom cannot be pink').toContain('#e8a6c0');
  });

  it('gives each slot the colours that slot can be', () => {
    expect(floraPalette('trunk', 'tree').every((c) => !['#7cc0e8', '#e0679a'].includes(c)),
      'a trunk can be pink or blue').toBe(true);
    expect(floraPalette('foliage', 'rocks'), 'a rock cannot be grey').toContain('#9aa1a8');
    expect(floraPalette('foliage', 'pond'), 'water cannot be blue').toContain('#5aa9c8');
  });

  it('offers them where the choice is made', () => {
    // On Planting, which is what the thing IS and what colour it is. How big it grew and how many
    // there are are menus of their own.
    const { state, item } = planting();
    cleanup();
    mount(state, item);
    showEverything();
    const said = openGroup('planting').querySelector('[data-part="panel-planting"]')!;
    const swatches = [...said.querySelectorAll('button[title], button[aria-label]')]
      .map((b) => b.getAttribute('aria-label') ?? b.getAttribute('title') ?? '');
    expect(swatches.some((s) => /leaves|foliage/i.test(s)), 'the leaves cannot be coloured at all').toBe(true);
  });
});

describe('both drawings show the whole clump', () => {
  // Reported from playing it, with the trail: "I can add multiple trees. I only see one on the
  // building park view. I see two on the isometric view."
  //
  // The plan drew the first plant and nothing else, so somebody who planted three trees saw one on
  // the very surface they were planting them with. The isometric had drawn them since the day they
  // could be dragged. The ninth time the two drawings have disagreed about the same piece of state,
  // so this asks them the same question and expects the same answer.
  const clump = (): { state: ZooGameState; item: BacklogItem } => {
    const { state, item } = planting({
      pos: { x: 400, y: 820 }, status: 'open' as const,
      copies: [{ x: 460, y: 820, piece: 'pine' }, { x: 400, y: 880, piece: 'blossom' }],
    } as Partial<BacklogItem>);
    return { state, item };
  };

  it('draws every plant on the plan, not only the first', () => {
    const { state, item } = clump();
    const { container } = render(<ParkPlan state={state} />);
    expect(container.querySelectorAll(`[data-plan-item="${item.id}"]`).length,
      'the planting itself is not drawn').toBe(1);
    expect(container.querySelectorAll(`[data-copy^="${item.id}"]`).length,
      'the rest of the clump is missing from the surface it is planted on').toBe(2);
  });

  it('draws the same number as the Increment does', () => {
    const { state, item } = clump();
    const plan = render(<ParkPlan state={state} />).container;
    const iso = render(<IsoZoo state={state} height={420} width={800} />).container;
    const onPlan = plan.querySelectorAll(`[data-plan-item="${item.id}"], [data-copy^="${item.id}"]`).length;
    const onIso = iso.querySelectorAll(`[data-item="${item.id}"], [data-copy^="${item.id}"]`).length;
    expect(onPlan, 'the two drawings disagree about how many plants there are').toBe(onIso);
  });

  it('gives each plant its own kind, so a pine is not drawn as a blossom', () => {
    const { state, item } = clump();
    const { container } = render(<ParkPlan state={state} />);
    // Canopies, not boxes: a plant seen from straight above is its canopy, and a pine's is darker
    // than a blossom's. The square behind each one is only there to take hold of.
    const fills = [...container.querySelectorAll(`[data-copy^="${item.id}"] circle`)]
      .map((r) => r.getAttribute('fill'));
    expect(fills.length, 'the clump is drawn as boxes again').toBeGreaterThan(1);
    expect(new Set(fills).size, 'every plant in the clump is drawn the same colour').toBeGreaterThan(1);
  });

  it('draws a planting as planting, and not as a green rectangle', () => {
    // Reported from playing it, of a park with three plantings standing on it as slabs: "what's the
    // point of expanding the trees?" A plot is a thing a habitat has. A clump of trees has plants.
    const { state, item } = clump();
    const { container } = render(<ParkPlan state={state} />);
    const box = container.querySelector(`[data-plan-item="${item.id}"] rect`)!;
    expect(box.getAttribute('fill'), 'a clump of trees is still painted as a filled box').toBe('transparent');
    expect(container.querySelectorAll(`[data-plan-item="${item.id}"] circle`).length,
      'nothing was drawn where the planting stands').toBeGreaterThan(0);
  });
});
