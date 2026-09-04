import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, todaysDecision, decisionsIn, sprintProgress } from './engine';
import { mayTake } from './seatRules';
import type { ZooGameState } from './types';

// "Are we on track for the Sprint Goal?" - answered, not asked.
//
// The Daily Scrum is where the Developers inspect progress and adapt the plan. A screen that asks
// the question and leaves the arithmetic to you is not adapting anything, so the game does the sum:
// what is left, how long is left, and what of it the Goal actually depends on.
//
// Where the forecast no longer fits, the honest move is to drop what the Goal does not need while
// there is still time for what it does. Scope is renegotiated as more is learned; the Goal is not.

/** A Sprint forecast well past what the days can hold, with one essential item and one that is not. */
function overCommitted(): { s: ZooGameState; essential: string; optional: string } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const ids = s.backlog.filter((it) => it.status === 'backlog' && !it.unsized).slice(0, 6).map((it) => it.id);
  s = planSprint({ ...s, phase: 'planning' }, ids);
  const inSprint = s.backlog.filter((it) => it.sprintNumber === s.sprintNumber);
  const essential = inSprint[0].id;
  const optional = [...inSprint].sort((a, z) => z.estimate - a.estimate).find((it) => it.id !== essential)!.id;
  s = { ...s, dayStage: 'building', daySecondsLeft: 90,
    dayNumber: s.sprintDays,   // the last day, so there is very little left to do it in
    backlog: s.backlog.map((it) => (it.id === essential ? { ...it, goalCritical: true } : it)) };
  return { s, essential, optional };
}

describe('the decision in front of the Developers today', () => {
  it('says what is left, how long is left, and what the Goal does not depend on', () => {
    const { s, optional } = overCommitted();
    const d = todaysDecision(s)!;
    expect(d, 'the game had nothing to say about a Sprint that cannot finish').toBeTruthy();
    expect(d.candidate.id, 'it offered to drop the wrong thing').toBe(optional);
    expect(d.left).toBe(sprintProgress(s).remaining);
    expect(d.ifDropped).toMatch(/Drop it/);
    expect(d.ifKept).toMatch(/at risk/);
  });

  it('never offers to drop what the Goal depends on', () => {
    // That is the Goal, and the Goal is the commitment. Only the plan is up for renegotiation.
    const { s, essential } = overCommitted();
    const everythingEssential: ZooGameState = { ...s,
      backlog: s.backlog.map((it) => (it.sprintNumber === s.sprintNumber ? { ...it, goalCritical: true } : it)) };
    expect(todaysDecision(everythingEssential), 'the game offered to drop the Sprint Goal').toBeNull();
    expect(todaysDecision(s)!.candidate.id).not.toBe(essential);
  });

  it('says nothing when the work fits', () => {
    // A decision offered every day, whether or not there is one to make, is noise - and a team that
    // drops something on day one has not learned anything yet.
    let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
    for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    const one = s.backlog.find((it) => it.status === 'backlog' && !it.unsized)!;
    s = planSprint({ ...s, phase: 'planning' }, [one.id]);
    expect(todaysDecision({ ...s, dayStage: 'building', dayNumber: 1 }), 'a Sprint with room to spare was told to drop something').toBeNull();
  });
});

describe('dropping work to protect the Goal', () => {
  it('puts it back in the Product Backlog, and records who did it', () => {
    const { s, optional } = overCommitted();
    const after = reducer(s, { type: 'DROP_FROM_SPRINT', id: optional });
    const item = after.backlog.find((it) => it.id === optional)!;
    expect(item.status, 'dropped work vanished instead of going back to the Product Backlog').toBe('backlog');
    expect(item.sprintNumber, 'it still belongs to the Sprint it was dropped from').toBeNull();

    const noted = decisionsIn(after, after.sprintNumber).filter((d) => /dropped/.test(d.what));
    expect(noted.length, 'the Sprint Backlog changed and nobody wrote it down').toBe(1);
    expect(noted[0].by, 'the Sprint Backlog is the Developers’ plan').toBe('developer');
    expect(noted[0].what).toMatch(/protect the Sprint Goal/);
  });

  it('is the Developers’ call', () => {
    expect(mayTake('DROP_FROM_SPRINT', { seat: 'developer' }).allowed).toBe(true);
    const po = mayTake('DROP_FROM_SPRINT', { seat: 'product_owner' });
    expect(po.allowed, 'the Product Owner changed the Developers’ plan').toBe(false);
    expect(po.because ?? '', 'refusing without saying why teaches nothing').toMatch(/Developers/);
  });

  it('leaves everything else alone', () => {
    const { s, optional } = overCommitted();
    const after = reducer(s, { type: 'DROP_FROM_SPRINT', id: optional });
    const others = s.backlog.filter((it) => it.sprintNumber === s.sprintNumber && it.id !== optional).map((it) => it.id);
    for (const id of others) {
      expect(after.backlog.find((it) => it.id === id)!.sprintNumber, `${id} was dropped too`).toBe(s.sprintNumber);
    }
  });
});
