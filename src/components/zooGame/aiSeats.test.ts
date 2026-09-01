import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, isReady, suggestTasks, secondsPerPoint, sprintCapacity, dayCanAfford, enclosureReady } from './engine';
import { aiTurn } from './aiSeats';

// AI seats exist so one person can see a whole Scrum Team work. These check that each seat
// only does its own job, that it says why, and - the one that would really bite - that a
// seat cannot get into a loop with itself.

// A Backlog with unsized pieces in it, which is what a split leaves behind and what the
// Developers are for. The bare initial state has no Backlog at all - it is written by the
// wizard - so a fixture without one gives the Developers nothing to do.
const withWork = (seed = 1): ZooGameState =>
  splitEpic(initialZooState(seed), 'bigcats', ['tiger', 'leopard', 'kiosk']);
const at = (over: Partial<ZooGameState>, seed = 1): ZooGameState => ({ ...withWork(seed), ...over });

describe('a seat nobody is sitting in', () => {
  it('has the Developers size the work, and say the number', () => {
    const s = at({ phase: 'refine' });
    const move = aiTurn(s, 'developer');
    expect(move, 'the Developers had nothing to size').not.toBeNull();
    expect(move!.action.type).toBe('ESTIMATE_ITEM');
    expect(move!.says, 'the seat applied a number without saying it').toMatch(/sized .* at \d+/);
  });

  it('does not let the Product Owner size the work', () => {
    // The gate would refuse it anyway, but a seat that keeps trying something it may not do
    // would sit there proposing refused moves forever.
    const s = at({ phase: 'refine' });
    expect(aiTurn(s, 'product_owner'), 'the Product Owner tried to size the work').toBeNull();
  });

  it('has the Scrum Master hold the Daily Scrum rather than skip it', () => {
    const s = at({ phase: 'sprint', dayStage: 'dailyScrum' });
    const move = aiTurn(s, 'scrum_master')!;
    expect(move.action.type).toBe('RUN_DAILY_SCRUM');
    expect(move.says).toMatch(/Daily Scrum/);
    // and it is not their job to size or to pull
    expect(aiTurn(at({ phase: 'refine' }), 'scrum_master')).toBeNull();
  });

  it('has the Product Owner take the visitors’ feedback onto the Backlog', () => {
    const s = at({ phase: 'review', signals: [{ suggestion: 'Somewhere to eat', drivenBy: 'food', estimatedValue: 'high' }] });
    const move = aiTurn(s, 'product_owner')!;
    expect(move.action.type).toBe('ACCEPT_SIGNAL');
    expect(move.says).toMatch(/Somewhere to eat/);
    // ...and nobody else may decide what goes on the Backlog
    expect(aiTurn(s, 'developer')).toBeNull();
    expect(aiTurn(s, 'scrum_master')).toBeNull();
  });

  it('will not let one person decree the Sprint Goal', () => {
    // "A PO can propose a Sprint Goal, but the Scrum Team must all agree." The Guide: the
    // Product Owner proposes how the product could increase in value, and the whole Scrum
    // Team then collaborates to define the Goal. So a typed sentence is a proposal.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    expect(s.sprintGoalAgreed, 'writing it counted as agreeing to it').toHaveLength(0);

    for (const seat of ['developer', 'scrum_master', 'product_owner'] as const) {
      const move = aiTurn(s, seat);
      expect(move, `the ${seat} never said whether they agreed`).not.toBeNull();
      expect(move!.action.type).toBe('AGREE_SPRINT_GOAL');
      s = reducer(s, move!.action);
    }
    expect(s.sprintGoalAgreed.sort()).toEqual(['developer', 'product_owner', 'scrum_master']);
  });

  it('clears the agreement when the wording changes', () => {
    // The agreement was to the words that were there. Carrying it silently across a rewrite
    // is how a Sprint Goal becomes one person's sentence with everybody's name on it.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'developer' });
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'scrum_master' });
    expect(s.sprintGoalAgreed).toHaveLength(2);

    s = reducer(s, { type: 'SET_SPRINT_GOAL', goal: 'Something else entirely' });
    expect(s.sprintGoalAgreed, 'agreement survived a rewrite').toHaveLength(0);

    // ...but tidying the same sentence is not a new Goal
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'developer' });
    s = reducer(s, { type: 'SET_SPRINT_GOAL', goal: '  Something else entirely  ' });
    expect(s.sprintGoalAgreed, 'trimming whitespace threw the agreement away').toHaveLength(1);
  });

  it('gets a lone Product Owner through Sprint Planning', () => {
    // The reported deadlock. Sitting as Product Owner, topic three needs steps, SET_TASKS is
    // the Developers' and correctly refused - so with nobody in those seats the game sat on
    // "5 items have no steps yet" forever and Start Sprint stayed disabled.
    //
    // Played as the event now runs: the Product Owner agrees their own Goal, and the seats work
    // through the topics in order rather than doing all three at once. Both accountabilities take
    // turns here, because it is the Scrum Master who moves the agenda on.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    const moves: string[] = [];
    for (let i = 0; i < 200; i += 1) {
      const move = aiTurn(s, 'developer') ?? aiTurn(s, 'scrum_master');
      if (!move) break;
      moves.push(move.action.type);
      s = reducer(s, move.action);
    }
    expect(moves, 'the Developers never selected anything').toContain('SET_FORECAST');
    expect(moves, 'the Developers never planned the steps').toContain('SET_TASKS');
    expect(s.forecast.length, 'nothing was forecast').toBeGreaterThan(0);
    const unplanned = s.backlog.filter((it) => s.forecast.includes(it.id) && !(it.tasks ?? []).some((t) => t.label.trim()));
    expect(unplanned, 'items were left without steps, so Start Sprint stays disabled').toHaveLength(0);
  });

  /** Sizing is refinement and belongs to no topic, so it happens whenever there is something
   *  unsized. These tests are about the three topics, so settle it first and out of the way. */
  const sized = (s0: ZooGameState): ZooGameState => {
    let s = s0;
    for (let i = 0; i < 50; i += 1) {
      const m = aiTurn(s, 'developer');
      if (m?.action.type !== 'ESTIMATE_ITEM') return s;
      s = reducer(s, m.action);
    }
    throw new Error('the Developers never finished sizing');
  };

  it('does topic two\u2019s work at topic two, and not before', () => {
    // Reported from a game: the rail said the Developers had chosen the work and written the
    // steps for it while the screen was still on topic one, asking the Product Owner to agree
    // the Sprint Goal - and the panel beside it said nothing was forecast yet. They had selected
    // against a Goal that had only been proposed.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    expect(s.planningTopic ?? 'why', 'this test needs to start at topic one').toBe('why');

    // The Developers agree, and then stop, because agreeing is what topic one is for. Sizing is
    // refinement and belongs to no topic, so it is settled first and out of the way.
    const first = aiTurn(s, 'developer');
    expect(first?.action.type).toBe('AGREE_SPRINT_GOAL');
    s = sized(reducer(s, first!.action));
    expect(aiTurn(s, 'developer'), 'they selected the work while the Goal was still only proposed').toBeNull();

    // ...and they stay stopped once the Scrum Master agrees, because the Product Owner has not.
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'scrum_master' });
    expect(aiTurn(s, 'developer'), 'two out of three agreeing was treated as the team agreeing').toBeNull();

    // The Product Owner agrees. Now the Scrum Master moves the event on, and only then do they
    // select - which is the order the three topics are in.
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    expect(aiTurn(s, 'developer'), 'they selected before the team had moved off topic one').toBeNull();
    const moveOn = aiTurn(s, 'scrum_master');
    expect(moveOn?.action).toEqual({ type: 'SET_PLANNING_TOPIC', topic: 'what' });
    s = reducer(s, moveOn!.action);

    const select = aiTurn(s, 'developer');
    expect(select?.action.type, 'nobody selected anything at topic two').toBe('SET_FORECAST');
    s = reducer(s, select!.action);
    // Still nothing written about how: that is topic three, and the team is not there yet.
    expect(aiTurn(s, 'developer'), 'the steps were written while the team was still choosing the work').toBeNull();

    const onToHow = aiTurn(s, 'scrum_master');
    expect(onToHow?.action).toEqual({ type: 'SET_PLANNING_TOPIC', topic: 'how' });
    s = reducer(s, onToHow!.action);
    expect(aiTurn(s, 'developer')?.action.type, 'nobody planned the steps at topic three').toBe('SET_TASKS');
  });

  it('leaves a Product Owner alone when they walk back to re-read the Goal', () => {
    // The agenda only moves forwards, and each move fires once. Otherwise looking back at topic
    // one would be a fight with the Scrum Master rather than a look back.
    let s = sized(at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone',
      sprintGoalAgreed: ['developer', 'scrum_master', 'product_owner'], planningTopic: 'what' }));
    const select = aiTurn(s, 'developer')!;
    expect(select.action.type).toBe('SET_FORECAST');
    s = reducer(s, select.action);
    expect(s.forecast.length, 'nothing was forecast, so this proves nothing').toBeGreaterThan(0);
    s = reducer(s, { type: 'SET_PLANNING_TOPIC', topic: 'why' });   // the Product Owner looks back
    expect(aiTurn(s, 'scrum_master'), 'the Scrum Master dragged them forward again').toBeNull();
  });

  it('does not wait on a seat nobody is holding', () => {
    // An empty seat cannot agree to anything. Waiting for all three regardless would leave the
    // Developers waiting forever on a chair.
    const s = sized(at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone',
      sprintGoalAgreed: ['developer', 'product_owner'], planningTopic: 'what' }));
    expect(aiTurn(s, 'developer', ['developer', 'product_owner'])?.action.type,
      'the Developers waited on a Scrum Master seat nobody was in').toBe('SET_FORECAST');
  });

  it('lets every seat get a turn, rather than one starving the others', () => {
    // The reported symptom: Developers and Product Owner agreed, the Scrum Master sat on
    // "waiting" forever. The cause was upstream - an AI move was judged against whoever was
    // sitting at the browser, so every Developer action was refused while a human held the
    // Product Owner seat, and the loop returned on that seat every tick without ever
    // reaching the Scrum Master. This pins the sequence the loop is supposed to produce.
    const ai = ['developer', 'scrum_master'] as const;
    let s: ZooGameState = { ...withWork(1), phase: 'planning', sprintGoal: 'Open the Grounds zone' };
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    for (let i = 0; i < 60; i += 1) {
      let took = null;
      for (const seat of ai) { const m = aiTurn(s, seat); if (m) { took = m; break; } }
      if (!took) break;
      s = reducer(s, took.action);
    }
    expect(s.sprintGoalAgreed.sort(), 'somebody never got to agree')
      .toEqual(['developer', 'product_owner', 'scrum_master']);
  });

  it('finishes every item in a Sprint, whatever kind it is', () => {
    // Reported twice. First they pulled work and never built it, so a Sprint ended with
    // nothing Done. Then everything finished except a path - because the build was gated on
    // the design being incomplete, and a path's preset already meets its own criteria, so it
    // looked finished, was never built, never had a design stored, and could not leave Doing.
    // Nothing about that was the route it gets drawn on the park.
    let s: ZooGameState = withWork(1);
    for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    const take = s.backlog.filter((x) => x.status === 'backlog' && isReady(x)).slice(0, 6);
    // The plans the Developers would actually have written at topic three, unticked.
    for (const it of take) s = reducer(s, { type: 'SET_TASKS', id: it.id, tasks: suggestTasks(it) });
    s = planSprint({ ...s, phase: 'planning' }, take.map((x) => x.id));

    // Both seats, because neither can finish anything alone: the Developers build it and the
    // Product Owner accepts it, and Done is the two of them agreeing that it is.
    let moves = 0;
    for (let i = 0; i < 400; i += 1) {
      const m = aiTurn(s, 'developer') ?? aiTurn(s, 'product_owner');
      if (!m) break;
      s = reducer(s, m.action); moves += 1;
    }
    expect(moves, 'the seats looped instead of finishing').toBeLessThan(400);

    const worked = s.backlog.filter((x) => take.some((t) => t.id === x.id));
    const unfinished = worked.filter((x) => x.status !== 'done' && x.status !== 'open');
    expect(unfinished.map((x) => `${x.category}:${x.name}`), 'these never left Doing').toEqual([]);
    expect(worked.length).toBeGreaterThan(3);
    // and a category that finished did so with a design that meets its own criteria
    for (const it of worked) {
      expect(it.design, `${it.name} reached Done with no design`).toBeTruthy();
    }
  });

  it('does not forecast an animal without the habitat it cannot start without', () => {
    // Reported from a game, and read out of its state: the Lion Enclosure came back from Sprint
    // one re-sized at one point, capacity was eight, the Lion was eight - so the Lion went in
    // first, the one-point enclosure it needs did not fit after it, and Sprint two was a Sprint
    // Backlog of one item nobody could start. Three days of nothing.
    //
    // Built as that Backlog and no other, because with a fuller one the Developers find
    // something startable by luck and the test passes while the fault is still there.
    const base = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone',
      sprintGoalAgreed: ['developer', 'scrum_master', 'product_owner'], planningTopic: 'what' });
    const lion = { ...base.backlog.find((x) => x.id === 'lion')!, estimate: 8, unsized: false, status: 'backlog' as const };
    const home = { ...base.backlog.find((x) => x.id === 'lion-enc')!, estimate: 1, unsized: false, status: 'backlog' as const,
      carriedOver: true, started: true, design: { parts: {}, colors: { ground: '#8c7a5b', fence: '#6b5b45' } } };
    const s: ZooGameState = { ...base, velocity: [8], backlog: [lion, home] };
    expect(sprintCapacity(s).points, 'this test needs the pair to be a tight fit').toBe(8);

    const move = aiTurn(s, 'developer')!;
    expect(move.action.type).toBe('SET_FORECAST');
    const ids = (move.action as { ids: string[] }).ids;
    expect(ids.length, 'they forecast nothing at all').toBeGreaterThan(0);

    // Whatever they took, they can start something. A Sprint Backlog nobody can begin is three
    // days of watching a board that will not move.
    const committed: ZooGameState = { ...s, backlog: s.backlog.map((x) => (ids.includes(x.id) ? { ...x, status: 'committed' as const } : x)) };
    const canStart = committed.backlog.filter((x) => x.status === 'committed' && enclosureReady(committed, x));
    expect(canStart.map((x) => x.name), 'nothing in the Sprint Backlog could be started at all').not.toEqual([]);
    if (ids.includes('lion')) expect(ids, 'the Lion went in without its enclosure').toContain('lion-enc');
  });

  it('does not propose starting an animal whose habitat is not built', () => {
    // The loop this caused: START_ITEM on an animal is refused by the engine while its
    // enclosure is unbuilt, so the item stayed unstarted and the same move came back every
    // tick, forever. The animal has to be the ONLY thing left to pull, or the Developers
    // simply reach for the habitat first and the guard is never exercised.
    let s: ZooGameState = withWork(1);
    for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    const animal = s.backlog.find((x) => x.category === 'exhibit' && isReady(x))!;
    s = reducer(s, { type: 'SET_TASKS', id: animal.id, tasks: [{ id: 't1', label: 'do it', done: true }] });
    s = planSprint({ ...s, phase: 'planning' }, [animal.id]);   // the animal, and nothing else

    const move = aiTurn(s, 'developer');
    expect(move, 'they proposed starting an animal with nowhere to live').toBeNull();

    // ...and once its habitat exists they take it.
    const withHome = { ...s, backlog: s.backlog.map((it) =>
      it.id === animal.enclosureId ? { ...it, status: 'open' as const } : it) };
    expect(aiTurn(withHome, 'developer')?.action.type).toBe('START_ITEM');
  });

  it('still forecasts after a Sprint that delivered nothing', () => {
    // Velocity is measured, so a Sprint that delivered nothing leaves a capacity of zero.
    // Taking only what fits inside zero is taking nothing, so the Developers forecast
    // nothing - and a team that had one bad Sprint could never start another. Reported as a
    // Planning screen stuck on "0 items in this Sprint, 0 / 0 pts".
    let s: ZooGameState = withWork(1);
    for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    s = { ...s, phase: 'planning', sprintNumber: 2, velocity: [0],
          sprintGoal: 'Open the Big Cats zone',
          sprintGoalAgreed: ['developer', 'scrum_master', 'product_owner'],
          // Selecting work is topic two's business, and this is a test about selecting work.
          planningTopic: 'what' };
    expect(sprintCapacity(s).points, 'this test is not exercising a zero capacity').toBe(0);

    const move = aiTurn(s, 'developer');
    expect(move?.action.type, 'the Developers forecast nothing, so Planning cannot move on').toBe('SET_FORECAST');
    expect((move!.action as { ids: string[] }).ids.length).toBeGreaterThan(0);
    expect(move!.says, 'they did not say why they were guessing').toMatch(/no velocity/i);
  });

  it('can build the biggest item in the Backlog at all', () => {
    // Every day after the first opens with what is left of ninety seconds once the Daily Scrum
    // has been held. An eight point item costs ninety eight seconds, and the rule that lets an
    // item bigger than a day start anyway was measured against the nominal ninety - so it wanted
    // more of the day than a day ever has. The Developers took the item at the top of a day and
    // then sat beside it, every day, while the clock ran out.
    //
    // Driven through the engine rather than with a hand-set clock: the number that matters is
    // the one a real day actually starts with, and a test that picks its own lands on whichever
    // side of the boundary the author expected.
    let s = at({ phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 2 });
    const big = s.backlog.find((it) => it.estimate >= 8)!;
    s = { ...s, backlog: s.backlog.map((it) => (it.id === big.id
      ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber } : it)) };
    s = reducer(s, { type: 'RUN_DAILY_SCRUM' });   // the day the team actually gets
    s = reducer(s, { type: 'TICK_DAY' });          // ...and a second of it gone, as in play
    expect(s.dayStage, 'the Daily Scrum did not hand over to a build day').toBe('building');
    expect(secondsPerPoint(s) * big.estimate, 'this test needs an item bigger than the day it has')
      .toBeGreaterThan(s.daySecondsLeft);
    expect(dayCanAfford(s, big),
      `${big.name} costs ${Math.round(secondsPerPoint(s) * big.estimate)}s and no day the team gets is long enough to start it`)
      .toBe(true);
  });

  it('stops building when the day cannot afford it', () => {
    // Work has to cost time, or a Sprint delivers whatever it likes and the capacity the
    // whole game turns on means nothing. Building first and charging afterwards let a day
    // with five seconds left absorb an eight-point item; a forecast of forty-nine points
    // against a capacity of twenty-two delivered the lot.
    let s: ZooGameState = withWork(1);
    for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    const take = s.backlog.filter((x) => x.status === 'backlog' && isReady(x)).slice(0, 4);
    for (const it of take) s = reducer(s, { type: 'SET_TASKS', id: it.id, tasks: suggestTasks(it) });
    s = planSprint({ ...s, phase: 'planning' }, take.map((x) => x.id));

    // A day with almost nothing left in it cannot take a build.
    const nearlyOver: ZooGameState = { ...s, daySecondsLeft: 2 };
    const started = { ...nearlyOver, backlog: nearlyOver.backlog.map((it) =>
      it.id === take[0].id ? { ...it, started: true } : it) };
    const move = aiTurn(started, 'developer');
    expect(move?.action.type, 'they built an item the day could not pay for').not.toBe('BUILD_ITEM');

    // ...and a whole day can.
    const fresh = { ...started, daySecondsLeft: 90 };
    const ok = aiTurn(fresh, 'developer');
    expect(ok?.action.type).toBe('BUILD_ITEM');
    expect(ok?.weight, 'the build carried no cost, so nothing would be charged for it').toBe(take[0].estimate);
    expect(secondsPerPoint(fresh), 'a point of work costs nothing').toBeGreaterThan(0);
  });

  it('runs out of things to do instead of looping', () => {
    // The property that matters most: each move has to make its own condition stop holding,
    // or a seat sits there sizing the same item forever and burns a session down.
    let s = at({ phase: 'refine' });
    let moves = 0;
    for (let i = 0; i < 500; i += 1) {
      const move = aiTurn(s, 'developer');
      if (!move) break;
      s = reducer(s, move.action);
      moves += 1;
    }
    expect(moves, 'the Developers had nothing to do at all').toBeGreaterThan(0);
    expect(moves, 'the seat looped instead of finishing').toBeLessThan(500);
    expect(aiTurn(s, 'developer'), 'it should be finished once everything is sized').toBeNull();
  });

  it('stays deterministic, so a trainer can still replay a seed', () => {
    // The plan worried that AI seats would cost the reproducibility a shared debrief leans
    // on. These ones do not: same seed, same state, same move.
    const a = aiTurn(at({ phase: 'refine' }), 'developer')!;
    const b = aiTurn(at({ phase: 'refine' }), 'developer')!;
    expect(a).toEqual(b);
    const other = aiTurn(at({ phase: 'refine' }, 2), 'developer')!;
    expect(other.action).not.toEqual(a.action);   // a different seed sizes differently
  });
});
