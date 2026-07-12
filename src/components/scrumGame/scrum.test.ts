import { describe, it, expect } from 'vitest';
import { initialScrumState, defaultDefinitionOfDone, PRODUCT_BACKLOG, totalPoints, totalValue, sprintCapacity, averageVelocity, SUGGESTED_CAPACITY } from './config';
import { planSprint, availableStories, sprintStories } from './engine';

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

describe('sprint planning', () => {
  it('capacity is the first-sprint guess with no velocity, then average velocity', () => {
    expect(sprintCapacity([])).toBe(SUGGESTED_CAPACITY);
    expect(averageVelocity([10, 12, 14])).toBe(12);
    expect(sprintCapacity([10, 12, 14])).toBe(12);
  });

  it('planSprint opens Sprint 1, sets the goal, and moves chosen stories onto the board', () => {
    const s0 = initialScrumState();
    const chosen = ['s1', 's2'];
    const s1 = planSprint(s0, '  Book and pay  ', chosen);
    expect(s1.phase).toBe('sprint');
    expect(s1.currentSprint?.number).toBe(1);
    expect(s1.currentSprint?.goal).toBe('Book and pay'); // trimmed
    expect(s1.currentSprint?.committedStoryIds).toEqual(chosen);
    // Chosen stories are now on the Sprint board; the rest stay available.
    const onBoard = sprintStories(s1, 1);
    expect(onBoard.map((x) => x.id).sort()).toEqual(['s1', 's2']);
    expect(onBoard.every((x) => x.status === 'todo' && x.sprintNumber === 1)).toBe(true);
    expect(availableStories(s1).some((x) => chosen.includes(x.id))).toBe(false);
    expect(availableStories(s1).length).toBe(PRODUCT_BACKLOG.length - 2);
  });
});
