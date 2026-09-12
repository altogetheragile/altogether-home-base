import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { barrierOf, barrierVerdict, needsHolding, BARRIERS, currentDesign, type ItemDesign } from './design';
import { checkCriterion } from './parkChecks';
import { reviewSprint } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// What holds an animal in, as a decision that can be wrong in two directions.
//
// Before this, "is it bordered safely, with no way out of it?" answered `met: true` always - "a
// habitat is fenced by construction". So the one criterion about safety could not fail, there was
// nothing to get wrong, and Sprint 1 had no mistake in it to reflect on.
//
// Now a barrier HOLDS so much and shows so much, and an animal needs holding so much. Too little and
// it is out; too much and you have walled off the thing people came to see. Two numbers rather than a
// table of every species against every barrier, so a new animal needs one number and not a row.
//
// The default is the lightest thing that WILL hold what lives there, on purpose: an escape has to be
// something somebody chose, not something a default did quietly.

const part = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  started: true, sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

const zoo = (barrier?: string): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1,
  backlog: [
    part({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 400, y: 800 },
      design: { parts: barrier ? { barrier } : {}, colors: { ground: '#c9a86a', fence: '#8a6a3b' },
        flora: [{ x: 0.3, y: 0.4, s: 1, type: 'tree' }], water: [{ x: 0.6, y: 0.5, w: 0.2, h: 0.2 }] } }),
    part({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
      appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 },
      design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } }),
    part({ id: 'paths', name: 'Big Cats Paths', category: 'path' }),
  ],
} as unknown as ZooGameState);

const asked = (s: ZooGameState) =>
  checkCriterion(s, s.backlog[0], 'Is it bordered safely, with no way out of it?')!;

describe('what holds them in', () => {
  it('takes more for a lion than for a penguin', () => {
    expect(needsHolding('lion')).toBeGreaterThan(needsHolding('penguins'));
    // An animal nobody has listed takes an ordinary fence, which is the cheap direction to be wrong.
    expect(needsHolding('wombat')).toBe(2);
  });

  it('is adequate when nobody has chosen, so an escape is somebody’s decision', () => {
    const held = barrierOf({ parts: {}, colors: {} } as ItemDesign, [{ template: 'lion' }]);
    expect(held.holds, 'the default would not hold a lion').toBeGreaterThanOrEqual(needsHolding('lion'));
    expect(asked(zoo()).met, 'a habitat built without a choice failed its own safety criterion').toBe(true);
  });

  it('fails, and says which animal would be over it, when it is too little', () => {
    const v = asked(zoo('hedge'));
    expect(v.met, 'a hedge held a lion').toBe(false);
    expect(v.evidence, 'the reason does not name the animal').toMatch(/Lion/);
    expect(v.evidence, 'the reason does not name what was built').toMatch(/hedge/i);
  });

  it('holds when it is enough, and says what it is', () => {
    const v = asked(zoo('high'));
    expect(v.met).toBe(true);
    expect(v.evidence).toMatch(/4m fence/);
  });

  it('is a fact about the animals that live there, not about the pen', () => {
    // The same hedge that failed round a lion is fine round penguins - so moving a leopard into the
    // penguin pen is a thing the park notices.
    const penguins = {
      ...zoo('hedge'),
      backlog: zoo('hedge').backlog.map((it) => (it.id === 'lion'
        ? { ...it, name: 'Penguins', template: 'penguins' } : it)),
    } as ZooGameState;
    expect(asked(penguins).met, 'a hedge will not do for penguins').toBe(true);
  });
});

describe('the other direction it can be wrong', () => {
  it('costs the visit when the barrier hides them', () => {
    // A wall holds a lion and hides it: contained, safe, and a disappointing day out. Nothing about
    // it is unsafe, so the only place it can be wrong is the day people come.
    const walled = reviewSprint(zoo('wall'));
    const fenced = reviewSprint(zoo('high'));
    expect(walled.lastReview!.overallHappiness,
      'a walled-in lion pleased the visitors as much as one they could see')
      .toBeLessThan(fenced.lastReview!.overallHappiness);
  });

  it('does not punish glass, which holds them and shows them', () => {
    const glass = reviewSprint(zoo('glass'));
    const walled = reviewSprint(zoo('wall'));
    expect(glass.lastReview!.overallHappiness).toBeGreaterThan(walled.lastReview!.overallHappiness);
  });
});

describe('choosing it', () => {
  it('is offered on the habitat, and what is chosen sticks', () => {
    const s = zoo();
    const chosen: ItemDesign[] = [];
    const { container } = render(
      <ParkOptions state={s} item={s.backlog[0]} inside={null}
        api={{ onDesign: (_id, d) => chosen.push(d), onSetEnclosure: () => {}, onAddInside: () => {} }} />,
    );
    for (const b of BARRIERS) {
      expect(container.querySelector(`[data-part="barrier-${b.key}"]`), `no way to choose ${b.label}`).toBeTruthy();
    }
    fireEvent.click(container.querySelector('[data-part="barrier-hedge"]')!);
    expect(barrierOf(chosen[0], []).key, 'choosing a hedge wrote something else').toBe('hedge');
  });

  it('reads back what the habitat already has', () => {
    const s = zoo('wall');
    const { container } = render(
      <ParkOptions state={s} item={s.backlog[0]} inside={null}
        api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {} }} />,
    );
    expect(container.querySelector('[data-part="barrier-wall"]')?.getAttribute('aria-pressed'),
      'the habitat has a wall and the strip does not say so').toBe('true');
  });
});

describe('a tank', () => {
  it('is glass by construction, and is not asked to choose', () => {
    const tank = {
      ...zoo(),
      backlog: zoo().backlog.map((it) => {
        if (it.id === 'enc') return { ...it, name: 'Reef Tank', design: { ...currentDesign(it), parts: { ground: 'water' } } };
        if (it.id === 'lion') return { ...it, name: 'Reef', template: 'reef' };
        return it;
      }),
    } as ZooGameState;
    const v = asked(tank);
    expect(v.met, 'a tank failed to hold its fish').toBe(true);
    expect(v.evidence).toMatch(/Glass/);
  });
});

describe('the verdict itself', () => {
  it('names the animal that would walk, not a number', () => {
    const v = barrierVerdict({ parts: { barrier: 'fence' }, colors: {} } as ItemDesign,
      [{ template: 'penguins', name: 'Penguins' }, { template: 'leopard', name: 'Leopard' }]);
    expect(v.ok).toBe(false);
    expect(v.escapee, 'the wrong animal was blamed').toBe('Leopard');
  });
});

describe('the park draws what was chosen', () => {
  // A choice the drawing ignores is a choice nobody can check - and measured rather than eyeballed,
  // because "it looks about right" is what let a tint that Safari ignored through twice.
  const fenceOf = (barrier: string) => {
    const svg = render(<IsoZoo state={zoo(barrier)} height={520} />).container.querySelector('svg[role="img"]')!;
    // `[data-holds]`, not `[data-part="fence"]`: an invisible band round the habitat answers for the
    // fence to a pointer and carries the same part name, and it comes first in the drawing.
    const runs = [...svg.querySelectorAll('[data-part="fence"][data-holds]')];
    expect(runs.length, `no fence was drawn for ${barrier}`).toBeGreaterThan(0);
    const holds = runs[0].getAttribute('data-holds');
    // How tall it stands: the difference between the foot and the top of its first panel.
    const pts = (runs[0].querySelector('polygon')?.getAttribute('points') ?? '')
      .split(' ').map((q) => Number(q.split(',')[1]));
    return { holds, height: Math.max(...pts) - Math.min(...pts) };
  };

  it('says which barrier it drew', () => {
    expect(fenceOf('wall').holds).toBe('wall');
    expect(fenceOf('hedge').holds).toBe('hedge');
  });

  it('stands a high fence taller than a hedge', () => {
    expect(fenceOf('high').height, 'a 4m fence is drawn no taller than a low hedge')
      .toBeGreaterThan(fenceOf('hedge').height);
  });

  it('draws a wall you cannot see through, and mesh you can', () => {
    const mesh = (barrier: string) => {
      const svg = render(<IsoZoo state={zoo(barrier)} height={520} />).container.querySelector('svg[role="img"]')!;
      return [...svg.querySelectorAll('[data-part="fence"][data-holds]')][0].querySelectorAll('line').length;
    };
    // A wall has its posts and its top rail and nothing between them; a fence has the wires.
    expect(mesh('wall'), 'a wall was drawn with wire mesh in it').toBeLessThan(mesh('fence'));
  });
});
