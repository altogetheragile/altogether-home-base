import { describe, it, expect } from 'vitest';
import { initialScrumState, defaultDefinitionOfDone, PRODUCT_BACKLOG, totalPoints, totalValue, sprintCapacity, averageVelocity, SUGGESTED_CAPACITY, improvementBonus, RETRO_IMPROVEMENTS } from './config';
import { planSprint, availableStories, sprintStories, startStory, runSprintDay, reviewSprint, startNextSprint, sprintGoalMet, teamCapacity, isSprintOver, deliveredPoints } from './engine';

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

describe('sprint execution', () => {
  // Plan a small sprint (2 stories, 13 pts) and start both.
  const planned = () => {
    let s = planSprint(initialScrumState(), 'Book and pay', ['s1', 's2']); // 5 + 8 = 13
    s = startStory(s, 's1');
    s = startStory(s, 's2');
    return s;
  };

  it('teamCapacity is deterministic and positive', () => {
    expect(teamCapacity(1, 1)).toBe(teamCapacity(1, 1));
    expect(teamCapacity(1, 1)).toBeGreaterThan(0);
  });

  it('startStory moves a story from To Do into Doing', () => {
    const s = startStory(planSprint(initialScrumState(), 'g', ['s1']), 's1');
    expect(s.productBacklog.find((x) => x.id === 's1')?.status).toBe('doing');
  });

  it('runSprintDay burns effort, completes stories, advances the day and records burndown', () => {
    let s = planned();
    expect(s.currentSprint?.burndown).toEqual([13]); // day 0 = full commitment
    const before = s.currentSprint!.day;
    s = runSprintDay(s);
    expect(s.currentSprint!.day).toBe(before + 1);
    expect(s.currentSprint!.burndown.length).toBe(2);
    // Some effort was applied across the two Doing stories.
    const remaining = sprintStories(s, 1).reduce((n, x) => n + x.effortRemaining, 0);
    expect(remaining).toBeLessThan(13);
  });

  it('a story reaching zero effort becomes Done', () => {
    let s = startStory(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 3 pts, tiny
    for (let i = 0; i < 6 && s.currentSprint && !isSprintOver(s.currentSprint); i++) s = runSprintDay(s);
    expect(sprintStories(s, 1).find((x) => x.id === 's3')?.status).toBe('done');
  });

  it('reviewSprint records velocity, returns unfinished work, and opens the Review', () => {
    // Over-commit big stories so some won't finish in the timebox.
    let s = planSprint(initialScrumState(), 'too much', ['s2', 's7', 's9']); // 8+8+8 = 24
    for (const id of ['s2', 's7', 's9']) s = startStory(s, id);
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    const delivered = deliveredPoints(s, 1);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.currentSprint?.number).toBe(1); // kept for the Review/Retro screens
    expect(s.velocity).toEqual([delivered]);
    // Unfinished stories are back in the Product Backlog, available to re-plan.
    const backlogIds = availableStories(s).map((x) => x.id);
    const undone = ['s2', 's7', 's9'].filter((id) => !s.productBacklog.find((x) => x.id === id && x.status === 'done'));
    for (const id of undone) expect(backlogIds).toContain(id);
  });
});

describe('review and retrospective', () => {
  it('sprintGoalMet is true only when every committed story reached Done', () => {
    let s = startStory(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 3 pts
    expect(sprintGoalMet(s, 1)).toBe(false);
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    expect(sprintGoalMet(s, 1)).toBe(true);
  });

  it('improvementBonus grows with retros, capped', () => {
    expect(improvementBonus([])).toBe(0);
    expect(improvementBonus(['a'])).toBe(1);
    expect(improvementBonus(['a', 'b', 'c', 'd'])).toBe(2); // capped
  });

  it('startNextSprint carries the improvement, files the sprint, and returns to planning', () => {
    let s = reviewSprint(startStory(planSprint(initialScrumState(), 'g', ['s3']), 's3'));
    s = startNextSprint(s, RETRO_IMPROVEMENTS[0]);
    expect(s.phase).toBe('planning');
    expect(s.currentSprint).toBeNull();
    expect(s.improvements).toEqual([RETRO_IMPROVEMENTS[0]]);
    expect(s.sprints).toHaveLength(1);
  });

  it('accumulated improvements raise the team capacity', () => {
    const base = teamCapacity(1, 1, 0);
    expect(teamCapacity(1, 1, improvementBonus(['a', 'b']))).toBe(base + 2);
  });
});
