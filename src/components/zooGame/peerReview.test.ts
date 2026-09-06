import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { startItem } from './engine';
import { dodVerdicts } from './dodChecks';
import { aiTurn } from './aiSeats';
import type { ZooGameState } from './types';

// "Peer-reviewed by another Developer" has to be reachable by somebody.
//
// Reported from a live game, day 3 of Sprint 3, sitting as the Product Owner: an item with every
// acceptance criterion accepted, signed off, standing on the park - and stuck, because the
// Definition of Done wanted a second Developer on it and the line read "nobody picked it up".
// Nothing in the game had ever written down who was working on anything; `assignedDevs` was only
// filled by choosing a name from a menu, and seats played by the game never chose. The one person
// watching it happen could not fix it either, because assigning a Developer is not the Product
// Owner's call - and should not be.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const item = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: 90, committedIds: [item.id],
    backlog: base.backlog.map((it) => (it.id === item.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

const held = (s: ZooGameState) => s.backlog.find((it) => it.status === 'committed')!;

describe('who is working on it', () => {
  it('writes down whoever took the work', () => {
    const s = sprint();
    const after = startItem(s, held(s).id);
    const on = after.backlog.find((it) => it.id === held(s).id)!.assignedDevs ?? [];
    expect(on.length, 'the item was taken and nobody was recorded as working it').toBe(1);
    expect(s.team.developers.some((d) => d.id === on[0])).toBe(true);
  });

  it('says one Developer worked it alone, not that nobody picked it up', () => {
    const s = startItem(sprint(), held(sprint()).id);
    const item = s.backlog.find((it) => it.started)!;
    const line = dodVerdicts(s, item).find((c) => /Peer-reviewed/.test(c.line))!;
    expect(line.answer && 'met' in line.answer && line.answer.met,
      'one Developer alone met a line about a second pair of eyes').toBe(false);
    expect(line.answer?.evidence, 'the park still says nobody is on it').toMatch(/one Developer worked it alone/);
  });

  it('gives the work to the Developer with the least on', () => {
    // Deterministic, so the same game always reads the same way.
    const base = initialZooState(3);
    // Two things that can start on their own - an animal waits for its habitat.
    const two = base.backlog.filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 2);
    let s = {
      ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: 90, wipLimit: 0,
      backlog: base.backlog.map((it) => (two.some((t) => t.id === it.id)
        ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    } as ZooGameState;
    s = startItem(s, two[0].id);
    s = startItem(s, two[1].id);
    const [a, b] = two.map((t) => s.backlog.find((it) => it.id === t.id)!.assignedDevs ?? []);
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
    expect(a[0], 'both items went to the same Developer while another had nothing').not.toBe(b[0]);
  });
});

describe('the second pair of eyes', () => {
  /** An item built, its plan ticked off, waiting only on a review. */
  const waiting = (): ZooGameState => {
    const s = startItem(sprint(), held(sprint()).id);
    return {
      ...s,
      backlog: s.backlog.map((it) => (it.started
        ? { ...it, design: { parts: {}, colors: {} } as never,
          tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })) }
        : it)),
    } as ZooGameState;
  };

  it('is offered by the Developers themselves', () => {
    // Seats played by the game built the work and never reviewed each other's, so an item could be
    // finished in every other respect and never become Done.
    const move = aiTurn(waiting(), 'developer');
    expect(move, 'the Developers had nothing to offer on work waiting for a review').toBeTruthy();
    expect(move!.action.type).toBe('ASSIGN_DEV');
    expect(move!.says).toMatch(/second pair of eyes/i);
  });

  it('and clears the line the game was stuck on', () => {
    const s = waiting();
    const move = aiTurn(s, 'developer')!;
    const a = move.action as { type: 'ASSIGN_DEV'; itemId: string; devId: string };
    const item = s.backlog.find((it) => it.id === a.itemId)!;
    expect((item.assignedDevs ?? []).includes(a.devId), 'the reviewer was already on it').toBe(false);
    const after = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === a.itemId
        ? { ...it, assignedDevs: [...(it.assignedDevs ?? []), a.devId] } : it)),
    } as ZooGameState;
    const line = dodVerdicts(after, after.backlog.find((it) => it.id === a.itemId)!)
      .find((c) => /Peer-reviewed/.test(c.line))!;
    expect(line.answer && 'met' in line.answer && line.answer.met,
      'a second Developer joined and the line still did not clear').toBe(true);
    expect(line.answer?.evidence).toMatch(/2 Developers worked it/);
  });

  it('does not offer a review on work that is not finished', () => {
    const s = startItem(sprint(), held(sprint()).id);   // started, nothing built yet
    const move = aiTurn(s, 'developer');
    expect(move?.action.type, 'they reviewed something nobody had built').not.toBe('ASSIGN_DEV');
  });
});
