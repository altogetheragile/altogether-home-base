import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SprintRetro } from './SprintRetro';
import { initialZooState, DAY_SECONDS } from './config';
import { startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import { tallyWork, costBySize, sizesThatAgree, aimedAt } from './whatItCost';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem, ZooAction } from './types';

// What the work actually cost, kept for the Retrospective to inspect.
//
// Asked while playing it: "we're recording what is pressed - can this be used as data for sizing
// on-going together with time taken to complete a PBI?" Measured, yes. Fed back into the sizes, no:
// an estimate derived from the time it took makes velocity a tautology - you delivered twenty points
// because the points were defined by what you delivered, and a forecast can no longer be wrong. So
// the game measures and the Scrum Team decides, which is inspect and adapt with the halves the right
// way round.

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const of = (s: ZooGameState, id: string): BacklogItem => s.backlog.find((it) => it.id === id)!;
const tick = (s: ZooGameState, n: number): ZooGameState => {
  for (let i = 0; i < n; i += 1) s = reducer(s, { type: 'TICK_DAY' });
  return s;
};

describe('watching what the work costs', () => {
  it('ages an item while it is in Doing, and stops when it is not', () => {
    const s = sprint();
    const it0 = of(s, sprint().backlog.find((x) => x.status === 'committed')!.id);
    const going = tick(reducer(s, { type: 'START_ITEM', id: it0.id }), 5);
    expect(of(going, it0.id).cost?.seconds, 'work sat in Doing for five seconds and aged not at all').toBe(5);

    const parked = tick({ ...going, backlog: going.backlog.map((x) => (x.id === it0.id
      ? { ...x, status: 'done' as const } : x)) } as ZooGameState, 5);
    expect(of(parked, it0.id).cost?.seconds, 'it went to Done and carried on ageing').toBe(5);
  });

  it('ages everything that is on the go, because that is what work in progress does', () => {
    // Not effort shared out between them: if three things are open, all three are getting older,
    // which is the whole argument for a work-in-progress limit.
    let s = sprint();
    const two = s.backlog.filter((x) => x.status === 'committed' && x.category !== 'exhibit').slice(0, 2);
    for (const it of two) s = reducer(s, { type: 'START_ITEM', id: it.id });
    s = tick(s, 4);
    for (const it of two) expect(of(s, it.id).cost?.seconds, `${it.name} was not ageing`).toBe(4);
  });

  it('counts a press against the item it was aimed at, however the action names it', () => {
    let s = sprint();
    const it0 = s.backlog.find((x) => x.status === 'committed' && x.category === 'enclosure')!;
    s = reducer(s, { type: 'START_ITEM', id: it0.id });
    s = reducer(s, { type: 'BUILD_ITEM', id: it0.id, design: presetFor(it0) });
    s = reducer(s, { type: 'ADD_INSIDE', id: it0.id, kind: 'water' });
    expect(of(s, it0.id).cost?.presses, 'nobody was recorded as having done anything').toBeGreaterThan(1);
    // Three ways an action names its item, and one place that knows all three.
    expect(aimedAt({ type: 'ADD_INSIDE', id: 'lion-enc', kind: 'water' } as ZooAction)).toBe('lion-enc');
    expect(aimedAt({ type: 'ANSWER_QUESTION', id: 'check-lion-enc', choice: 'accept' } as ZooAction)).toBe('lion-enc');
    expect(aimedAt({ type: 'ADD_CONNECTOR', connector: { itemId: 'lion-enc' } } as unknown as ZooAction)).toBe('lion-enc');
  });

  it('does not count the clock, or taking work on, as somebody doing something to it', () => {
    let s = sprint();
    const it0 = s.backlog.find((x) => x.status === 'committed')!;
    s = tick(reducer(s, { type: 'START_ITEM', id: it0.id }), 3);
    expect(of(s, it0.id).cost?.presses, 'the clock was recorded as work').toBe(0);
  });

  it('counts nothing in learn mode, where the clock is off and nobody is being measured', () => {
    const s = { ...sprint(), learnMode: true } as ZooGameState;
    const it0 = s.backlog.find((x) => x.status === 'committed')!;
    const after = tallyWork(s, s, { type: 'ADD_INSIDE', id: it0.id, kind: 'water' } as ZooAction);
    expect(of(after, it0.id).cost, 'learn mode started a stopwatch nobody asked for').toBeUndefined();
  });
});

describe('what each size cost', () => {
  /** A Sprint's worth of finished work, with the costs the game watched. */
  const finished = (costs: [number, number][]): ZooGameState => {
    const s = sprint();
    const items = s.backlog.filter((it) => it.status === 'committed').slice(0, costs.length);
    return { ...s, backlog: s.backlog.map((it) => {
      const i = items.findIndex((x) => x.id === it.id);
      return i < 0 ? it : { ...it, status: 'done' as const, estimate: costs[i][0],
        cost: { seconds: costs[i][1], presses: costs[i][1] } };
    }) } as ZooGameState;
  };

  it('groups by the size the team gave it, and takes the middle one', () => {
    const rows = costBySize(finished([[2, 30], [2, 90], [2, 60], [8, 240]]));
    expect(rows.map((r) => r.points), 'the sizes came out in some other order').toEqual([2, 8]);
    expect(rows[0].items).toBe(3);
    expect(rows[0].seconds, 'one slow item dragged the whole size about').toBe(60);
  });

  it('says nothing about work nobody finished, or work with no size', () => {
    const s = sprint();
    expect(costBySize(s), 'a Sprint nobody has finished anything in had something to report').toEqual([]);
  });

  it('finds two sizes that are not two sizes', () => {
    // The finding worth putting in front of a team. An 8 that costs what a 2 costs is not an 8.
    const same = sizesThatAgree(finished([[2, 60], [2, 70], [8, 80], [8, 70]]));
    expect(same, 'an 8 cost what a 2 cost and nobody said anything').toBeTruthy();
    expect(same![0].points).toBe(2);
    expect(same![1].points).toBe(8);

    const honest = sizesThatAgree(finished([[2, 40], [2, 50], [8, 200], [8, 220]]));
    expect(honest, 'sizes that hold up were reported as a problem').toBeNull();
  });

  it('needs more than one of a size before it says anything about it', () => {
    expect(sizesThatAgree(finished([[2, 60], [8, 70]])), 'one item of each is an anecdote').toBeNull();
  });
});

describe('the Retrospective panel', () => {
  const retro = (s: ZooGameState) => render(
    <SprintRetro state={{ ...s, phase: 'retro' } as ZooGameState} onNextSprint={() => {}}
      onSetDod={() => {}} onSetSprintDays={() => {}} />,
  ).container;

  const withCosts = (costs: [number, number][]): ZooGameState => {
    const s = sprint();
    const items = s.backlog.filter((it) => it.status === 'committed').slice(0, costs.length);
    return { ...s, daySecondsLeft: DAY_SECONDS, backlog: s.backlog.map((it) => {
      const i = items.findIndex((x) => x.id === it.id);
      return i < 0 ? it : { ...it, status: 'open' as const, estimate: costs[i][0],
        cost: { seconds: costs[i][1], presses: 20 } };
    }) } as ZooGameState;
  };

  it('shows what each size cost, in the units a person reads', () => {
    const c = retro(withCosts([[2, 65], [2, 55], [8, 245], [8, 235]]));
    const panel = c.querySelector('[data-part="what-sizes-cost"]')!;
    expect(panel, 'the team has finished work of two sizes and is shown neither').toBeTruthy();
    expect(panel.querySelector('[data-part="size-2"]')!.textContent).toMatch(/1m 00s/);
    expect(panel.querySelector('[data-part="size-8"]')!.textContent).toMatch(/4m 00s/);
  });

  it('says when two sizes are not two sizes, and leaves it there', () => {
    const c = retro(withCosts([[2, 60], [2, 70], [8, 80], [8, 70]]));
    const said = c.querySelector('[data-part="sizes-agree"]')!;
    expect(said, 'an 8 cost what a 2 cost and the Retrospective said nothing').toBeTruthy();
    // Inspection, not adaptation: the game must not offer to fix it.
    expect(said.textContent, 'the game offered to re-size the Product Backlog itself')
      .toMatch(/yours to decide/i);
  });

  it('says nothing at all until there is something to say', () => {
    expect(retro(sprint()).querySelector('[data-part="what-sizes-cost"]'),
      'a first Sprint that finished nothing was shown a table of nothing').toBeNull();
  });
});
