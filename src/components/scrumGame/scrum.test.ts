import { describe, it, expect } from 'vitest';
import { initialScrumState, defaultDefinitionOfDone, PRODUCT_BACKLOG, totalPoints, totalValue } from './config';

describe('scrum game scaffold', () => {
  it('initial state starts at intro with the full backlog and the three artifacts', () => {
    const s = initialScrumState();
    expect(s.phase).toBe('intro');
    expect(s.productGoal.length).toBeGreaterThan(0);
    expect(s.definitionOfDone.length).toBeGreaterThan(0);
    expect(s.productBacklog.length).toBe(PRODUCT_BACKLOG.length);
    // Every story begins in the ordered Product Backlog, not yet in a Sprint.
    expect(s.productBacklog.every((x) => x.status === 'backlog' && x.sprintNumber === null)).toBe(true);
    expect(s.sprints).toEqual([]);
    expect(s.velocity).toEqual([]);
  });

  it('DoD is domain-neutral (not software-specific)', () => {
    const dod = defaultDefinitionOfDone();
    expect(dod.length).toBeGreaterThan(0);
    for (const c of dod) expect(c.label).not.toMatch(/code|unit test|deploy|merge/i);
  });

  it('backlog totals sum points and value', () => {
    const stories = initialScrumState().productBacklog;
    expect(totalPoints(stories)).toBe(PRODUCT_BACKLOG.reduce((n, s) => n + s.points, 0));
    expect(totalValue(stories)).toBe(PRODUCT_BACKLOG.reduce((n, s) => n + s.value, 0));
  });
});
