import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { setDefinitionOfDone, suggestTasks, dodWantsSignOff, isSignOffTask, readyForDone } from './engine';
import type { ZooGameState } from './types';

// The Definition of Done decides what Done takes.
//
// Asked while playing it: "What if we delete the PO approval criterion from the DoD? Does that
// break the button?" It should not break it - it should REMOVE it, and change what Done means with
// it. The agreement is the team's, and the sharpest thing in it is whether anybody has to accept
// the work. Take that line out and the facts the park checks are the whole of Done; put it back and
// the sign-off comes back on every item still in flight.

const sprint = (): ZooGameState => {
  const base = initialZooState(3);
  const h = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [h.id],
    backlog: base.backlog.map((it) => (it.id === h.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, tasks: suggestTasks(it) } : it)),
  } as ZooGameState;
};
const theOne = (s: ZooGameState) => s.backlog.find((it) => it.status === 'committed' && it.started)!;

describe('taking the Product Owner’s acceptance out of the Definition of Done', () => {
  it('is read off the agreement, not assumed', () => {
    const s = sprint();
    expect(dodWantsSignOff(s), 'the shipped Definition of Done does ask for it').toBe(true);
    expect(dodWantsSignOff({ ...s, definitionOfDone: ['Peer-reviewed by another Developer'] } as ZooGameState)).toBe(false);
  });

  it('takes the sign-off step off the plans in flight', () => {
    const s = sprint();
    expect((theOne(s).tasks ?? []).some((t) => isSignOffTask(t.label))).toBe(true);
    const without = setDefinitionOfDone(s, ['Peer-reviewed by another Developer', 'Placed on the park, ready to open']);
    expect((theOne(without).tasks ?? []).some((t) => isSignOffTask(t.label)),
      'the plan still waits on a sign-off nobody agreed to').toBe(false);
    // ...and Done no longer waits for anybody: the Developers' own plan is the whole of it.
    const built = { ...theOne(without), tasks: (theOne(without).tasks ?? []).map((t) => ({ ...t, done: true })) };
    expect(readyForDone(built)).toBe(true);
  });

  it('puts it back when the team puts the line back', () => {
    const s = sprint();
    const without = setDefinitionOfDone(s, ['Peer-reviewed by another Developer']);
    const again = setDefinitionOfDone(without, ['Peer-reviewed by another Developer', 'Meets its acceptance criteria, confirmed by the Product Owner']);
    expect((theOne(again).tasks ?? []).some((t) => isSignOffTask(t.label)),
      'the agreement came back and the sign-off did not').toBe(true);
  });

  it('leaves work that is already Done alone', () => {
    // It was Done under the agreement in force at the time. Rewriting that is not inspect and adapt.
    const s = sprint();
    const done = { ...s, backlog: s.backlog.map((it) => (it.id === theOne(s).id
      ? { ...it, status: 'done' as const, tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })) } : it)) } as ZooGameState;
    const without = setDefinitionOfDone(done, ['Peer-reviewed by another Developer']);
    const item = without.backlog.find((it) => it.status === 'done')!;
    expect((item.tasks ?? []).some((t) => isSignOffTask(t.label))).toBe(true);
  });
});
