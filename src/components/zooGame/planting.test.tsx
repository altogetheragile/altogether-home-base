import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { initialZooState } from './config';
import { footprintFor, floraPalette, piecesFor, presetFor } from './design';
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
  const found = base.backlog.find((it) => it.category === 'flora')!;
  const item = { ...found, status: 'committed' as const, started: true, sprintNumber: 1,
    design: presetFor(found), ...over } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === item.id ? item : it)) } as ZooGameState,
    item,
  };
};

const strip = (state: ZooGameState, item: BacklogItem, api: Record<string, unknown> = {}) => render(
  <ParkOptions state={state} item={item} inside={null}
    api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {}, ...api }} />,
).container.querySelector('[data-part="park-options"]')!;

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
      onRemoveCopy: (_id: string, i: number) => pulled.push(i),
    });
    expect(said.textContent, 'it does not say how many plants this is').toMatch(/3 plants/);
    const pick = said.querySelector('[data-part="copy-1"]') as HTMLSelectElement;
    expect(pick.value, 'the second plant forgot what it is').toBe('blossom');
    fireEvent.change(pick, { target: { value: 'palm' } });
    expect(changed, 'changing one changed nothing').toEqual([[1, 'palm']]);
    fireEvent.click(said.querySelector('[data-part="remove-copy-0"]')!);
    expect(pulled, 'there is no way to take one out').toEqual([0]);
  });

  it('says nothing about plants for a river, which is not a clump', () => {
    const { state, item } = planting({ template: 'river', design: { parts: { type: 'river' }, colors: {} } } as Partial<BacklogItem>);
    expect(strip(state, item, { onAddCopy: () => {} }).textContent,
      'a river was offered a second river beside it').not.toMatch(/Plant another/i);
  });
});

describe('the size of a plant', () => {
  it('is the size somebody chose', () => {
    // The chips wrote a size and the drawing read the kind's default, so they did nothing at all.
    const { item } = planting({ size: { w: 128, h: 96 } } as Partial<BacklogItem>);
    expect(footprintFor(item), 'a tree set to large is drawn at whatever size trees are')
      .toEqual({ w: 128, h: 96 });
  });

  it('is the kind’s own size until somebody chooses one', () => {
    const { item } = planting();
    expect(footprintFor(item).w, 'a plant nobody has sized has no size at all').toBeGreaterThan(0);
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
    const { state, item } = planting();
    const said = strip(state, item);
    const swatches = [...said.querySelectorAll('button[title], button[aria-label]')]
      .map((b) => b.getAttribute('aria-label') ?? b.getAttribute('title') ?? '');
    expect(swatches.some((s) => /leaves|foliage/i.test(s)), 'the leaves cannot be coloured at all').toBe(true);
  });
});
