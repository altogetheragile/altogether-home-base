import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS, TRUE_VELOCITY_PER_DAY } from './config';
import { startOnTheBoard, startItem, sendItemBack, readyToMove, secondsPerPoint, buildCost, buildLeftOf, teamIsBusy, inFlight } from './engine';
import { reducer } from './useZooGame';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// What a day's work costs, and when it has been done.
//
// Reported from playing it twice. First: "it only takes a day to get through the 3 PBIs." Then,
// after the cost was applied to a person's own building as well as to the seats played by the game:
// "I finished everything 15 seconds into the second day."
//
// Both were the same fault wearing different clothes - one question with several answers. The
// question is "when has this work been done, and what did it cost?", and the game had four places
// that could decide an item was built: the studio's own "start building", a plan step ticking itself
// off the park, dropping the thing on the park, and the park's checks noticing the plan was
// finished. Only the first of them charged anything, so a whole Sprint could be built for nothing by
// never pressing it. That is what the trail showed: three items delivered, nothing charged at all.
//
// So the cost is written down at the one moment every route passes through - the Developers taking
// the item ON - and it is kept on the item, as building still to do. It draws down a second per
// second of the day, shared between whatever is in flight, and nothing may be moved to Done until
// its own building is finished. Everything else on a card can be done as fast as somebody's hands.

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const inSprint = (s: ZooGameState): BacklogItem[] => s.backlog.filter((it) => it.status === 'committed');
const of = (s: ZooGameState, id: string): BacklogItem => s.backlog.find((it) => it.id === id)!;
/** Run the clock, the way a day does. */
const tick = (s: ZooGameState, seconds: number): ZooGameState => {
  for (let i = 0; i < seconds; i += 1) s = reducer(s, { type: 'TICK_DAY' });
  return s;
};

describe('taking work on is what costs the Sprint', () => {
  it('writes the cost down whoever took it, and by whatever route', () => {
    const s = sprint();
    const it = inSprint(s)[0];
    const taken = startItem(s, it.id);
    expect(buildLeftOf(of(taken, it.id)), 'work was taken on and the Sprint was charged nothing')
      .toBeCloseTo(buildCost(s, it), 5);
  });

  it('charges the item’s size, at what a point of work costs', () => {
    const s = sprint();
    const it = inSprint(s)[0];
    expect(buildCost(s, it)).toBeCloseTo(secondsPerPoint(s) * (it.estimate ?? 0), 5);
  });

  it('is not charged again for storing a design, however that happens', () => {
    // The old charge sat on BUILD_ITEM, which is only one of the four ways a design gets stored.
    const s = startItem(sprint(), inSprint(sprint())[0].id);
    const it = inFlight(s)[0];
    const built = reducer(s, { type: 'BUILD_ITEM', id: it.id, design: presetFor(it) });
    expect(buildLeftOf(of(built, it.id)), 'building it was charged on top of taking it on')
      .toBeCloseTo(buildLeftOf(it), 5);
  });

  it('costs nothing for work nobody ever took on through the board', () => {
    // Undefined is not nought-owing-with-a-catch: an older save, or a test fixture that put an item
    // straight into Doing, has no debt and is not held back by one.
    const loose = { ...sprint().backlog[0], status: 'committed' as const, started: true, design: presetFor(sprint().backlog[0]) };
    expect(buildLeftOf(loose)).toBe(0);
  });
});

describe('the building takes the time the building takes', () => {
  it('will not let an item be Done while there is building left in it', () => {
    const s = startItem(sprint(), inSprint(sprint())[0].id);
    const it = inFlight(s)[0];
    const built = reducer(s, { type: 'BUILD_ITEM', id: it.id, design: presetFor(it) });
    const ready = {
      ...built,
      backlog: built.backlog.map((x) => (x.id === it.id
        ? { ...x, acConfirmed: (x.acceptance ?? []).map(() => true), tasks: (x.tasks ?? []).map((t) => ({ ...t, done: true })) }
        : x)),
    } as ZooGameState;
    expect(buildLeftOf(of(ready, it.id)), 'this test needs work still to do').toBeGreaterThan(0);
    expect(readyToMove(of(ready, it.id)), 'everything was ticked in seconds and the work was Done')
      .toBe(false);
    const later = tick(ready, Math.ceil(buildLeftOf(of(ready, it.id))));
    expect(readyToMove(of(later, it.id)), 'the time was spent on it and it still could not be Done')
      .toBe(true);
  });

  it('gives a day one second of building per second, shared between what is on the go', () => {
    // Three things in flight all finish late. That is what a work-in-progress limit is for, and it
    // is arithmetic rather than a rule anybody was told.
    const s = sprint();
    // Two that can both be started now: an animal waits for its habitat to be built.
    const a = inSprint(s)[0];
    const b = inSprint(s).filter((it) => it.category !== 'exhibit' && it.id !== a.id)[0];
    const one = tick(startItem(s, a.id), 10);
    expect(buildLeftOf(of(one, a.id)), 'a lone item did not get the whole second')
      .toBeCloseTo(buildCost(s, a) - 10, 5);

    const two = tick(startItem(startItem(s, a.id), b.id), 10);
    expect(buildLeftOf(of(two, a.id)), 'two things on the go and each still ran at full speed')
      .toBeCloseTo(buildCost(s, a) - 5, 5);
    expect(buildLeftOf(of(two, a.id)) + buildLeftOf(of(two, b.id)),
      'the day gave out more building than it had seconds')
      .toBeCloseTo(buildCost(s, a) + buildCost(s, b) - 10, 5);
  });

  it('carries unfinished building into the next day', () => {
    // It used to be a pot of seconds on the state that a day boundary wiped, so work that ran past
    // the end of a day was free after midnight.
    const s = sprint();
    const a = inSprint(s)[0];
    const b = inSprint(s).filter((it) => it.category !== 'exhibit' && it.id !== a.id)[0];
    const both = startItem(startItem(s, a.id), b.id);
    expect(buildCost(s, a) + buildCost(s, b), 'this test needs more work than a day holds')
      .toBeGreaterThan(DAY_SECONDS);
    const next = tick(both, DAY_SECONDS + 1);
    expect(next.dayNumber, 'the day never ended').toBeGreaterThan(1);
    expect(buildLeftOf(of(next, a.id)) + buildLeftOf(of(next, b.id)),
      'a new day forgave what was left of the work').toBeGreaterThan(0);
  });

  it('keeps the team busy while there is building to do', () => {
    const s = sprint();
    expect(teamIsBusy(s), 'the team was busy before anybody started anything').toBe(false);
    expect(teamIsBusy(startItem(s, inSprint(s)[0].id)), 'work was taken on and nobody was working').toBe(true);
  });

  it('gives work sent back its own building to do again', () => {
    const s = startItem(sprint(), inSprint(sprint())[0].id);
    const it = inFlight(s)[0];
    const built = tick(reducer(s, { type: 'BUILD_ITEM', id: it.id, design: presetFor(it) }), 20);
    const spent = buildLeftOf(of(built, it.id));
    const back = sendItemBack(built, it.id);
    expect(buildLeftOf(of(back, it.id)), 'doing the work twice cost the Sprint nothing the second time')
      .toBeGreaterThan(spent);
  });
});

describe('what a point of work costs', () => {
  // It used to be worked out from the team's own first-Sprint capacity guess, which was deliberately
  // an over-guess. So guessing high made every point cheaper in exactly the proportion you had
  // over-guessed: the mistake paid for itself. An opinion about yourself cannot change what the
  // work costs.

  it('is a fact about the work, not the team’s opinion of themselves', () => {
    expect(secondsPerPoint(sprint()), 'a point is priced at something other than what a team can really do')
      .toBeCloseTo(DAY_SECONDS / TRUE_VELOCITY_PER_DAY, 5);
  });

  it('follows the team once they have measured themselves', () => {
    const s = sprint();
    const fast = { ...s, velocity: [30], velocityDays: [s.sprintDays] } as ZooGameState;
    const slow = { ...s, velocity: [8], velocityDays: [s.sprintDays] } as ZooGameState;
    expect(secondsPerPoint(fast), 'a team that got through more still pays the same for a point')
      .toBeLessThan(secondsPerPoint(s));
    expect(secondsPerPoint(slow), 'a team that got through less is not given longer for a point')
      .toBeGreaterThan(secondsPerPoint(s));
  });
});

describe('a Sprint takes a Sprint', () => {
  it('is a Sprint of work that the board hands you on day one', () => {
    const s = sprint();
    const owed = inSprint(s).reduce((n, it) => n + buildCost(s, it), 0);
    const aSprint = DAY_SECONDS * s.sprintDays;
    expect(owed, 'the first Sprint is not a Sprint of work').toBeGreaterThan(aSprint * 0.75);
    // ...and it still fits in the days the team actually gets, with the Daily Scrum held every day.
    expect(owed, 'holding the Daily Scrum every day would cost them the last item')
      .toBeLessThan(DAY_SECONDS + Math.round(DAY_SECONDS * 0.9) * (s.sprintDays - 1));
  });

  it('cannot be got through in a day, however fast anybody is', () => {
    // The report, end to end: "I finished everything 15 seconds into the second day." Played by
    // somebody who never dithers - take on everything the limit allows the moment it is allowed,
    // build it, tick it, accept it, move what will move - and then run the whole of Day 1 off.
    let s = sprint();
    // Everything the limit allows, taken on, built, ticked and accepted, as fast as it can be done.
    for (const it of s.backlog.filter((x) => x.status === 'committed')) {
      s = reducer(s, { type: 'START_ITEM', id: it.id });
      const now = of(s, it.id);
      if (now.started && !now.design) s = reducer(s, { type: 'BUILD_ITEM', id: it.id, design: presetFor(now) });
      (of(s, it.id).acceptance ?? []).forEach((ix) => { s = reducer(s, { type: 'CONFIRM_AC', id: it.id, index: Number(ix), value: true }); });
      for (const t of of(s, it.id).tasks ?? []) if (!t.done) s = reducer(s, { type: 'TOGGLE_TASK', id: it.id, taskId: t.id });
    }
    // ...and then the whole of Day 1 run off, moving anything the moment it will move.
    for (let i = 0; i < DAY_SECONDS + 10 && s.dayStage === 'building'; i += 1) {
      for (const it of s.backlog.filter((x) => x.status === 'committed' && readyToMove(x))) {
        s = reducer(s, { type: 'FINISH_ITEM', id: it.id });
      }
      s = reducer(s, { type: 'TICK_DAY' });
    }
    expect(s.dayStage !== 'building' || s.dayNumber > 1, 'Day 1 never ran out').toBe(true);
    const left = s.backlog.filter((it) => it.sprintNumber === 1).reduce((n, it) => n + buildLeftOf(it), 0);
    expect(left, 'the whole Sprint was built inside Day 1').toBeGreaterThan(0);
    // ...and a day's worth of it did get built: holding work back is not the same as stopping it.
    const spent = inSprint(sprint()).reduce((n, it) => n + buildCost(sprint(), it), 0) - left;
    expect(spent, 'a whole day ran and almost none of the building got done')
      .toBeGreaterThan(DAY_SECONDS * 0.9);
  });
});
