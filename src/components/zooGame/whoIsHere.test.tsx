import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { ParkView } from './ParkView';
import { initialZooState } from './config';
import { crowdNow, carsNow, coachesNow, startOnTheBoard } from './engine';
import { presetFor } from './design';
import type { ZooGameState } from './types';

// How many people are here, asked once.
//
// `state.attendance` is the AUDIENCE - how many people there are to be had - and it is a number
// about the world rather than about the zoo. Reading it as a crowd meant a zoo with nothing open at
// all drew four hundred and eighty people strolling round an empty field, having arrived, somehow,
// in an empty car park: the lot was counted from what is open and the people were not.
//
// Reported from playing it: "there are no cars in the car park either."

const empty = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const open = (): ZooGameState => {
  const s = empty();
  return { ...s, backlog: s.backlog.map((it) => (it.sprintNumber === 1
    ? { ...it, status: 'open' as const, started: true, design: presetFor(it) } : it)) } as ZooGameState;
};

describe('who is in the park', () => {
  it('is nobody, when there is nothing to come and see', () => {
    const s = empty();
    expect((Object.values(s.attendance) as number[]).reduce((a, b) => a + b, 0),
      'this test needs an audience to not turn up').toBeGreaterThan(0);
    expect(crowdNow(s), 'a zoo with nothing open at all was full of people').toBe(0);
    expect(carsNow(s), 'they parked and then did not come in').toBe(0);
  });

  it('is nobody for a car park and a gift shop either', () => {
    // An animal is what a zoo is for. Amenities are why you stay, not why you set off.
    const s = empty();
    const shop = s.backlog.find((it) => it.category === 'amenity')!;
    const shopOnly = { ...s, backlog: s.backlog.map((it) => (it.id === shop.id
      ? { ...it, status: 'open' as const } : it)) } as ZooGameState;
    expect(crowdNow(shopOnly), 'they came for the toilets').toBe(0);
  });

  it('fills up as the zoo does', () => {
    expect(crowdNow(open()), 'an open zone drew nobody at all').toBeGreaterThan(0);
    expect(crowdNow(open()), 'one open area drew every last person who might ever come')
      .toBeLessThan((Object.values(empty().attendance) as number[]).reduce((a, b) => a + b, 0));
  });

  it('brings them in something, so the lot is not empty while the park is not', () => {
    const s = open();
    expect(carsNow(s), 'a park full of people and a car park with nothing in it').toBeGreaterThan(0);
    expect(coachesNow(s) >= 0).toBe(true);
    // ...and a park nobody is in has nothing parked outside it.
    expect(carsNow(empty())).toBe(0);
  });

  it('is the same number in both drawings', () => {
    // The Increment fills its car park from it and the plan scatters its little visitors from it.
    // The two used to count the crowd differently, so one could show a park full of people while
    // the other showed an empty lot.
    const iso = render(<IsoZoo state={empty()} height={420} width={800} />).container;
    const plan = render(<ParkView state={empty()} large focus increment />).container;
    expect(iso.querySelectorAll('animateMotion[keyPoints]').length,
      'the Increment has people in an empty zoo').toBe(0);
    expect(plan.querySelectorAll('.zoo-visitor').length,
      'the plan has people in an empty zoo').toBe(0);

    const busy = render(<IsoZoo state={open()} height={420} width={800} />).container;
    expect(busy.querySelectorAll('animateMotion[keyPoints]').length,
      'the zoo opened and nobody came').toBeGreaterThan(0);
  });
});
