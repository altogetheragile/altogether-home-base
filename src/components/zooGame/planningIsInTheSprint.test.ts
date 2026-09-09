import { describe, it, expect } from 'vitest';
import { clocks, goalLine } from './header';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Sprint Planning is inside the Sprint, and the strip has to say so.
//
// Asked while playing it: "it says no Sprint yet at the top but Sprint Planning is part of a
// Sprint." It is - the Guide is explicit that Sprint Planning initiates the Sprint - so the strip
// was teaching the opposite of the thing the screen was there to teach.

const planning = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'planning', sprintNumber: 2, planningTopic: 'what',
  sprintGoal: 'Open the Savanna so families have more to see', ...over,
} as ZooGameState);

describe('the strip at Sprint Planning', () => {
  it('says the Sprint has begun', () => {
    const c = clocks(planning());
    expect(c.big, 'a day was counted before the first one started').toBeNull();
    expect(c.note).toBe('Sprint 2 · planning');
    expect(c.note, 'the strip still says there is no Sprint').not.toMatch(/no Sprint yet/);
    expect(c.small).toMatch(/day 1 starts when you do/);
  });

  it('still says there is no Sprint before the first Planning', () => {
    expect(clocks({ ...initialZooState(3), phase: 'refine' } as ZooGameState).note).toBe('no Sprint yet');
  });

  it('makes the Sprint Goal the headline, because there is no progress to report yet', () => {
    const g = goalLine(planning());
    expect(g.line).toBe('Open the Savanna so families have more to see');
    expect(g.isGoal).toBe(true);
    // ...and where nobody has agreed one, it says that instead of pretending.
    expect(goalLine(planning({ sprintGoal: '' })).line).toBe('No Sprint Goal yet');
  });
});
