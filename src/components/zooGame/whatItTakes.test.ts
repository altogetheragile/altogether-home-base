import { describe, it, expect } from 'vitest';
import { initialZooState, effortOf, starterBacklog } from './config';
import { splitEpic } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// An estimate is effort. Appeal is value. They are different axes.
//
// The sizes in the starter Backlog had quietly become a measure of the wrong one: a Lion was an 8
// and an Elephant a 10, in step with how much visitors like them, while a habitat was defined as
// HALF its animal - `Math.max(3, mem.size / 2)`. So the biggest single piece of work in the game was
// priced at half a number about appeal.
//
// Reported from playing it: "there is no way a lion is 8 and an enclosure is 5. Lion is a 2 at
// most." Quite right, and it matters more than the arithmetic. A game that teaches Scrum cannot have
// the Product Owner's view of value standing in for the Developers' view of effort - that
// conflation is one of the things it exists to teach people out of.

const of = (b: BacklogItem[], id: string) => b.find((it) => it.id === id)!;

describe('what an item is sized at', () => {
  const seed = starterBacklog();

  it('is the work of building it, not how much anybody wants it', () => {
    const pen = of(seed, 'lion-enc');
    const lion = of(seed, 'lion');
    expect(pen.trueSize, 'a habitat is smaller work than the animal that goes in it')
      .toBeGreaterThan(lion.trueSize!);
    expect(lion.trueSize, 'a lion is more than a couple of points of work').toBeLessThanOrEqual(2);
  });

  it('does not move when the animal gets more popular', () => {
    // Appeal is the other axis and it is untouched: a crowd-pleaser is no more work to build.
    const lion = of(seed, 'lion');
    expect(lion.appeal!.families, 'the lion lost the thing that makes it worth building')
      .toBeGreaterThan(5);
    expect(effortOf({ category: 'exhibit' }), 'a popular animal is more work than an unpopular one')
      .toBe(lion.trueSize);
  });

  it('grows with the footprint of a habitat, which is the ground you have to lay', () => {
    expect(effortOf({ category: 'enclosure', enclosureSize: 'large' }))
      .toBeGreaterThan(effortOf({ category: 'enclosure', enclosureSize: 'medium' }));
    expect(effortOf({ category: 'enclosure', enclosureSize: 'medium' }))
      .toBeGreaterThan(effortOf({ category: 'enclosure', enclosureSize: 'small' }));
  });

  it('puts a bench below a building you go inside, and a signpost below planting', () => {
    expect(effortOf({ category: 'amenity', services: 'rest' }))
      .toBeLessThan(effortOf({ category: 'amenity', services: 'food' }));
    expect(effortOf({ category: 'flora', template: 'signpost' }))
      .toBeLessThan(effortOf({ category: 'flora', template: 'tree' }));
  });

  it('is on the scale the Developers estimate in', () => {
    const FIB = [1, 2, 3, 5, 8, 13, 21];
    for (const it of seed.filter((x) => x.category !== 'epic')) {
      expect(FIB.includes(it.trueSize ?? 0), `${it.name} is sized at ${it.trueSize}, which is not a card in the hand`)
        .toBe(true);
    }
  });
});

describe('splitting an epic sizes what comes out of it the same way', () => {
  it('gives the habitat the work of a habitat, rather than half its animal', () => {
    const s = splitEpic(initialZooState(1) as ZooGameState, 'savanna', ['elephant']);
    const pen = of(s.backlog, 'elephant-enc');
    const jumbo = of(s.backlog, 'elephant');
    expect(jumbo.trueSize, 'the most popular animal in the zoo is the most work to build').toBe(2);
    expect(pen.trueSize, 'the habitat came out smaller than the animal').toBeGreaterThan(jumbo.trueSize!);
    expect(pen.trueSize, 'an elephant reserve is the same work as a small pen')
      .toBe(effortOf({ category: 'enclosure', enclosureSize: 'large' }));
  });

  it('sizes every kind that can come out of one', () => {
    const s = splitEpic(initialZooState(1) as ZooGameState, 'savanna', ['elephant', 'cafe']);
    for (const id of ['elephant', 'elephant-enc', 'cafe']) {
      expect(of(s.backlog, id).trueSize, `${id} came out of the split with no size on it`)
        .toBeGreaterThan(0);
    }
  });
});
