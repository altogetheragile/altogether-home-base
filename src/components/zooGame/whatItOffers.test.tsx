import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { checkCriterion, answerable } from './parkChecks';
import { setServices } from './engine';
import { initialZooState, DEFAULT_SERVICE_CAPACITY } from './config';
import { simulateSprint } from './simulation/simulate';
import { DEFAULT_CONFIG } from './simulation/config';
import type { ZooGameState, BacklogItem } from './types';

// What a building is FOR.
//
// The zoo counts three things a visitor needs: somewhere to eat, a toilet, somewhere to sit. The
// simulation has read that field since it was written and nothing in the game ever set it - so a
// facility could be designed, built, opened and meet nobody's need, and the criterion asking
// whether you could get what you came for had nothing behind it to look at. It was left to
// judgement because there was no other honest place to put it.
//
// Reported from playing it: "how is this a criteria? How do we fulfil this? Should we select the
// stock for the kiosk and giftshop, etc?" One choice rather than a stock list: this is a game about
// Scrum, and what the choice buys is a consequence you read at the next Review.

const shop = (over: Partial<BacklogItem> = {}): BacklogItem => ({
  id: 'kiosk', name: 'Kiosk', zone: 'Big Cats', category: 'amenity',
  status: 'committed', started: true, sprintNumber: 1, estimate: 3,
  acceptance: ['Can I tell what it is from outside?', 'Can I buy food and a drink here?', 'Can I walk to it from the way in?'],
  acConfirmed: [], tasks: [], accessible: true, pos: { x: 500, y: 800 },
  design: { parts: { type: 'kiosk' }, colors: { walls: '#e6ddd0', door: '#7a5230' } },
  ...over,
} as BacklogItem);

const park = (item: BacklogItem): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1, backlog: [item],
} as ZooGameState);

describe('the question a building can now answer', () => {
  it('is one the park settles, not one somebody guesses at', () => {
    expect(answerable('Can I buy food and a drink here?'), 'still nothing but an opinion').toBe(true);
    expect(answerable('Can I find a free cubicle at a busy time?')).toBe(true);
    expect(answerable('Can I sit down in the shade?')).toBe(true);
  });

  it('says no, and names the control, when it offers nothing', () => {
    const it0 = shop();
    const v = checkCriterion(park(it0), it0, 'Can I buy food and a drink here?')!;
    expect(v.met).toBe(false);
    expect(v.evidence, 'it does not say what would fix it').toMatch(/Offers/);
  });

  it('says yes once it offers the thing it was asked for, and how many it serves', () => {
    const it0 = setServices(park(shop()), 'kiosk', 'food').backlog[0];
    const v = checkCriterion(park(it0), it0, 'Can I buy food and a drink here?')!;
    expect(v.met).toBe(true);
    expect(v.evidence).toMatch(new RegExp(`${DEFAULT_SERVICE_CAPACITY} visitors`));
  });

  it('is not fooled by offering something else', () => {
    // A kiosk with toilets in it is not a kiosk.
    const it0 = setServices(park(shop()), 'kiosk', 'toilet').backlog[0];
    const v = checkCriterion(park(it0), it0, 'Can I buy food and a drink here?')!;
    expect(v.met).toBe(false);
    expect(v.evidence).toMatch(/not what this asks for/i);
  });
});

describe('choosing it', () => {
  const strip = (state: ZooGameState, item: BacklogItem, onSetServices = () => {}) => render(
    <ParkOptions state={state} item={item} inside={null}
      api={{ onDesign: () => {}, onSetEnclosure: () => {}, onSetServices } as never} />,
  );

  it('is offered on a building, and says when it offers nothing', () => {
    const { container } = strip(park(shop()), shop());
    expect(container.textContent, 'a building cannot be told what it is for').toMatch(/Offers/);
    expect(container.textContent).toMatch(/nothing visitors need, yet/i);
  });

  it('sets it, and lets you take it back off', () => {
    const calls: unknown[][] = [];
    strip(park(shop()), shop(), (...a: unknown[]) => calls.push(a));
    fireEvent.click(screen.getAllByRole('button', { name: 'Food and drink' })[0]);
    expect(calls[0]).toEqual(['kiosk', 'food']);
    // ...and pressing the one it already offers turns it off, rather than being a one-way door.
    const chosen = shop({ services: 'food' });
    const again: unknown[][] = [];
    const second = strip(park(chosen), chosen, (...a: unknown[]) => again.push(a));
    // Its own container: the first strip is still mounted, and `screen` sees both.
    fireEvent.click([...second.container.querySelectorAll('button')]
      .find((b) => b.textContent === 'Food and drink')!);
    expect(again[0]).toEqual(['kiosk', null]);
  });

  it('is not offered on a habitat', () => {
    const pen = { ...shop(), id: 'enc', category: 'enclosure' } as BacklogItem;
    const { container } = strip(park(pen), pen);
    expect(container.textContent, 'a lion enclosure is being asked what it sells').not.toMatch(/Offers/);
  });
});

describe('what it buys', () => {
  it('feeds the people who came, which is the point of choosing it', () => {
    // The consequence is in the simulation, not in the criterion: an outlet that offers food takes
    // the unmet-food rate down, which is what the visitors were complaining about.
    const base = {
      id: 'k', name: 'Kiosk', category: 'amenity' as const, accessible: true,
      serviceCapacity: DEFAULT_SERVICE_CAPACITY,
    };
    const lion = { id: 'l', name: 'Lion', category: 'exhibit' as const, accessible: true,
      appeal: { families: 8, enthusiasts: 8, comfortSeekers: 6 }, capacity: 900 };
    const run = (offers?: 'food') => simulateSprint(
      { items: [lion, { ...base, services: offers }] } as never, DEFAULT_CONFIG,
      { families: 400, enthusiasts: 200, comfortSeekers: 150 }, 7);
    const without = run();
    const with_ = run('food');
    const hungry = (r: ReturnType<typeof run>) => r.segments.reduce((n, s) => n + s.unmetNeedRate.food, 0);
    expect(hungry(with_), 'offering food changed nothing for anybody').toBeLessThan(hungry(without));
  });
});
