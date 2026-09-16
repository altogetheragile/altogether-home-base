import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChooseSolutionPanel } from './Board';
import { noOnePieceMeets } from './toolboxItems';
import { notReady, chooseSolution } from './engine';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// Refinement breaks a composite item into fine-grained ones that are ready for a Sprint.
//
// Which raises the question the game could not previously answer: which items are composite? It
// took the Product Owner's word for it - an epic was an epic because it was written as one - and a
// need could be written that no choice would ever satisfy.
//
// The catalogue answers it. If one thing in it can settle everything an item asks, that item is one
// piece of work. If nothing can, the item is asking for more than one thing, and no decision the
// Developers make will change that: "somewhere to see lions in a suitable enclosure" asks about a
// habitat AND about the animals in it, and no single piece is both.

const HABITAT_AND_ANIMAL = [
  'Is it bordered safely, with no way out of it?',   // the habitat
  'Can I see a group rather than one animal on its own?', // the animals
  'Can I walk to it from the way in?',
];
const ONE_BUILDING = ['Can I tell what it is from outside?', 'Can I buy food and a drink here?', 'Can I walk to it from the way in?'];

const asNeed = (acceptance: string[]): BacklogItem => ({
  id: 'n', name: 'A need', category: 'need', zone: 'Facilities', estimate: 0, unsized: true,
  acceptance, acConfirmed: [], tasks: [], status: 'backlog', sprintNumber: null, accessible: true,
} as BacklogItem);

describe('telling a composite item from a fine-grained one', () => {
  it('sees that a habitat and its animals are two things', () => {
    expect(noOnePieceMeets(HABITAT_AND_ANIMAL)).toEqual(['held', 'a-group', 'walkable-to']);
  });

  it('sees that a building is one thing', () => {
    expect(noOnePieceMeets(ONE_BUILDING), 'somewhere to eat was called composite').toEqual([]);
  });

  it('does not call an item composite for the criteria only a person can answer', () => {
    // Nothing in a catalogue meets "can I walk right round it?", because a person answers it.
    // Counting those would make every item in the zoo composite.
    expect(noOnePieceMeets(['Can I walk right round it?', 'Can I tell what it is from outside?'])).toEqual([]);
  });

  it('says nothing about an item with one thing to settle, or none', () => {
    expect(noOnePieceMeets(['Can I walk to it from the way in?'])).toEqual([]);
    expect(noOnePieceMeets([])).toEqual([]);
  });
});

describe('what the game does about it', () => {
  const s = initialZooState(1) as ZooGameState;

  it('tells a composite need to be split, not chosen', () => {
    const why = notReady(asNeed(HABITAT_AND_ANIMAL), s);
    expect(why, 'a need asking for two things was ready to forecast').toBeTruthy();
    expect(why, 'it is sent to the Developers to choose, which no choice could settle')
      .toMatch(/more than one thing - split it/i);
  });

  it('still sends a fine-grained one to the Developers to decide', () => {
    expect(notReady(asNeed(ONE_BUILDING), s)).toMatch(/decided what will meet this/i);
  });

  it('offers no choice for a composite one, and says why', () => {
    const { container } = render(<ChooseSolutionPanel item={asNeed(HABITAT_AND_ANIMAL)} onChoose={() => {}} />);
    expect(container.querySelector('[data-part="too-big-to-choose"]'),
      'it offered a list of things, none of which could do the job').toBeTruthy();
    expect(container.querySelectorAll('[data-part="choose-solution"]').length).toBe(0);
    expect(container.textContent).toMatch(/asking for more than one thing/i);
    expect(container.textContent, 'it does not say what to do instead').toMatch(/Refinement breaks an item like this/i);
  });

  it('offers the choice for a fine-grained one', () => {
    const { container } = render(<ChooseSolutionPanel item={asNeed(ONE_BUILDING)} onChoose={() => {}} />);
    expect(container.querySelector('[data-part="too-big-to-choose"]')).toBeNull();
    expect(container.querySelectorAll('[data-part="choose-solution"]').length).toBeGreaterThan(0);
  });

  it('leaves the seeded need choosable, which is the whole point of seeding it', () => {
    const need = s.backlog.find((it) => it.category === 'need')!;
    expect(noOnePieceMeets(need.acceptance ?? [])).toEqual([]);
    const after = chooseSolution(s, need.id, 'Kiosk');
    expect(after.backlog.find((it) => it.id === need.id)!.category).toBe('amenity');
  });
});
