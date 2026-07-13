import { describe, it, expect } from 'vitest';
import {
  initialScrumState, defaultDefinitionOfDone, PRODUCT_BACKLOG, totalPoints, totalValue,
  sprintCapacity, averageVelocity, CAPACITY_PER_DEV, improvementBonus, RETRO_IMPROVEMENTS,
  DEFAULT_TEAM, makeDeveloper, MIN_TEAM, MAX_TEAM,
} from './config';
import {
  planSprint, availableStories, sprintStories, startStory, addToSprint,
  assignDev, unassignDev, setTeam, benchedDevs, devsOnStory,
  runSprintDay, reviewSprint, startNextSprint, sprintGoalMet, forecastPoints,
  devRoll, isSprintOver, deliveredPoints,
} from './engine';

/** Put the whole team on one story (a full swarm). */
const swarm = (s: ReturnType<typeof initialScrumState>, storyId: string) =>
  s.team.reduce((acc, d) => assignDev(acc, d.id, storyId), s);

describe('scrum game scaffold', () => {
  it('initial state starts at intro with the full backlog, the artifacts and a team on the bench', () => {
    const s = initialScrumState();
    expect(s.phase).toBe('intro');
    expect(s.productGoal.length).toBeGreaterThan(0);
    expect(s.definitionOfDone.length).toBeGreaterThan(0);
    expect(s.productBacklog.length).toBe(PRODUCT_BACKLOG.length);
    expect(s.productBacklog.every((x) => x.status === 'backlog' && x.sprintNumber === null)).toBe(true);
    expect(s.team.length).toBe(DEFAULT_TEAM.length);
    expect(s.assignments).toEqual({}); // everyone on the bench
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

  it('makeDeveloper derives distinct two-letter initials', () => {
    expect(makeDeveloper('x', 'Robin').initials).toBe('RO');
    expect(makeDeveloper('x', 'Riley').initials).toBe('RI');
    expect(makeDeveloper('x', '  ').name).toBe('Dev');
  });
});

describe('sprint planning', () => {
  it('capacity scales to team size before there is velocity, then uses average velocity', () => {
    expect(sprintCapacity([], 3)).toBe(3 * CAPACITY_PER_DEV);
    expect(sprintCapacity([], 5)).toBe(5 * CAPACITY_PER_DEV);
    expect(averageVelocity([10, 12, 14])).toBe(12);
    expect(sprintCapacity([10, 12, 14], 5)).toBe(12); // velocity wins once it exists
  });

  it('planSprint opens Sprint 1, sets the goal, moves chosen stories to the board and clears the bench', () => {
    const s0 = initialScrumState();
    const chosen = ['s1', 's2'];
    const s1 = planSprint(s0, '  Book and pay  ', chosen);
    expect(s1.phase).toBe('sprint');
    expect(s1.currentSprint?.number).toBe(1);
    expect(s1.currentSprint?.goal).toBe('Book and pay'); // trimmed
    expect(s1.currentSprint?.committedStoryIds).toEqual(chosen);
    expect(s1.assignments).toEqual({});
    const onBoard = sprintStories(s1, 1);
    expect(onBoard.map((x) => x.id).sort()).toEqual(['s1', 's2']);
    expect(onBoard.every((x) => x.status === 'todo' && x.sprintNumber === 1)).toBe(true);
    expect(availableStories(s1).length).toBe(PRODUCT_BACKLOG.length - 2);
  });
});

describe('the team: assigning Developers', () => {
  it('assignDev pulls a To Do story into Doing and records who is on it', () => {
    let s = planSprint(initialScrumState(), 'g', ['s1']);
    const dev = s.team[0];
    s = assignDev(s, dev.id, 's1');
    expect(sprintStories(s, 1).find((x) => x.id === 's1')?.status).toBe('doing');
    expect(s.assignments[dev.id]).toBe('s1');
    expect(devsOnStory(s, 's1').map((d) => d.id)).toEqual([dev.id]);
    expect(benchedDevs(s).length).toBe(s.team.length - 1);
  });

  it('assignDev ignores a story that is not on the current Sprint', () => {
    let s = planSprint(initialScrumState(), 'g', ['s1']);
    s = assignDev(s, s.team[0].id, 's2'); // s2 is still in the Product Backlog
    expect(s.assignments).toEqual({});
  });

  it('unassignDev sends a Developer back to the bench', () => {
    let s = planSprint(initialScrumState(), 'g', ['s1']);
    const dev = s.team[0];
    s = assignDev(s, dev.id, 's1');
    s = unassignDev(s, dev.id);
    expect(s.assignments[dev.id]).toBeUndefined();
    expect(benchedDevs(s).length).toBe(s.team.length);
  });

  it('setTeam replaces the roster and drops assignments for anyone removed', () => {
    let s = planSprint(initialScrumState(), 'g', ['s1']);
    const [a, b] = s.team;
    s = assignDev(assignDev(s, a.id, 's1'), b.id, 's1');
    s = setTeam(s, [a]); // remove everyone but the first Developer
    expect(s.team).toEqual([a]);
    expect(s.assignments[a.id]).toBe('s1'); // survivor keeps their work
    expect(s.assignments[b.id]).toBeUndefined(); // removed Developer's assignment is gone
  });

  it('roster bounds are sane', () => {
    expect(MIN_TEAM).toBeLessThan(MAX_TEAM);
    expect(DEFAULT_TEAM.length).toBeGreaterThanOrEqual(MIN_TEAM);
    expect(DEFAULT_TEAM.length).toBeLessThanOrEqual(MAX_TEAM);
  });
});

describe('sprint execution', () => {
  it('devRoll is deterministic and in 1..2', () => {
    expect(devRoll(1, 1, 0)).toBe(devRoll(1, 1, 0));
    const r = devRoll(1, 1, 0);
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThanOrEqual(2);
  });

  it('only assigned Developers do work - a Doing story with an empty bench burns nothing', () => {
    let s = startStory(planSprint(initialScrumState(), 'g', ['s1']), 's1'); // Doing, but nobody assigned
    const before = sprintStories(s, 1).find((x) => x.id === 's1')!.effortRemaining;
    s = runSprintDay(s);
    expect(sprintStories(s, 1).find((x) => x.id === 's1')!.effortRemaining).toBe(before);
  });

  it('runSprintDay burns effort on assigned stories, advances the day and records burndown', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2'); // 8 pts, full swarm
    expect(s.currentSprint?.burndown).toEqual([8]);
    s = runSprintDay(s);
    expect(s.currentSprint!.day).toBe(2);
    expect(s.currentSprint!.burndown.length).toBe(2);
    expect(sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining).toBeLessThan(8);
  });

  it('swarming finishes work faster than a single Developer', () => {
    const oneDev = (() => {
      let s = planSprint(initialScrumState(), 'g', ['s2']);
      s = assignDev(s, s.team[0].id, 's2');
      s = runSprintDay(runSprintDay(s));
      return sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining;
    })();
    const swarmed = (() => {
      let s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2');
      s = runSprintDay(runSprintDay(s));
      return sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining;
    })();
    expect(swarmed).toBeLessThan(oneDev);
  });

  it('a story reaching zero effort becomes Done and frees its Developers to the bench', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 3 pts, whole team on it
    for (let i = 0; i < 6 && s.currentSprint && !isSprintOver(s.currentSprint); i++) s = runSprintDay(s);
    expect(sprintStories(s, 1).find((x) => x.id === 's3')?.status).toBe('done');
    expect(benchedDevs(s).length).toBe(s.team.length); // everyone freed once it's Done
  });

  it('reviewSprint records velocity, returns unfinished work, clears the bench, and opens the Review', () => {
    // Commit three stories but only ever work one; the other two stay unfinished.
    let s = planSprint(initialScrumState(), 'partial', ['s2', 's7', 's9']); // 8+8+8
    s = assignDev(s, s.team[0].id, 's2');
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    const delivered = deliveredPoints(s, 1);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.velocity).toEqual([delivered]);
    expect(s.assignments).toEqual({});
    const backlogIds = availableStories(s).map((x) => x.id);
    expect(backlogIds).toContain('s7');
    expect(backlogIds).toContain('s9');
  });
});

describe('review and retrospective', () => {
  it('sprintGoalMet is true only when every committed story reached Done', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 3 pts
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
    let s = reviewSprint(swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'));
    s = startNextSprint(s, RETRO_IMPROVEMENTS[0]);
    expect(s.phase).toBe('planning');
    expect(s.currentSprint).toBeNull();
    expect(s.improvements).toEqual([RETRO_IMPROVEMENTS[0]]);
    expect(s.sprints).toHaveLength(1);
  });
});

describe('renegotiating scope mid-sprint (velocity can exceed the forecast)', () => {
  it('addToSprint pulls a backlog item onto the board without changing the forecast', () => {
    let s = planSprint(initialScrumState(), 'g', ['s3']); // forecast 3 pts
    expect(forecastPoints(s, 1)).toBe(3);
    s = addToSprint(s, 's1'); // pull in a 5-pt story mid-sprint
    expect(forecastPoints(s, 1)).toBe(3); // commitment unchanged
    expect(sprintStories(s, 1).map((x) => x.id).sort()).toEqual(['s1', 's3']);
    expect(sprintStories(s, 1).find((x) => x.id === 's1')?.status).toBe('todo');
  });

  it('finishing the forecast then pulling more lets delivery exceed the forecast', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // forecast 3 pts, swarmed
    s = runSprintDay(s); // a full 5-dev swarm burns >=5/day, so the 3-pt story is Done and the team is freed
    expect(sprintStories(s, 1).find((x) => x.id === 's3')?.status).toBe('done');
    s = swarm(addToSprint(s, 's5'), 's5'); // pull in another 3-pt story and swarm the now-free team onto it
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    expect(deliveredPoints(s, 1)).toBeGreaterThan(forecastPoints(s, 1));
    expect(sprintGoalMet(s, 1)).toBe(true); // committed story still Done
  });

  it('Sprint Goal depends on the committed forecast, not on extra pulled-in work', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 3 pts committed, swarmed
    s = addToSprint(s, 's2'); // 8 pts extra, nobody assigned to it
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    expect(sprintGoalMet(s, 1)).toBe(true); // committed story done => goal met
  });
});
