import { describe, it, expect } from 'vitest';
import {
  initialScrumState, defaultDefinitionOfDone, PRODUCT_BACKLOG, totalPoints, totalValue,
  sprintCapacity, averageVelocity, CAPACITY_PER_DEV_DAY, improvementBonus, RETRO_IMPROVEMENTS,
  DEFAULT_TEAM, makeDeveloper, MIN_TEAM, MAX_TEAM, SPRINT_LENGTH_OPTIONS, DEV_DAY_RATIO,
  suggestSprintGoal, dominantTag, REFINE_COST, FIBONACCI, nearestFib, storyReady,
} from './config';
import { learningFor, LEARNING } from './learning';
import { ACTIVE_THEME, THEMES, getTheme, bookingTheme, missionTheme } from './theme';
import { nextSatisfaction, generateEvent, currentEventCard, chooseEvent, setSprintLength } from './engine';
import {
  planSprint, moveBacklogStory, splitStory, estimateStory, pokerHand, estimateSuggestion,
  availableStories, sprintStories, startStory, addToSprint,
  assignDev, unassignDev, setTeam, setDefinitionOfDone, benchedDevs, devsOnStory,
  clearImpediment, generateImpediment, generateChangeRequest, acceptChange, declineChange,
  runSprintDay, runRemainingDays,
  reviewSprint, startNextSprint, sprintGoalMet, forecastPoints,
  devRoll, isSprintOver, deliveredPoints, incrementStories, sprintOutlook,
  productGoalTotalValue, productGoalDeliveredValue, productGoalProgress, productGoalReachable, endGame,
  sprintScore,
} from './engine';

/** Put the whole team on one story (a full swarm). */
const swarm = (s: ReturnType<typeof initialScrumState>, storyId: string) =>
  s.team.reduce((acc, d) => assignDev(acc, d.id, storyId), s);

/** Run (clearing each day's impediment) until a story is Done or the timebox ends. */
const runUntilDone = (s: ReturnType<typeof initialScrumState>, storyId: string) => {
  for (let i = 0; i < 30 && s.currentSprint && !isSprintOver(s.currentSprint)
    && sprintStories(s, s.currentSprint.number).find((x) => x.id === storyId)?.status !== 'done'; i++) {
    s = runSprintDay(clearImpediment(s));
  }
  return s;
};

describe('scrum game scaffold', () => {
  it('initial state starts at intro with the full backlog, the artifacts, a team and a Scrum Master', () => {
    const s = initialScrumState();
    expect(s.phase).toBe('intro');
    expect(s.productGoal.length).toBeGreaterThan(0);
    expect(s.definitionOfDone.length).toBeGreaterThan(0);
    expect(s.productBacklog.length).toBe(PRODUCT_BACKLOG.length);
    expect(s.productBacklog.every((x) => x.status === 'backlog' && x.sprintNumber === null)).toBe(true);
    expect(s.team.length).toBe(DEFAULT_TEAM.length);
    expect(s.scrumMaster.length).toBeGreaterThan(0);
    expect(s.productOwner.length).toBeGreaterThan(0);
    expect(s.assignments).toEqual({}); // everyone on the bench
    expect(s.currentImpediment).toBeNull();
    expect(s.changeRequest).toBeNull();
    expect(s.sprints).toEqual([]);
    expect(s.velocity).toEqual([]);
  });

  it('DoD is domain-neutral (not software-specific)', () => {
    const dod = defaultDefinitionOfDone();
    expect(dod.length).toBeGreaterThan(0);
    for (const c of dod) expect(c.label).not.toMatch(/code|unit test|deploy|merge/i);
  });

  it('setDefinitionOfDone trims labels and drops empty ones (the team owns the DoD)', () => {
    const s = setDefinitionOfDone(initialScrumState(), [
      { id: 'a', label: '  Tested  ' },
      { id: 'b', label: '   ' },
      { id: 'c', label: 'Signed off by the PO' },
    ]);
    expect(s.definitionOfDone).toEqual([
      { id: 'a', label: 'Tested' },
      { id: 'c', label: 'Signed off by the PO' },
    ]);
  });

  it('backlog totals sum points and value', () => {
    const stories = initialScrumState().productBacklog;
    expect(totalPoints(stories)).toBe(PRODUCT_BACKLOG.reduce((n, s) => n + s.points, 0));
    expect(totalValue(stories)).toBe(PRODUCT_BACKLOG.reduce((n, s) => n + s.value, 0));
  });

  it('suggestSprintGoal drafts an outcome-shaped goal with a tag-derived value clause', () => {
    expect(suggestSprintGoal([])).toBe('');
    const outcomes = { core: 'customers can book with confidence', revenue: 'the business grows revenue' };
    // The capability comes from the items (lower-cased into the sentence); the value
    // clause is pre-filled from the selection's dominant (highest-value) tag.
    expect(suggestSprintGoal([{ title: 'Book a slot', value: 10, tags: ['core'] }], outcomes))
      .toBe('Our goal is to deliver book a slot so that customers can book with confidence');
    expect(suggestSprintGoal(
      [{ title: 'Browse', value: 8, tags: ['core'] }, { title: 'Pay', value: 9, tags: ['revenue'] }],
      outcomes,
    )).toBe('Our goal is to deliver browse and pay so that the business grows revenue'); // revenue 9 > core 8
    // Falls back gracefully when the selection has no known tag outcome.
    expect(suggestSprintGoal([{ title: 'Admin', value: 5, tags: ['ops'] }], outcomes))
      .toBe('Our goal is to deliver admin so that we move closer to the Product Goal');
  });

  it('dominantTag picks the highest-value agenda in a selection', () => {
    expect(dominantTag([])).toBeNull();
    expect(dominantTag([{ value: 8, tags: ['core'] }, { value: 3, tags: ['revenue'] }])).toBe('core');
    expect(dominantTag([{ value: 3, tags: ['core'] }, { value: 9, tags: ['revenue'] }])).toBe('revenue');
  });

  it('makeDeveloper derives distinct two-letter initials', () => {
    expect(makeDeveloper('x', 'Robin').initials).toBe('RO');
    expect(makeDeveloper('x', 'Riley').initials).toBe('RI');
    expect(makeDeveloper('x', '  ').name).toBe('Dev');
  });
});

describe('theme config (one engine, many skins)', () => {
  it('the active theme is complete and drives the initial state', () => {
    expect(ACTIVE_THEME.items.length).toBeGreaterThan(0);
    for (const it of ACTIVE_THEME.items) {
      expect(it.visualKey.length).toBeGreaterThan(0);
      expect(it.effort).toBeGreaterThan(0);
      expect(it.value).toBeGreaterThan(0);
    }
    const s = initialScrumState();
    expect(s.productGoal).toBe(ACTIVE_THEME.productGoal);
    expect(s.productBacklog.length).toBe(ACTIVE_THEME.items.length);
    expect(s.theme.buildMetaphor).toBe(ACTIVE_THEME.buildMetaphor);
    // Every backlog story carries its component key so the build canvas can draw it.
    expect(s.productBacklog.every((x) => !!x.visualKey)).toBe(true);
  });
});

describe('sprint planning', () => {
  it('capacity scales to team size and Sprint length before there is velocity, then uses average velocity', () => {
    expect(sprintCapacity([], 5, 10)).toBe(Math.round(5 * 10 * CAPACITY_PER_DEV_DAY));
    expect(sprintCapacity([], 3, 5)).toBe(Math.round(3 * 5 * CAPACITY_PER_DEV_DAY));
    expect(sprintCapacity([], 5, 5)).toBeLessThan(sprintCapacity([], 5, 10)); // longer Sprint, more capacity
    expect(averageVelocity([10, 12, 14])).toBe(12);
    expect(sprintCapacity([10, 12, 14], 5, 10)).toBe(12); // velocity wins once it exists
  });

  it('planSprint honours the chosen Sprint length and remembers it for next time', () => {
    const s = planSprint(initialScrumState(), 'g', ['s1'], 18);
    expect(s.currentSprint?.length).toBe(18);
    expect(s.currentSprint?.devDays).toBe(18);
    expect(s.sprintLength).toBe(18);
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

describe('Sprint length: development days vs the calendar container', () => {
  it('every length option leaves ~0.9 of the working days for development', () => {
    for (const o of SPRINT_LENGTH_OPTIONS) {
      expect(o.devDays).toBeCloseTo(o.workingDays * DEV_DAY_RATIO, 5);
    }
    expect(SPRINT_LENGTH_OPTIONS.find((o) => o.workingDays === 10)?.devDays).toBe(9);
    expect(SPRINT_LENGTH_OPTIONS.find((o) => o.workingDays === 5)?.devDays).toBe(4.5);
  });

  it('a fractional Sprint length rounds up to a day-slot count with a half day at the end', () => {
    const s = planSprint(initialScrumState(), 'g', ['s1'], 4.5); // one-week Sprint
    expect(s.currentSprint?.length).toBe(5); // five day-slots to play
    expect(s.currentSprint?.devDays).toBe(4.5); // of which the last is a half day
  });

  it('the fractional final day applies half the effort of a full day', () => {
    const rem = (devDays: number) => {
      let s = swarm(planSprint(initialScrumState(), 'g', ['s2'], devDays), 's2'); // 21-pt story
      s = runSprintDay(clearImpediment(s)); // day 1 = the only (final) day
      return 21 - sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining;
    };
    const full = rem(1); // devDays 1 -> a full final day
    const half = rem(0.5); // devDays 0.5 -> a half final day (same dice, same day)
    expect(half).toBe(Math.floor(full * 0.5));
    expect(half).toBeLessThan(full);
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
    let s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2'); // 21 pts, full swarm
    expect(s.currentSprint?.burndown).toEqual([21]);
    s = runSprintDay(clearImpediment(s));
    expect(s.currentSprint!.day).toBe(2);
    expect(s.currentSprint!.burndown.length).toBe(2);
    expect(sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining).toBeLessThan(21);
  });

  it('swarming finishes work faster than a single Developer', () => {
    const rem = (assignAll: boolean) => {
      let s = planSprint(initialScrumState(), 'g', ['s2']);
      s = assignAll ? swarm(s, 's2') : assignDev(s, s.team[0].id, 's2');
      s = runSprintDay(clearImpediment(s));
      s = runSprintDay(clearImpediment(s));
      return sprintStories(s, 1).find((x) => x.id === 's2')!.effortRemaining;
    };
    expect(rem(true)).toBeLessThan(rem(false));
  });

  it('a story reaching zero effort becomes Done and frees its Developers to the bench', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 8 pts, whole team on it
    s = runUntilDone(s, 's3');
    expect(sprintStories(s, 1).find((x) => x.id === 's3')?.status).toBe('done');
    expect(benchedDevs(s).length).toBe(s.team.length); // everyone freed once it's Done
  });

  it('a partially-done story returns to the Backlog re-estimated to the work remaining', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2'); // 21 pts, swarmed
    s = runSprintDay(clearImpediment(s)); // burn some effort, not finished
    const before = sprintStories(s, 1).find((x) => x.id === 's2')!;
    expect(before.status).not.toBe('done');
    expect(before.effortRemaining).toBeLessThan(21); // progress made
    s = reviewSprint(s);
    const returned = availableStories(s).find((x) => x.id === 's2')!;
    expect(returned.points).toBe(before.effortRemaining); // re-estimated to the work left
    expect(returned.points).toBeLessThan(21); // ...which is smaller than the original
    expect(returned.value).toBe(before.value); // value is unchanged; only the size shrinks
  });

  it('reviewSprint records velocity as Done points, returns unfinished work, and opens the Review', () => {
    // Commit three stories but only ever put one Developer on one of them; the rest stay unfinished.
    let s = planSprint(initialScrumState(), 'partial', ['s2', 's7', 's9']);
    s = assignDev(s, s.team[0].id, 's2');
    while (s.currentSprint && !isSprintOver(s.currentSprint)) s = runSprintDay(s);
    const delivered = deliveredPoints(s, 1);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.velocity).toEqual([delivered]); // velocity is the Done (DoD-meeting) work
    expect(s.assignments).toEqual({});
    expect(s.currentImpediment).toBeNull();
    const backlogIds = availableStories(s).map((x) => x.id);
    expect(backlogIds).toContain('s7');
    expect(backlogIds).toContain('s9');
  });
});

describe('the Product Owner: ordering and change requests', () => {
  it('splitStory refines a too-big item into two smaller, Ready items in its place', () => {
    const base = initialScrumState();
    const big = base.productBacklog.find((s) => s.points === 21)!; // e.g. s2
    const s = splitStory(base, big.id);
    const parts = s.productBacklog.filter((x) => x.id === `${big.id}a` || x.id === `${big.id}b`);
    expect(parts.length).toBe(2);
    // Points and value are preserved across the split, and both parts are smaller.
    expect(parts.reduce((n, x) => n + x.points, 0)).toBe(big.points);
    expect(parts.reduce((n, x) => n + x.value, 0)).toBe(big.value);
    for (const p of parts) expect(p.points).toBeLessThan(big.points);
    // The original is gone; the parts sit where it was; total backlog grows by one.
    expect(s.productBacklog.some((x) => x.id === big.id)).toBe(false);
    expect(s.productBacklog.length).toBe(base.productBacklog.length + 1);
  });

  it('splitting during Refinement (before a Sprint runs) is free - nothing to charge', () => {
    const base = initialScrumState();
    const big = base.productBacklog.find((s) => s.points === 21)!;
    expect(splitStory(base, big.id).currentSprint).toBeNull();
  });

  it('splitting mid-Sprint charges refinement effort against the next Run Day, then clears it', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3');
    const big = availableStories(s).find((x) => x.points === 21)!; // still in the Backlog
    s = splitStory(s, big.id);
    expect(s.currentSprint!.refinementLoad).toBe(REFINE_COST);
    s = runSprintDay(s);
    expect(s.lastDay!.refinementCost).toBeGreaterThan(0); // refinement took some of the day
    expect(s.currentSprint!.refinementLoad).toBe(0); // charged and cleared
  });

  it('a Run Day with no mid-Sprint refinement costs the team nothing', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3');
    s = runSprintDay(s);
    expect(s.lastDay!.refinementCost).toBe(0);
  });

  it('the Backlog ships with some un-sized items the team must estimate', () => {
    const s = initialScrumState();
    const unsized = s.productBacklog.filter((x) => !x.estimated);
    expect(unsized.length).toBeGreaterThan(0);
    // Un-sized items have no estimate yet and are not Ready, but carry real work.
    for (const x of unsized) {
      expect(x.points).toBe(0);
      expect(storyReady(x)).toBe(false);
      expect(x.trueEffort).toBeGreaterThan(0);
    }
  });

  it('a poker hand is deterministic, on the scale, and clusters near the real size', () => {
    const s = initialScrumState();
    const item = s.productBacklog.find((x) => !x.estimated)!;
    const hand = pokerHand(item, s.team);
    expect(hand).toEqual(pokerHand(item, s.team)); // deterministic
    expect(hand.length).toBe(s.team.length);
    for (const { card } of hand) expect(FIBONACCI).toContain(card);
    // The suggestion is a sensible size near the item's true effort.
    const suggestion = estimateSuggestion(hand);
    expect(FIBONACCI).toContain(suggestion);
    expect(Math.abs(FIBONACCI.indexOf(suggestion) - FIBONACCI.indexOf(nearestFib(item.trueEffort)))).toBeLessThanOrEqual(1);
  });

  it('estimateStory sizes an un-sized item, making it Ready (if small enough)', () => {
    const s0 = initialScrumState();
    const small = s0.productBacklog.find((x) => !x.estimated && x.trueEffort <= 13)!;
    const s = estimateStory(s0, small.id, 8);
    const after = s.productBacklog.find((x) => x.id === small.id)!;
    expect(after.estimated).toBe(true);
    expect(after.points).toBe(8);
    expect(storyReady(after)).toBe(true);
    // Building still consumes the real work, not the estimate.
    expect(after.trueEffort).toBe(small.trueEffort);
  });

  it('estimateStory rejects an off-scale estimate and re-estimating a sized item', () => {
    const s0 = initialScrumState();
    const unsized = s0.productBacklog.find((x) => !x.estimated)!;
    expect(estimateStory(s0, unsized.id, 7)).toBe(s0); // 7 is not on the Fibonacci scale
    const sized = s0.productBacklog.find((x) => x.estimated)!;
    expect(estimateStory(s0, sized.id, 5)).toBe(s0); // already estimated - no change
  });

  it('an under-estimate leaves the burndown lagging the forecast (estimates are forecasts)', () => {
    // Size a big item deliberately too small, plan it, and swarm one day.
    const s0 = initialScrumState();
    const big = s0.productBacklog.find((x) => !x.estimated && x.trueEffort >= 21)!;
    let s = estimateStory(s0, big.id, 3); // wildly optimistic
    s = swarm(planSprint(s, 'g', [big.id]), big.id);
    const committed = s.currentSprint!.burndown[0];
    s = runSprintDay(s);
    const story = s.productBacklog.find((x) => x.id === big.id)!;
    // The forecast said 3, but the real work is 21, so it is nowhere near Done.
    expect(committed).toBe(3);
    expect(story.status).not.toBe('done');
    expect(story.effortRemaining).toBeGreaterThan(3);
  });

  it('moveBacklogStory re-prioritises an unplanned story', () => {
    const before = availableStories(initialScrumState()).map((x) => x.id);
    const s = moveBacklogStory(initialScrumState(), before[1], 'up');
    expect(availableStories(s).slice(0, 2).map((x) => x.id)).toEqual([before[1], before[0]]);
  });

  it('the Increment is the Done work, and velocity counts it (no separate acceptance gate)', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3', 's5']), 's3'); // 8 + 8
    s = runUntilDone(s, 's3');
    s = swarm(s, 's5');
    s = runUntilDone(s, 's5');
    s = reviewSprint(s);
    expect(deliveredPoints(s, 1)).toBe(16); // both finished = the Increment
    expect(incrementStories(s, 1).map((x) => x.id).sort()).toEqual(['s3', 's5']);
    expect(s.velocity).toEqual([16]); // recorded at the Review
  });

  it('generateChangeRequest is deterministic and surfaces mid-Sprint when present', () => {
    for (let n = 1; n <= 5; n++) {
      expect(generateChangeRequest(n, 10)).toEqual(generateChangeRequest(n, 10));
    }
    const some = Array.from({ length: 8 }, (_, i) => generateChangeRequest(i + 1, 10));
    const cr = some.find((x) => x !== null)!;
    expect(cr.day).toBeGreaterThanOrEqual(2);
    expect(cr.day).toBeLessThanOrEqual(9);
  });

  it('accepting a change request pulls it onto the board without touching the commitment', () => {
    // Find a Sprint number whose change request exists, and plan it.
    let n = 1;
    while (!generateChangeRequest(n, 10) && n < 30) n++;
    let s = initialScrumState();
    for (let k = 1; k < n; k++) s = startNextSprint(reviewSprint(planSprint(s, 'x', [])), 'i');
    s = planSprint(s, 'g', ['s1']);
    expect(s.changeRequest).not.toBeNull();
    const forecast = forecastPoints(s, s.currentSprint!.number);
    const cr = s.changeRequest!;
    s = acceptChange(s);
    expect(s.changeRequest).toBeNull();
    expect(sprintStories(s, s.currentSprint!.number).some((x) => x.id === cr.id)).toBe(true);
    expect(forecastPoints(s, s.currentSprint!.number)).toBe(forecast); // commitment unchanged
  });

  it('declining a change request protects the Sprint Goal (nothing added)', () => {
    let n = 1;
    while (!generateChangeRequest(n, 10) && n < 30) n++;
    let s = initialScrumState();
    for (let k = 1; k < n; k++) s = startNextSprint(reviewSprint(planSprint(s, 'x', [])), 'i');
    s = planSprint(s, 'g', ['s1']);
    const before = sprintStories(s, s.currentSprint!.number).length;
    s = declineChange(s);
    expect(s.changeRequest).toBeNull();
    expect(sprintStories(s, s.currentSprint!.number).length).toBe(before);
  });
});

describe('stakeholders and satisfaction', () => {
  it('the theme has stakeholders with conflicting agendas, seeded neutral', () => {
    expect(ACTIVE_THEME.stakeholders.length).toBeGreaterThanOrEqual(2);
    const s = initialScrumState();
    for (const sh of ACTIVE_THEME.stakeholders) expect(s.satisfaction[sh.id]).toBe(50);
  });

  it('delivering to one agenda raises that stakeholder and neglects the others', () => {
    // Finish a revenue story (Pay, tag "revenue") - pleases The Business, neglects the rest.
    let s = swarm(planSprint(initialScrumState(), 'g', ['s7']), 's7'); // s7 = Pay, revenue
    s = runUntilDone(s, 's7');
    const before = { ...s.satisfaction };
    const next = nextSatisfaction(s, 1);
    expect(next.business).toBeGreaterThan(before.business); // revenue is their agenda
    expect(next.trust).toBeLessThan(before.trust); // revenue weight 0 -> neglect decay
    // The Business benefits far more than anyone else from a revenue Sprint.
    expect(next.business - before.business).toBeGreaterThan(next.customers - before.customers);
  });
});

describe('event-card dilemmas', () => {
  it('generateEvent is deterministic, and some Sprints have a card', () => {
    for (let n = 1; n <= 5; n++) expect(generateEvent(n, 9)).toEqual(generateEvent(n, 9));
    const some = Array.from({ length: 12 }, (_, i) => generateEvent(i + 1, 9));
    expect(some.some((x) => x !== null)).toBe(true);
  });

  it('choosing an event applies its effects (satisfaction shift and any scope injection)', () => {
    // Find a Sprint whose event injects scope, and plan it so the card is live.
    let n = 1;
    const injects = (id: string | null) => {
      if (!id) return false;
      const card = ACTIVE_THEME.events.find((e) => e.id === id)!;
      return card.choices.some((c) => c.effects.scopeInjection);
    };
    while (n < 40 && !injects(generateEvent(n, 9)?.cardId ?? null)) n++;
    const ev = generateEvent(n, 9)!;
    let s = initialScrumState();
    for (let k = 1; k < n; k++) s = startNextSprint(reviewSprint(planSprint(s, 'x', [])), 'i');
    s = planSprint(s, 'g', ['s3']);
    expect(s.currentEvent?.cardId).toBe(ev.cardId);
    const card = currentEventCard(s)!;
    const idx = card.choices.findIndex((c) => c.effects.scopeInjection);
    const inject = card.choices[idx].effects.scopeInjection!;
    const before = { ...s.satisfaction };
    s = chooseEvent(s, idx);
    expect(s.currentEvent).toBeNull();
    expect(s.eventLesson).toBe(card.choices[idx].lesson);
    expect(sprintStories(s, s.sprints.length + 1).some((x) => x.id === inject)).toBe(true); // pulled in
    // At least one stakeholder moved.
    expect(Object.keys(before).some((id) => s.satisfaction[id] !== before[id])).toBe(true);
  });
});

describe('themes: one engine, many skins', () => {
  it('every theme is well-formed (12 items, conflicting stakeholders, events, un-sized slots)', () => {
    for (const t of THEMES) {
      expect(t.items.length).toBe(12);
      expect(t.stakeholders.length).toBeGreaterThanOrEqual(2);
      expect(t.events.length).toBeGreaterThan(0);
      expect(t.items.some((i) => i.unsized)).toBe(true);
      // Every event's scope injection points at a real item in the same theme.
      const ids = new Set(t.items.map((i) => i.id));
      for (const ev of t.events) {
        for (const c of ev.choices) {
          if (c.effects.scopeInjection) expect(ids.has(c.effects.scopeInjection)).toBe(true);
        }
      }
      // Every tag an item uses has an outcome clause, so a suggested Goal always
      // has a value to pre-fill.
      for (const it of t.items) {
        for (const tag of it.tags ?? []) expect(t.tagOutcomes[tag]).toBeTruthy();
      }
    }
  });

  it('getTheme resolves ids and falls back to booking', () => {
    expect(getTheme('mission')).toBe(missionTheme);
    expect(getTheme('booking')).toBe(bookingTheme);
    expect(getTheme('nope')).toBe(bookingTheme);
  });

  it('initialScrumState skins the whole game from the chosen theme', () => {
    const m = initialScrumState('mission');
    expect(m.theme.id).toBe('mission');
    expect(m.productGoal).toBe(missionTheme.productGoal);
    expect(m.productBacklog.map((s) => s.id)).toEqual(missionTheme.items.map((i) => i.id));
    // Satisfaction is seeded for the mission stakeholders, not the booking ones.
    for (const sh of missionTheme.stakeholders) expect(m.satisfaction[sh.id]).toBe(50);
    expect(m.satisfaction.business).toBeUndefined();
  });

  it('the mission theme plays through the same engine: satisfaction and events resolve from it', () => {
    // Deliver a propulsion item (Main engine, m2) and Mission Control should rise.
    let s = swarm(planSprint(initialScrumState('mission'), 'g', ['m2']), 'm2'); // m2 = Main engine, propulsion
    s = runUntilDone(s, 'm2');
    const before = { ...s.satisfaction };
    const next = nextSatisfaction(s, 1);
    expect(next.mission).toBeGreaterThan(before.mission); // propulsion is Mission Control's agenda
    // An event drawn while the mission theme is active is one of the mission cards.
    const ev = generateEvent(1, 9, missionTheme.events);
    if (ev) expect(missionTheme.events.some((e) => e.id === ev.cardId)).toBe(true);
  });
});

describe('the Daily Scrum inspection (sprintOutlook)', () => {
  it('reads on-track at the start, and behind when the committed work stalls', () => {
    // Commit a small, Ready story; at day 1 (nothing burned) it is on or near the ideal.
    const s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 8 pts committed
    const day1 = sprintOutlook(s)!;
    expect(day1.remaining).toBe(8);
    expect(['ahead', 'ontrack']).toContain(day1.status);

    // Commit a big story but never work it - by late in the Sprint it is well behind.
    let stuck = planSprint(initialScrumState(), 'g', ['s2']); // 21 pts, nobody assigned
    for (let i = 0; i < 6 && stuck.currentSprint && !isSprintOver(stuck.currentSprint); i++) stuck = runSprintDay(stuck);
    const late = sprintOutlook(stuck)!;
    expect(late.remaining).toBe(21); // no progress
    expect(late.status).toBe('behind');
  });
});

describe('impediments and the Scrum Master', () => {
  it('generateImpediment is deterministic per (sprint, day)', () => {
    for (let d = 1; d <= 10; d++) {
      expect(generateImpediment(1, d)).toEqual(generateImpediment(1, d));
    }
    // Over a Sprint some days have impediments and some do not.
    const days = Array.from({ length: 20 }, (_, i) => generateImpediment(1, i + 1));
    expect(days.some((x) => x !== null)).toBe(true);
    expect(days.some((x) => x === null)).toBe(true);
  });

  it('a distraction always costs the team, and addressing it costs less than ignoring it', () => {
    const s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2'); // 21 pts, full swarm
    const distraction = { id: 'imp-x', kind: 'distraction' as const, title: 't', detail: 'd', addressed: false };
    const withImp = { ...s, currentImpediment: distraction };
    const noImp = sprintStories(runSprintDay({ ...s, currentImpediment: null }), 1).find((x) => x.id === 's2')!.effortRemaining;
    const remIgnored = sprintStories(runSprintDay(withImp), 1).find((x) => x.id === 's2')!.effortRemaining;
    const remAddressed = sprintStories(runSprintDay(clearImpediment(withImp)), 1).find((x) => x.id === 's2')!.effortRemaining;
    expect(remAddressed).toBeLessThan(remIgnored); // addressing burns more work than ignoring
    expect(remAddressed).toBeGreaterThan(noImp); // ...but still costs vs no impediment at all
  });

  it('an ignored blocker is a heavy drag (not a total freeze) and counts as unaddressed', () => {
    const s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2');
    const blocker = { id: 'imp-y', kind: 'blocker' as const, title: 't', detail: 'd', addressed: false, daysToResolve: 2 };
    const noImp = sprintStories(runSprintDay({ ...s, currentImpediment: null }), 1).find((x) => x.id === 's2')!.effortRemaining;
    const remIgnored = sprintStories(runSprintDay({ ...s, currentImpediment: blocker }), 1).find((x) => x.id === 's2')!.effortRemaining;
    expect(remIgnored).toBeLessThan(21); // some progress still (not frozen)
    expect(remIgnored).toBeGreaterThan(noImp); // but far less than a clear day
    const after = runSprintDay({ ...s, currentImpediment: blocker });
    expect(after.currentSprint!.impedimentsHit).toBe(1);
    expect(after.currentSprint!.impedimentsIgnored).toBe(1);
  });

  it('a blocker persists until escalated: it lifts after the resolve days, and lingers if ignored', () => {
    const s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2');
    const blocker = { id: 'imp-y', kind: 'blocker' as const, title: 't', detail: 'd', addressed: false, daysToResolve: 2 };
    // Ignore it: it carries over, still a blocker, still 2 days to resolve.
    const ignored = runSprintDay({ ...s, currentImpediment: blocker });
    expect(ignored.currentImpediment?.kind).toBe('blocker');
    expect(ignored.currentImpediment?.daysToResolve).toBe(2);
    // Escalate it two days running: after the second it is resolved (gone or a fresh roll).
    let esc: ReturnType<typeof initialScrumState> = { ...s, currentImpediment: blocker };
    esc = runSprintDay(clearImpediment(esc)); // day 1 escalated -> 1 left
    expect(esc.currentImpediment?.kind).toBe('blocker');
    expect(esc.currentImpediment?.daysToResolve).toBe(1);
    esc = runSprintDay(clearImpediment(esc)); // day 2 escalated -> resolved
    expect(esc.currentImpediment?.id).not.toBe('imp-y');
  });

  it('the burndown tracks remaining work, so it drops before any story is Done', () => {
    // One big story (21 pts), swarmed. It will not finish on day 1, but effort is spent.
    let s = swarm(planSprint(initialScrumState(), 'g', ['s2']), 's2');
    expect(s.currentSprint!.burndown).toEqual([21]);
    s = runSprintDay(clearImpediment(s));
    expect(sprintStories(s, 1).find((x) => x.id === 's2')?.status).not.toBe('done'); // still in progress
    const bd = s.currentSprint!.burndown;
    expect(bd[bd.length - 1]).toBeLessThan(21); // ...yet the burndown moved
  });

  it('runRemainingDays plays to the timebox with the Scrum Master addressing impediments', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3');
    s = runRemainingDays(s);
    expect(isSprintOver(s.currentSprint!)).toBe(true);
    expect(s.currentSprint!.impedimentsIgnored).toBe(0); // the SM addressed each one
  });
});

describe('review and retrospective', () => {
  it('sprintGoalMet is true when every committed story reached Done (meets the DoD)', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 8 pts
    expect(sprintGoalMet(s, 1)).toBe(false);
    s = runUntilDone(s, 's3');
    expect(sprintGoalMet(s, 1)).toBe(true); // Done = meets the DoD, no separate acceptance
  });

  it('improvementBonus grows with retros, capped', () => {
    expect(improvementBonus([])).toBe(0);
    expect(improvementBonus(['a'])).toBe(1);
    expect(improvementBonus(['a', 'b', 'c', 'd'])).toBe(2); // capped
  });

  it('startNextSprint carries the improvement, files the sprint, and returns to Planning (no refine step between Sprints)', () => {
    let s = reviewSprint(swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'));
    s = startNextSprint(s, RETRO_IMPROVEMENTS[0]);
    expect(s.phase).toBe('planning');
    expect(s.currentSprint).toBeNull();
    expect(s.improvements).toEqual([RETRO_IMPROVEMENTS[0]]);
    expect(s.sprints).toHaveLength(1);
  });
});

describe('learning points', () => {
  it('every learning point is well-formed and resolvable by its trigger', () => {
    for (const [trigger, point] of Object.entries(LEARNING)) {
      expect(learningFor(trigger)).toBe(point);
      expect(point.title.length).toBeGreaterThan(0);
      expect(point.body.length).toBeGreaterThan(0);
      expect(point.area).toMatch(/Scrum/);
    }
    expect(learningFor('nope')).toBeUndefined();
  });
});

describe('day summary (dice reveal) and the Sprint scorecard', () => {
  it('runSprintDay records a day summary with each Developer\'s roll and what finished', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3');
    expect(s.lastDay).toBeNull(); // nothing run yet
    s = runSprintDay(clearImpediment(s));
    expect(s.lastDay).not.toBeNull();
    expect(s.lastDay!.day).toBe(1);
    expect(s.lastDay!.rolls.length).toBe(s.team.length); // whole team was assigned
    for (const r of s.lastDay!.rolls) {
      expect(r.storyId).toBe('s3');
      expect(r.roll).toBeGreaterThanOrEqual(1);
      expect(r.roll).toBeLessThanOrEqual(2);
    }
  });

  it('a clean Sprint lights every star; a missed one scores lower', () => {
    // Clean: swarm a small story, clear impediments through to the Review.
    let good = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3');
    good = runUntilDone(good, 's3');
    good = reviewSprint(good);
    const gScore = sprintScore(good, 1);
    expect(gScore.max).toBe(4);
    expect(gScore.stars).toBe(4);

    // Missed: commit a big story, one Developer, ignore impediments - never finishes.
    let bad = planSprint(initialScrumState(), 'g', ['s2']); // 21 pts
    bad = assignDev(bad, bad.team[0].id, 's2');
    while (bad.currentSprint && !isSprintOver(bad.currentSprint)) bad = runSprintDay(bad);
    bad = reviewSprint(bad);
    const bScore = sprintScore(bad, 1);
    expect(bScore.items.find((i) => i.label === 'Sprint Goal met')!.ok).toBe(false);
    expect(bScore.stars).toBeLessThan(gScore.stars);
  });
});

describe('the Product Goal across Sprints', () => {
  it('progress tracks delivered (Done) value toward the Product Goal', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // s3 value 6
    expect(productGoalDeliveredValue(s)).toBe(0);
    expect(productGoalProgress(s)).toBe(0);
    s = runUntilDone(s, 's3');
    s = reviewSprint(s);
    const total = productGoalTotalValue(s);
    expect(productGoalDeliveredValue(s)).toBe(6);
    expect(productGoalProgress(s)).toBeCloseTo(6 / total, 5);
  });

  it('the Product Goal is reachable only once enough value is delivered', () => {
    expect(productGoalReachable(initialScrumState())).toBe(false);
    const base = initialScrumState();
    const allDone = { ...base, productBacklog: base.productBacklog.map((x) => ({ ...x, status: 'done' as const })) };
    expect(productGoalReachable(allDone)).toBe(true);
  });

  it('endGame files the reviewed Sprint and moves to the wrap-up', () => {
    let s = reviewSprint(swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'));
    s = endGame(s);
    expect(s.phase).toBe('final');
    expect(s.currentSprint).toBeNull();
    expect(s.sprints).toHaveLength(1);
  });
});

describe('renegotiating scope mid-sprint (velocity can exceed the forecast)', () => {
  it('addToSprint pulls a backlog item onto the board without changing the forecast', () => {
    let s = planSprint(initialScrumState(), 'g', ['s3']); // forecast 8 pts
    expect(forecastPoints(s, 1)).toBe(8);
    s = addToSprint(s, 's1'); // pull a 13-pt story in mid-sprint
    expect(forecastPoints(s, 1)).toBe(8); // commitment unchanged
    expect(sprintStories(s, 1).map((x) => x.id).sort()).toEqual(['s1', 's3']);
    expect(sprintStories(s, 1).find((x) => x.id === 's1')?.status).toBe('todo');
  });

  it('finishing the forecast then pulling more lets delivery exceed the forecast', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // forecast 8 pts, swarmed
    s = runUntilDone(s, 's3'); // finish the committed story; the team frees up
    expect(sprintStories(s, 1).find((x) => x.id === 's3')?.status).toBe('done');
    s = swarm(addToSprint(s, 's5'), 's5'); // pull in an 8-pt story and swarm the free team onto it
    s = runUntilDone(s, 's5');
    expect(deliveredPoints(s, 1)).toBeGreaterThan(forecastPoints(s, 1));
    expect(sprintGoalMet(s, 1)).toBe(true); // committed story is Done
  });

  it('Sprint Goal depends on the committed forecast, not on extra pulled-in work', () => {
    let s = swarm(planSprint(initialScrumState(), 'g', ['s3']), 's3'); // 8 pts committed, swarmed
    s = addToSprint(s, 's2'); // 21 pts extra, nobody assigned to it
    s = runUntilDone(s, 's3');
    expect(sprintGoalMet(s, 1)).toBe(true); // committed story Done => goal met
  });
});

describe('the Sprint length is a fixed cadence', () => {
  it('is agreed before the first Sprint, and only a Retrospective changes it after that', () => {
    // See docs/SCRUM_MODEL.md: a Sprint is a fixed-length container, so its length is never a
    // Sprint Planning decision - sizing the box to the work is backwards.
    let s = initialScrumState();
    s = setSprintLength(s, 8);
    expect(s.sprintLength).toBe(8);

    // planning cannot change it
    const planning = { ...s, phase: 'planning' as const };
    expect(setSprintLength(planning, 12).sprintLength).toBe(8);

    // nor mid-Sprint
    const running = planSprint(s, 'Our goal is to deliver booking so that customers can book', [], 8);
    expect(setSprintLength({ ...running, phase: 'sprint' }, 12).sprintLength).toBe(8);

    // the Retrospective can, for the Sprint that follows
    expect(setSprintLength({ ...running, phase: 'retro' }, 12).sprintLength).toBe(12);
  });
});
