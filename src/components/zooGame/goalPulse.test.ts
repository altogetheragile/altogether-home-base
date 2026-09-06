import { describe, it, expect } from 'vitest';
import { goalPulse, secondsPerPoint, dayTotalSeconds } from './engine';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Is the Sprint Goal safe?
//
// The second of the three things a learner needs during a build day, after the clock. It is answered
// from the Sprint's own arithmetic - what the essentials still cost at this team's measured rate,
// against the time the Sprint has left - rather than from a mood or a colour. A warning that cannot
// say which item is at risk is a warning nobody can act on.

/** A Sprint with `pts` forecast, `day` of three, and `left` seconds on today's clock. */
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintDays: 3,
    daySecondsLeft: dayTotalSeconds(1), dayTimeMult: 1,
    committedIds: take.map((it) => it.id),
    forecastPoints: take.reduce((s, it) => s + it.estimate, 0),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, goalCritical: true } : it)),
    ...over,
  } as ZooGameState;
};

describe('is the Sprint Goal safe', () => {
  it('says so, with the essentials and the points, while there is time', () => {
    const p = goalPulse(sprint());
    expect(p.level).toBe('safe');
    expect(p.line).toMatch(/^Goal safe/);
    expect(p.line, 'the line does not count the essentials').toMatch(/0 of 2 essentials/);
    expect(p.line, 'the line does not count the points').toMatch(/0 of \d+ pts/);
  });

  it('turns when what is left will not fit in what is left', () => {
    // Last day, nearly out of clock, both essentials untouched: the arithmetic says it will not fit.
    const s = sprint({ dayNumber: 3, daySecondsLeft: 22 });
    const p = goalPulse(s);
    expect(p.level).toBe('risk');
    // It names the item, because "at risk" on its own is a mood.
    const worst = s.backlog.filter((it) => it.goalCritical).sort((a, z) => z.estimate - a.estimate)[0];
    expect(p.line).toContain(worst.name);
  });

  it('says it in one line and nothing else - no band across the screen', () => {
    // The strip already carries the answer and names what is doing it. A second copy of the same
    // answer, in a band above the board, was one more thing between a learner and the work.
    const p = goalPulse(sprint({ dayNumber: 3, daySecondsLeft: 22 }));
    expect(Object.keys(p).sort(), 'the pulse grew a headline again').toEqual(['level', 'line']);
  });

  it('says nothing is forecast rather than claiming a goal is safe', () => {
    const p = goalPulse(sprint({ backlog: [], committedIds: [], forecastPoints: 0 }));
    expect(p.line).toBe('Nothing forecast yet');
  });

  it('counts items before essentials can be marked', () => {
    // Marking essentials is revealed after the first Sprint. Until then the Goal rests on
    // everything forecast, and the line says so rather than announcing an absence.
    const s = sprint();
    const none = { ...s, backlog: s.backlog.map((it) => ({ ...it, goalCritical: false })) } as ZooGameState;
    expect(goalPulse(none).line).toMatch(/0 of 2 items/);
  });

  it('measures the cost at the team’s own rate, not a guess', () => {
    // The whole point: the warning is arithmetic. Give the same Sprint two clocks and only the one
    // that genuinely cannot pay for the work is at risk.
    const s = sprint({ dayNumber: 3 });
    const owed = s.backlog.filter((it) => it.goalCritical).reduce((n, it) => n + it.estimate, 0) * secondsPerPoint(s);
    expect(goalPulse({ ...s, daySecondsLeft: Math.ceil(owed) + 5 } as ZooGameState).level).toBe('safe');
    expect(goalPulse({ ...s, daySecondsLeft: Math.floor(owed) - 5 } as ZooGameState).level).toBe('risk');
  });
});
