import { describe, it, expect } from 'vitest';
import { initialZooState, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT } from './config';
import { answerImpediment, generateImpediment, landImpediment, inTheWayOfTheGoal, decisionsIn } from './engine';
import type { ZooGameState, Impediment } from './types';

// A block is not an impediment.
//
// "A block affects only a single task, whereas an impediment acts like a parachute, slowing down
// overall progress. Quite often the Development Team can fix blocks themselves whereas impediments
// need to be fixed by the Scrum Master" - Barry Overeem, The 8 Stances of a Scrum Master.
//
// The game called everything an impediment and gave you a button, so the answer was always the same
// and the Scrum Master's judgement never came into it. Four answers now, none of them forbidden,
// each charged honestly - and the log keeps the pattern for the Retrospective to read back.

const atScrum = (imp: Impediment | null, over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const items = base.backlog.filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 2);
  return {
    ...base, phase: 'sprint', dayStage: 'dailyScrum', sprintNumber: 1, dayNumber: 1, sprintDays: 3,
    dailyScrumAt: 'start', daySecondsLeft: 90, scrumSecondsLeft: 20,
    pendingImpediment: imp,
    backlog: base.backlog.map((it) => (items.some((x) => x.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: it.id === items[0].id } : it)),
    ...over,
  } as ZooGameState;
};

const block = (over: Partial<Impediment> = {}): Impediment =>
  ({ id: 'imp-1-1', title: 'The paint delivery is late', detail: 'no colours', kind: 'block', ...over });
const impediment = (): Impediment =>
  ({ id: 'imp-1-1', title: 'A keeper called in sick', detail: 'short handed', kind: 'impediment' });

describe('what surfaced, and whose it is', () => {
  it('knows which kind of thing each one is', () => {
    // Deterministic, like everything else in the game: the same day always brings the same thing.
    const kinds = new Set<string>();
    for (let d = 1; d < 40; d += 1) {
      const imp = generateImpediment(7, 1, d);
      if (imp) kinds.add(imp.kind ?? 'impediment');
    }
    expect(kinds.has('block'), 'nothing is ever just one item’s problem').toBe(true);
    expect(kinds.has('impediment'), 'nothing is ever the whole team’s problem').toBe(true);
  });

  it('lands a block on an item, and makes it an impediment when there is nothing to block', () => {
    const s = atScrum(null);
    const landed = landImpediment(s, block())!;
    expect(landed.itemId, 'a block landed on nothing at all').toBeTruthy();
    expect(landed.detail).toContain(s.backlog.find((it) => it.id === landed.itemId)!.name);

    const empty = { ...s, backlog: s.backlog.map((it) => ({ ...it, status: 'backlog' as const })) } as ZooGameState;
    expect(landImpediment(empty, block())!.kind, 'a block with nothing to block stayed a block').toBe('impediment');
  });

  it('uses the Sprint Goal to decide whether a block is still just a block', () => {
    // The paper's own test, and the one the game can answer: if it prevents the Sprint Goal it is
    // an impediment, whatever it looked like when it arrived.
    const s = atScrum(null);
    const on = s.backlog.find((it) => it.status === 'committed')!;
    const other = s.backlog.find((it) => it.status === 'committed' && it.id !== on.id)!;
    const marked = {
      ...s, backlog: s.backlog.map((it) => (it.id === other.id ? { ...it, goalCritical: true } : it)),
    } as ZooGameState;
    expect(inTheWayOfTheGoal(marked, block({ itemId: on.id })),
      'a block on work the Goal does not need was called a Goal risk').toBe(false);
    expect(inTheWayOfTheGoal(marked, block({ itemId: other.id })),
      'a block on the one essential item was waved through').toBe(true);
    expect(inTheWayOfTheGoal(marked, impediment())).toBe(true);
  });
});

describe('the four answers, and what each costs', () => {
  it('lets the Developers clear their own block, cheaply', () => {
    const after = answerImpediment(atScrum(landImpediment(atScrum(null), block())), 'team');
    expect(after.carriedImpediment, 'the Developers cleared it and it came back anyway').toBeNull();
    expect(after.dayTimeMult).toBeGreaterThan(DAILY_SCRUM_MULT);
    const log = decisionsIn(after, 1).find((d) => /left to the Developers/.test(d.what))!;
    expect(log.cost).toMatch(/solved their own problem/);
  });

  it('makes leaving a team-wide impediment cost what ignoring it costs', () => {
    const after = answerImpediment(atScrum(impediment()), 'team');
    expect(after.carriedImpediment, 'an impediment beyond the team quietly vanished').toBeTruthy();
    expect(after.dayTimeMult).toBe(SKIP_PENALTY_MULT);
  });

  it('clears what the Scrum Master removes, and says when they did not need to', () => {
    const removed = answerImpediment(atScrum(impediment()), 'remove');
    expect(removed.carriedImpediment).toBeNull();
    expect(removed.dayTimeMult).toBe(DAILY_SCRUM_MULT);

    // The same answer to a block is the Super Hero, and the log says so without scoring it.
    const hero = answerImpediment(atScrum(landImpediment(atScrum(null), block())), 'remove');
    const log = decisionsIn(hero, 1).find((d) => /the Scrum Master removed it/.test(d.what))!;
    expect(log.what, 'removing a block the Developers could have cleared went unremarked').toMatch(/though the Developers could have/);
    expect(log.cost).toMatch(/learned to wait/);
  });

  it('keeps what was worked around, and it is still there tomorrow', () => {
    const after = answerImpediment(atScrum(impediment()), 'around');
    expect(after.carriedImpediment, 'working around it made it go away').toBeTruthy();
    expect(after.carriedImpediment!.missed, 'working around it was recorded as ignoring it').toBeFalsy();
  });

  it('lets an escalation resolve itself, and nobody here solved it', () => {
    const after = answerImpediment(atScrum(impediment()), 'escalate');
    expect(after.carriedImpediment!.waitDays, 'escalating did not start a wait').toBe(2);
    expect(decisionsIn(after, 1).find((d) => /escalated/.test(d.what))!.cost).toMatch(/nobody here solved it/);
    // ...and it clears on its own as the days pass, without costing the team.
    const endOfDay = { ...after, dayStage: 'building' } as ZooGameState;
    const next = answerImpediment({ ...endOfDay, dayStage: 'dailyScrum', pendingImpediment: null }, 'team');
    expect(next.carriedImpediment?.waitDays ?? 0).toBeLessThan(2);
  });

  it('records every answer for the Retrospective to read back', () => {
    const after = answerImpediment(atScrum(landImpediment(atScrum(null), block())), 'remove');
    const [entry] = after.impedimentLog ?? [];
    expect(entry, 'nothing was kept about what was done').toBeTruthy();
    expect(entry.kind).toBe('block');
    expect(entry.how).toBe('remove');
    expect(entry.sprint).toBe(1);
  });

  it('concludes the Daily Scrum, whichever answer it was', () => {
    // The answer IS the event's decision: it surfaced here, and what the team does about it today
    // is what the event is for.
    for (const how of ['team', 'remove', 'around', 'escalate'] as const) {
      const after = answerImpediment(atScrum(impediment()), how);
      expect(after.dayStage, `answering "${how}" left the team standing in the event`).not.toBe('dailyScrum');
      expect(after.pendingImpediment).toBeNull();
    }
  });
});
