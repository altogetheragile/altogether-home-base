import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeChooser } from './ShapeChooser';
import { CardDialog } from './CardDialog';
import { TaskEditor } from './Board';
import { initialZooState } from './config';
import { whatIsLeft, looseAnimal } from './engine';
import type { BacklogItem, ZooGameState } from './types';

// From the scrum-master playtest sm8: about 45 steps nudging a lion round the park. At Planning it
// pressed "Lion Enclosure" to make sure it was chosen, which took the Lion back out of it; in the
// Sprint the Lion then stood loose as a building site and the card said only "build it on the park".

const lion = (over: Partial<BacklogItem> = {}): BacklogItem => ({
  id: 'lion', name: 'Lion', category: 'exhibit', zone: 'Big Cats', status: 'committed', started: true,
  sprintNumber: 2, estimate: 2, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as unknown as BacklogItem);

/** A park with the Lion Enclosure (and a Tiger one) open, and the Lion in Doing. */
const park = (l: BacklogItem): ZooGameState => {
  const base = initialZooState(1);
  return { ...base, phase: 'sprint', sprintNumber: 2, backlog: [
    ...base.backlog.filter((it) => it.id !== 'lion' && it.id !== 'lion-enc'),
    { id: 'tiger-enc', name: 'Tiger Enclosure', category: 'enclosure', zone: 'Big Cats', status: 'open', estimate: 8, acceptance: [] } as unknown as BacklogItem,
    { id: 'lion-enc', name: 'Lion Enclosure', category: 'enclosure', zone: 'Big Cats', status: 'open', estimate: 8, acceptance: [] } as unknown as BacklogItem,
    l,
  ] } as ZooGameState;
};

describe('choosing the habitat at Planning', () => {
  const habitats = [{ id: 'tiger-enc', name: 'Tiger Enclosure' }, { id: 'lion-enc', name: 'Lion Enclosure' }];

  it('says which is chosen, and pressing it again keeps it chosen', () => {
    const picks: (string | undefined)[] = [];
    render(<ShapeChooser item={lion({ enclosureId: 'lion-enc' })} enclosures={habitats} onPlan={(p) => picks.push(p.enclosureId)} />);
    const chosen = screen.getByRole('button', { name: /Lion Enclosure/ });
    expect(chosen).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chosen);
    expect(picks, 'pressing the chosen habitat took the animal out of it').toEqual(['lion-enc']);
  });

  it('lists the animal\'s own habitat first', () => {
    render(<ShapeChooser item={lion()} enclosures={habitats} onPlan={() => {}} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Lion Enclosure', 'Tiger Enclosure']);
  });
});

describe('an animal standing loose in the Sprint', () => {
  it('is told where it lives, not "build it on the park"', () => {
    const s = park(lion());
    expect(looseAnimal(s, lion())?.home?.id).toBe('lion-enc');
    expect(whatIsLeft(s, lion())).toBe('Next: put the Lion in its habitat - drag it onto the Lion Enclosure, or press "Put it in the Lion Enclosure"');
  });

  it('housed, it is not loose', () => {
    const housed = lion({ enclosureId: 'lion-enc' });
    expect(looseAnimal(park(housed), housed)).toBeNull();
  });

  it('can be put in with one press from its card', () => {
    const s = park(lion());
    const put: [string, string][] = [];
    render(<CardDialog state={s} item={lion()} onClose={() => {}} onStart={() => {}} onBuilding={() => {}}
      onPutIn={(id, into) => put.push([id, into])} />);
    fireEvent.click(screen.getByRole('button', { name: 'Put it in the Lion Enclosure' }));
    expect(put).toEqual([['lion', 'lion-enc']]);
  });
});

describe('the sign-off step', () => {
  it('says it is the Definition of Done\'s, not a step the Developers chose', () => {
    render(<TaskEditor item={lion({ tasks: [{ id: 'a', label: 'Choose the coat', done: false }, { id: 'b', label: "Get the PO's sign-off", done: false }] })} onSetTasks={() => {}} />);
    expect(screen.getAllByText('this game\u2019s rule, from your Definition of Done')).toHaveLength(1);
  });
});
