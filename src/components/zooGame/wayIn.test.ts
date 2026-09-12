import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { enclosureAcceptance, presetFor, addFloraTo, addWaterTo, HABITAT_FEATURE_TYPES } from './design';
import { checkCriterion } from './parkChecks';
import { answerPlacement, decisionsIn, splitEpic } from './engine';
import { standingOnPark, parkPositions, whereItStands } from './parkModel';
import { riverY, BANK } from './parkWater';
import { FRONT_Y } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// The way in is part of the habitat, not a card of its own.
//
// It used to be a Product Backlog item per area - "Big Cats Paths" - and that taught the wrong
// thing twice over. It taught a layer: build all the pens, then build all the paths, and discover at
// the Review that half of them lead nowhere. And it let a habitat be Done while nobody could get to
// it, which is the definition of an output that is not an outcome.
//
// So it is one of the habitat's own acceptance criteria. The work is identical - the same Developers
// lay the same run - but it is inside the slice, so the slice is not finished until a visitor can
// walk up to the animal. What stays an item of its own is infrastructure that serves MANY things:
// the main pathways through the grounds, and the bridge over the river.

/** A habitat in hand: standing on the park, built as a home, with nothing round it but grass. */
function habitatInHand(): { state: ZooGameState; item: BacklogItem } {
  const start = initialZooState(1) as ZooGameState;
  let s = start;
  for (const e of s.backlog.filter((i) => i.category === 'epic')) {
    s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  }
  const h = s.backlog.find((it) => it.category === 'enclosure')!;
  const p = presetFor(h);
  const built = { ...h, status: 'committed' as const, started: true,
    design: { ...p, colors: { ...p.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...p, flora: [] }, HABITAT_FEATURE_TYPES[0]),
      water: addWaterTo({ ...p, water: [] }) } } as BacklogItem;
  return { state: { ...s, backlog: s.backlog.map((it) => (it.id === h.id ? built : it)) } as ZooGameState, item: built };
}

const WAY_IN = 'Can I walk to it from the way in?';

describe('a habitat is not finished until you can walk to it', () => {
  it('asks it of every habitat, as the habitat’s own criterion', () => {
    let s = initialZooState(1) as ZooGameState;
    for (const e of s.backlog.filter((i) => i.category === 'epic')) {
      s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
    }
    const pens = s.backlog.filter((it) => it.category === 'enclosure');
    expect(pens.length, 'no habitats to ask about').toBeGreaterThan(1);
    for (const pen of pens) {
      expect(enclosureAcceptance(), `${pen.name} can be Done without a way in`).toContain(WAY_IN);
    }
  });

  it('is not also a Product Backlog item per area', () => {
    let s = initialZooState(1) as ZooGameState;
    for (const e of s.backlog.filter((i) => i.category === 'epic')) {
      s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
    }
    const paths = s.backlog.filter((it) => it.category === 'path');
    // One item, in the grounds, for the pathways everything hangs off. Any more than that and the
    // way in to an animal is a card somebody can choose not to pull.
    expect(paths.map((p) => p.name)).toEqual(['Main Pathways']);
    const withAnimals = new Set(s.backlog.filter((it) => it.category === 'exhibit').map((it) => it.zone));
    for (const p of paths) {
      expect(withAnimals.has(p.zone), `${p.name} is the way in to ${p.zone}, which is that habitat’s job`).toBe(false);
    }
  });

  it('says no while it is a pen in a field, and says what is missing', () => {
    const { state, item } = habitatInHand();
    const v = checkCriterion(state, item, WAY_IN)!;
    expect(v.met, 'a habitat nobody can reach was walkable to').toBe(false);
    // Not just the fact. The evidence names the thing that would fix it, and for a pen on dry
    // ground that is the pen in the strip: "draw a path to it".
    expect(v.evidence, 'nothing says what would fix it').toMatch(/draw a path to it|Bridge/i);
  });

  it('says yes once a run joins it to the way in', () => {
    const { state, item } = habitatInHand();
    const at = whereItStands(state, item)!;
    const joined = { ...state, connectors: [{ id: 'r', itemId: item.id,
      a: { x: at.x, y: FRONT_Y }, b: { x: at.x, y: at.y + 60 }, bends: [], thickness: 14, color: '#c9a86a' }],
    } as ZooGameState;
    const v = checkCriterion(joined, item, WAY_IN)!;
    expect(v.met, 'a run from the way in to the habitat did not count as a way in').toBe(true);
    expect(v.evidence).toMatch(/path/i);
  });

  it('is not answered by a run that goes somewhere else', () => {
    // The reason it is read off the park rather than off the existence of a path: a run laid across
    // the far side of the park is a path, and it is not a way in to this.
    const { state, item } = habitatInHand();
    const elsewhere = { ...state, connectors: [{ id: 'r', itemId: item.id,
      a: { x: 1600, y: FRONT_Y }, b: { x: 1600, y: FRONT_Y - 120 }, bends: [], thickness: 14, color: '#c9a86a' }],
    } as ZooGameState;
    expect(checkCriterion(elsewhere, item, WAY_IN)!.met,
      'any path anywhere counted as the way in to this habitat').toBe(false);
  });
});

describe('the park does not put work where nobody can reach it', () => {
  // see also wayInPen.test.tsx: the pen a player draws the run with, and who the run belongs to

  it('fills the visitors’ side of the water first', () => {
    // Found by watching the Developers fail to finish a habitat: the automatic layout filled the
    // park from the top, which is the FAR bank, and there was nothing to cross the river with. The
    // pen was built, the run could not be laid, and the item sat in Doing with the park saying only
    // "no path reaches it".
    let s = initialZooState(1) as ZooGameState;
    for (const e of s.backlog.filter((i) => i.category === 'epic')) {
      s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
    }
    const pens = s.backlog.filter((it) => it.category === 'enclosure').slice(0, 3);
    s = { ...s, backlog: s.backlog.map((it) => (pens.some((p) => p.id === it.id)
      ? { ...it, status: 'committed' as const, started: true } : it)) } as ZooGameState;
    // No area plots, which is the park before anything has opened: nobody's ground is marked out
    // yet and the layout has the whole park to choose from. That is the state the fault was found
    // in, and "the whole park" included the far bank.
    const standing = standingOnPark(s);
    const where = parkPositions(standing, new Map());
    for (const pen of pens) {
      const at = where.get(pen.id);
      expect(at, `${pen.name} was given nowhere to stand`).toBeTruthy();
      expect(at!.y, `${pen.name} was put across the river with nothing to cross it`)
        .toBeGreaterThan(riverY(at!.x) + BANK);
    }
  });

  it('keeps the Product Owner’s answer, and says why it moved it', () => {
    // "At the back" is a real product decision and stays one. It is just that until something
    // crosses the water, the back of the park is somewhere visitors can see and not somewhere they
    // can walk to - so it goes to the back of the ground people can reach, and the log says so.
    let s = initialZooState(1) as ZooGameState;
    for (const e of s.backlog.filter((i) => i.category === 'epic')) {
      s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
    }
    const pen = s.backlog.find((it) => it.category === 'enclosure')!;
    s = answerPlacement({ ...s, pendingPlacement: { itemId: pen.id, askedAt: 0 } } as ZooGameState, pen.id, 'back');
    const at = s.backlog.find((it) => it.id === pen.id)!.pos!;
    expect(at.y, 'the habitat went to the far bank, where no path can reach it')
      .toBeGreaterThan(riverY(at.x) + BANK);
    const said = decisionsIn(s, s.sprintNumber).map((d) => `${d.what} ${d.cost ?? ''}`).join(' | ');
    expect(said, 'nothing says the answer was moved, or why').toMatch(/nothing crosses the water/i);
  });
});
