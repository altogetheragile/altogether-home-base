import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { writeBacklog, splitEpic } from './engine';
import { lookAhead } from './lookAhead';
import { checkCriterion } from './parkChecks';
import { presetFor, addFloraTo, addWaterTo } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Planting is how a habitat stops being a shed. It is not a second item.
//
// The same sentence was written about paths a year earlier: a path that serves one habitat is part
// of making that habitat usable, so it is one of the habitat's own acceptance criteria rather than
// a second item somebody has to finish before the first is worth anything. That was a layer wearing
// a slice's clothes, in a game whose central lesson is the difference.
//
// A habitat is asked "can I tell an animal lives here, not a shed?", and the answer is ground,
// shelter, planting and water INSIDE it. A separate planting item asked for the same work twice.

const brief = { zones: ['Big Cats', 'Forest'], audience: 'families' as const, firstZone: 'Big Cats' };
const written = (): ZooGameState =>
  writeBacklog({ ...initialZooState(1), backlog: [] } as ZooGameState, brief);

describe('the Product Backlog the game writes', () => {
  it('has no planting item for an area', () => {
    const s = written();
    const perArea = s.backlog.filter((it) => /planting/i.test(it.name));
    expect(perArea.map((it) => it.name), 'an area still arrives with planting as its own item').toEqual([]);
  });

  it('does not hide one inside an area epic either', () => {
    const s = written();
    const buried = s.backlog
      .filter((it) => it.category === 'epic')
      .flatMap((e) => (e.epicMembers ?? []).filter((m) => m.kind === 'flora').map((m) => `${e.name}: ${m.name}`));
    expect(buried, 'splitting an area would produce a planting item').toEqual([]);
  });

  it('still carries the park’s own greenery, which belongs to no habitat', () => {
    // The Grounds trees answer nothing else's criterion: there is no habitat they are the inside of.
    // Removing the area's planting is not an argument against greenery, it is an argument against
    // asking for the same work twice.
    const s = written();
    expect(s.backlog.some((it) => it.zone === 'Grounds' && it.template === 'tree'),
      'the park lost its greenery along with the duplication').toBe(true);
  });

  it('is not proposed by the look-ahead either', () => {
    const s = written();
    const planting = lookAhead({ ...s, sprintNumber: 1 } as ZooGameState)
      .filter((p) => /planting|growing/i.test(p.why));
    expect(planting.map((p) => p.id), 'the Product Owner is still nudged to order it').toEqual([]);
  });

  it('leaves the look-ahead something worth noticing', () => {
    // A facility buried in an epic is real work nobody can size or pull into a Sprint, and
    // splitting is the answer rather than writing a second one beside it.
    const s = written();
    const split = lookAhead({ ...s, sprintNumber: 1 } as ZooGameState).find((p) => p.kind === 'split');
    expect(split, 'nothing is left for the Product Owner to look ahead at').toBeTruthy();
  });
});

describe('the habitat that asks for it instead', () => {
  const habitat = (): { state: ZooGameState; item: BacklogItem } => {
    const s = written();
    const pen = s.backlog.find((it) => it.category === 'enclosure')!;
    const item = { ...pen, design: presetFor(pen) } as BacklogItem;
    return { state: { ...s, backlog: s.backlog.map((it) => (it.id === pen.id ? item : it)) } as ZooGameState, item };
  };
  const asks = 'Can I tell an animal lives here, not a shed?';

  it('says no while there is nothing growing in it', () => {
    const { state, item } = habitat();
    const bare = { ...item, design: { ...item.design!, flora: [], water: [], colors: {} } } as BacklogItem;
    const v = checkCriterion({ ...state, backlog: state.backlog.map((x) => (x.id === bare.id ? bare : x)) } as ZooGameState, bare, asks)!;
    expect(v.met).toBe(false);
    expect(v.evidence, 'it does not say what is missing or where to put it').toMatch(/shelter or planting/);
  });

  it('says yes once the planting is in it', () => {
    const { state, item } = habitat();
    const d = item.design!;
    const kitted = { ...item, design: {
      ...d, colors: { ...d.colors, ground: '#cdb27a' },
      flora: addFloraTo(d, 'tree'), water: addWaterTo(d),
    } } as BacklogItem;
    const v = checkCriterion({ ...state, backlog: state.backlog.map((x) => (x.id === kitted.id ? kitted : x)) } as ZooGameState, kitted, asks)!;
    expect(v.met, `still a shed: ${v.evidence}`).toBe(true);
  });
});

describe('splitting an area', () => {
  it('yields its animals and its facility, and nothing that repeats a criterion', () => {
    const s = written();
    const epic = s.backlog.find((it) => it.category === 'epic')!;
    const ids = (epic.epicMembers ?? []).map((m) => m.id);
    const after = splitEpic(s, epic.id, ids);
    const made = after.backlog.filter((it) => !s.backlog.some((b) => b.id === it.id));
    expect(made.some((it) => it.category === 'flora'), 'splitting an area still makes planting').toBe(false);
    expect(made.some((it) => it.category === 'enclosure'), 'splitting an area makes no habitat').toBe(true);
  });
});
