import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { suggestSprintGoal, rewordSprintGoal } from './engine';

// "The existing Sprint Goal text ('Our goal is to make the park pleasanter to be in so that visitors
// stay longer') looks like a generic park-improvement goal rather than something tied to the Big Cats
// Product Goal" (sm23, sm26, sm27). There was no case for habitats, so a Sprint of Lion Enclosure fell
// through to the line for anything else.

const habitats = initialZooState(1).backlog.filter((it) => it.category === 'enclosure');

describe('the Sprint Goal drafted for habitats', () => {
  it('names the habitat and the animals it is for', () => {
    const lion = habitats.find((h) => /lion/i.test(h.name))!;
    expect(suggestSprintGoal([lion])).toBe('Our goal is to build the lion enclosure so that the lions can go on show next');
  });
  it('names two habitats and both animals', () => {
    const two = habitats.slice(0, 2);
    const goal = suggestSprintGoal(two);
    expect(goal).not.toMatch(/pleasanter/);
    for (const h of two) expect(goal).toContain(h.name.toLowerCase());
  });
  it('keeps the animals when it rewords a goal of the team’s own', () => {
    const lion = habitats.find((h) => /lion/i.test(h.name))!;
    expect(rewordSprintGoal('Build the lion enclosure', [lion]).goal).toBe('Our goal is to build the lion enclosure so that the lions can go on show next');
  });
});
