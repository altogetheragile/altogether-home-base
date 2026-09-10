import { describe, it, expect } from 'vitest';
import { applyParkChecks } from './parkChecks';
import { initialZooState, DAY_SECONDS } from './config';
import { presetFor, hasRoomToRoam } from './design';
import { suggestTasks, startItem, buildItem, isSignOffTask, readyToMove, openItem } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// The plan and the criteria answer to the same facts.
//
// Reported from playing it: "when I do the build steps the game automatically checks off ACs but not
// tasks - logically the ACs cannot be met without the tasks being completed." They were checked in
// two different places: the criteria in the reducer, where every action passes, and the plan inside
// the build takeover, which was deleted when everything moved onto the park. So the criteria kept
// ticking themselves and the plan stopped.
//
// And the same bug in both: "a pair can reach Done but a family cannot", because the step that asks
// whether they fit measured a copy of the habitat's size kept on the ANIMAL rather than the pen
// they live in - so making the pen bigger changed the criterion and never the step.

const sprint = (): ZooGameState => {
  const base = initialZooState(3);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS,
    backlog: base.backlog.map((it) => ({ ...it, tasks: it.tasks?.length ? it.tasks : suggestTasks(it) })),
  } as ZooGameState;
};
const withStarted = (s: ZooGameState, id: string, design = presetFor(s.backlog.find((i) => i.id === id)!)) => {
  let game = { ...s, backlog: s.backlog.map((it) => (it.id === id
    ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
  game = startItem(game, id, 'developer');
  return applyParkChecks(buildItem(game, id, design));
};
const of = (s: ZooGameState, id: string): BacklogItem => s.backlog.find((it) => it.id === id)!;

describe('the plan ticks itself, like the criteria', () => {
  it('ticks the steps the built thing has finished', () => {
    const s = sprint();
    const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    const built = withStarted(s, h.id);
    const steps = (of(built, h.id).tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label));
    expect(steps.length, 'this item has no plan to tick').toBeGreaterThan(0);
    expect(steps.some((t) => t.done), 'building the thing ticked nothing off its plan').toBe(true);
  });

  it('never ticks the sign-off: that is the Product Owner accepting the work', () => {
    const s = sprint();
    const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    const built = withStarted(s, h.id);
    const signOff = (of(built, h.id).tasks ?? []).find((t) => isSignOffTask(t.label));
    expect(signOff?.done, 'the game signed off its own work').toBeFalsy();
  });
});

describe('a family of lions', () => {
  const stocked = (size: 'small' | 'medium' | 'large', group: { males: number; females: number; juveniles: number; cubs: number }) => {
    const s = sprint();
    const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    const lion = s.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === h.id)!;
    const sized = { ...s, backlog: s.backlog.map((it) => (it.id === h.id ? { ...it, enclosureSize: size } : it)) } as ZooGameState;
    const withHome = withStarted(sized, h.id);
    return withStarted(withHome, lion.id, { ...presetFor(lion), group, colors: { coat: '#c8761f' } });
  };
  const lionOf = (s: ZooGameState) => s.backlog.find((it) => it.category === 'exhibit' && it.started)!;

  it('ticks "check they fit" against the pen they live in, not a copy on the animal', () => {
    const family = { males: 1, females: 2, juveniles: 1, cubs: 2 };
    expect(hasRoomToRoam(family, 'large'), 'this test needs a family that fits a large pen').toBe(true);
    const big = stocked('large', family);
    const step = (lionOf(big).tasks ?? []).find((t) => /fit the habitat|room/i.test(t.label));
    expect(step?.done, 'a family in a large habitat still could not tick "check they fit"').toBe(true);
  });

  it('leaves it unticked while they are crowded, so the item cannot be moved to Done', () => {
    const crowded = stocked('small', { males: 2, females: 3, juveniles: 1, cubs: 2 });
    const step = (lionOf(crowded).tasks ?? []).find((t) => /fit the habitat|room/i.test(t.label));
    expect(step?.done, 'a pride crammed into a small pen ticked as fitting').toBeFalsy();
    expect(readyToMove(lionOf(crowded)), 'crowded work was ready for Done').toBe(false);
  });
});

describe('the way to visitors', () => {
  it('goes through Done', () => {
    // "I cannot move it to Done but I can open it - that's not right." Opening checked the sign-off
    // and never the column, so work could reach visitors round the outside of the board.
    const s = sprint();
    const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    const built = withStarted(s, h.id);
    expect(of(built, h.id).status, 'it walked into Done by itself').toBe('committed');
    expect(of(openItem(built, h.id, 'product_owner'), h.id).status,
      'work went live without ever being Done').toBe('committed');
  });
});
