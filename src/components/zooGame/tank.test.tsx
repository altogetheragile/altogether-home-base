import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { isTank, coatWord, coatChoices, AQUATIC, groupChoices, groupSize, hasRoomToRoam, roomNeeded } from './design';
import { splitEpic } from './engine';
import { initialZooState } from './config';
import { IsoZoo } from './IsoZoo';
import type { ZooGameState, BacklogItem } from './types';

// A reef is not kept in a paddock with a pond in the corner.
//
// Reported from playing it, with a picture of a classic zoo aquarium: "the reef is a fish tank, an
// area for fish - it needs to look like a tank or an aquarium." It was drawn as a fenced field with
// a puddle, which is what every other habitat is.
//
// So a habitat can be a tank, and it is one when the Developers say so or when everything living in
// it swims. One rule, read by both drawings and by the checks - a habitat cannot be a paddock in
// the plan and an aquarium in the Increment.

const fish = { template: 'reef' };
const cat = { template: 'lion' };

describe('what makes a tank', () => {
  it('is what lives in it, without anybody being asked', () => {
    expect(isTank(undefined, [fish]), 'a reef was housed in a field').toBe(true);
    expect(isTank(undefined, [cat]), 'a lion was put in an aquarium').toBe(false);
    expect(isTank(undefined, []), 'an empty pen guessed at being a tank').toBe(false);
  });

  it('is the Developers’ choice where they make one', () => {
    expect(isTank({ parts: { ground: 'water' }, colors: {} }, [cat]),
      'a habitat asked to be a tank stayed a field').toBe(true);
    expect(isTank({ parts: { ground: 'land' }, colors: {} }, [fish]),
      'a habitat asked to be dry land was flooded anyway').toBe(false);
  });

  it('is what the Reef Tank is, out of the box', () => {
    // The one that prompted it. Splitting the zone gives the reef its habitat; nobody should have
    // to tell the game that a reef lives in water.
    const s = splitEpic(initialZooState(1), 'waterside', ['reef']);
    const reef = s.backlog.find((it) => it.template === 'reef')!;
    const home = s.backlog.find((it) => it.id === reef.enclosureId)!;
    expect(home, 'the reef has no habitat').toBeTruthy();
    expect(isTank(undefined, s.backlog.filter((it) => it.enclosureId === home.id)),
      'the Reef Tank is not a tank').toBe(true);
  });
});

describe('a fish', () => {
  it('has a colour, not a coat', () => {
    // "They do not have a coat, so the control for cats doesn't work."
    expect(coatWord(fish)).toBe('Colour');
    expect(coatWord(cat)).toBe('Coat');
  });

  it('is offered colours a fish comes in', () => {
    const forFish = coatChoices(fish);
    const forCat = coatChoices(cat);
    expect(forFish, 'a reef was offered a lion’s browns').not.toEqual(forCat);
    expect(forFish.length, 'a fish has barely any colours to choose from').toBeGreaterThan(4);
    for (const species of AQUATIC) expect(coatWord({ template: species })).toBe('Colour');
  });
});

describe('the tank in the Increment', () => {
  it('is glass and water, not a fence and a lawn', () => {
    const base = initialZooState(1);
    const home: BacklogItem = {
      id: 'tank', name: 'Reef Tank', zone: 'Waterside', category: 'enclosure', status: 'open',
      started: true, enclosureSize: 'medium', pos: { x: 400, y: 300 },
      acceptance: [], acConfirmed: [], tasks: [], estimate: 5, sprintNumber: 1, accessible: true,
      design: { parts: {}, colors: {} },
    } as BacklogItem;
    const reef = { ...home, id: 'reef', name: 'Reef', category: 'exhibit', template: 'reef',
      enclosureId: 'tank', design: { parts: {}, colors: { coat: '#e2803c' } } } as BacklogItem;
    const s = { ...base, backlog: [home, reef] } as ZooGameState;
    const { container } = render(<IsoZoo state={s} />);
    const water = [...container.querySelectorAll('[data-part="water"]')];
    expect(water.length, 'the tank holds no water at all').toBeGreaterThan(0);
  });
});

describe('how many fish', () => {
  it('is asked in the words a keeper would use, not a mammal’s', () => {
    // "I need to be able to add more than 2 fish to a tank." One / a pair / a family is a lion's
    // social life, offered to everything that lives in the zoo.
    expect(groupChoices(fish).map((c) => c.label)).toEqual(['A few', 'A shoal', 'A big shoal']);
    expect(groupChoices(cat).map((c) => c.label)).toEqual(['One', 'A pair', 'A family']);
    const biggest = groupChoices(fish)[2].group;
    expect(groupSize(biggest), 'a "big shoal" was smaller than a pride of lions').toBeGreaterThan(20);
  });

  it('fits, because a fish does not take a lion’s room', () => {
    // A medium habitat holds four adults, which is right for lions and absurd for a reef: four fish
    // is a goldfish bowl, not a reef.
    const shoal = groupChoices(fish)[1].group;
    expect(hasRoomToRoam(shoal, 'medium', 'reef'), 'a shoal would not fit a medium tank').toBe(true);
    expect(hasRoomToRoam(shoal, 'medium', 'lion'), 'twenty lions fitted a medium pen').toBe(false);
    expect(roomNeeded(shoal, 'reef')).toBeLessThan(roomNeeded(shoal, 'lion'));
  });

  it('is drawn as the number it is', () => {
    const base = initialZooState(1);
    const home = {
      id: 'tank', name: 'Reef Tank', zone: 'Waterside', category: 'enclosure', status: 'open',
      started: true, enclosureSize: 'large', pos: { x: 400, y: 300 }, sprintNumber: 1, accessible: true,
      acceptance: [], acConfirmed: [], tasks: [], estimate: 5, design: { parts: {}, colors: {} },
    } as BacklogItem;
    const shoal = groupChoices(fish)[1].group;
    const reef = { ...home, id: 'reef', name: 'Reef', category: 'exhibit', template: 'reef',
      enclosureId: 'tank', design: { parts: {}, colors: { coat: '#e2803c' }, group: shoal } } as BacklogItem;
    const s = { ...base, backlog: [home, reef] } as ZooGameState;
    const { container } = render(<IsoZoo state={s} />);
    const drawn = container.querySelectorAll('[data-spot^="reef:"]').length;
    expect(drawn, 'a shoal was drawn as a handful').toBeGreaterThan(6);
  });
});
