import { describe, it, expect } from 'vitest';
import { initialZooState, zooCapacity, STARTER_CAPACITY } from './config';
import {
  planSprint, buildItem, openItem, reviewSprint, startNextSprint, acceptSignal,
  setProductGoal, openZoo, availableItems, productGoalProgress,
} from './engine';
import type { ZooGameState } from './types';

/** Commit ids, build them all, and open (release) them. */
function buildAndOpen(state: ZooGameState, ids: string[]): ZooGameState {
  let s = planSprint(state, ids);
  for (const id of ids) s = openItem(buildItem(s, id), id);
  return s;
}

describe('zoo game: setup', () => {
  it('starts with a rough backlog, a Product Goal, a DoD, and drifted attendance', () => {
    const s = initialZooState(1);
    expect(s.phase).toBe('intro');
    expect(s.productGoal.length).toBeGreaterThan(0);
    expect(s.definitionOfDone.length).toBeGreaterThan(0);
    expect(s.backlog.length).toBeGreaterThan(0);
    expect(s.backlog.every((i) => i.status === 'backlog')).toBe(true);
    expect(s.zones).toContain('Big Cats');
    expect(s.attendance.families).toBeGreaterThan(0);
    expect(s.velocity).toEqual([]);
  });

  it('is deterministic per game seed (taste jitter and drift)', () => {
    expect(initialZooState(7)).toEqual(initialZooState(7));
    // A different seed jitters the appeal differently.
    expect(initialZooState(7).backlog[0].appeal).not.toEqual(initialZooState(8).backlog[0].appeal);
  });

  it('editing the Product Goal keeps a non-empty value', () => {
    const s = setProductGoal(initialZooState(1), 'A calm, accessible park older visitors love.');
    expect(s.productGoal).toContain('accessible');
    expect(setProductGoal(s, '   ').productGoal).toBe(s.productGoal); // blank ignored
  });

  it('capacity is the starter guess, then average velocity', () => {
    expect(zooCapacity([])).toBe(STARTER_CAPACITY);
    expect(zooCapacity([10, 20])).toBe(15);
  });
});

describe('zoo game: the Sprint loop', () => {
  it('plans, builds, opens, and reviews with a real visitor simulation', () => {
    let s = initialZooState(1);
    s = buildAndOpen(s, ['lion', 'tiger', 'kiosk']);
    expect(openZoo(s).map((i) => i.id).sort()).toEqual(['kiosk', 'lion', 'tiger']);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.lastReview).not.toBeNull();
    expect(s.lastReview!.overallHappiness).toBeGreaterThan(0); // visitors enjoyed the exhibits
    expect(s.velocity).toEqual([8 + 8 + 5]); // points delivered this Sprint
    // Word of mouth moved attendance for next Sprint.
    expect(s.attendance).toEqual(s.lastReview!.nextAttendance);
  });

  it('velocity counts Done work; releasing (open) is what the visitors see', () => {
    // Build but do NOT open: Done delivers velocity, but nothing is released to visitors.
    let s = planSprint(initialZooState(1), ['lion', 'penguins']);
    s = buildItem(buildItem(s, 'lion'), 'penguins');
    expect(openZoo(s)).toHaveLength(0);
    s = reviewSprint(s);
    expect(s.velocity[0]).toBe(16); // points Done
    expect(s.lastReview!.segments.every((seg) => seg.happiness === 0)).toBe(true); // no open exhibits
  });

  it('unfinished committed items return to the Backlog', () => {
    let s = planSprint(initialZooState(1), ['lion', 'tiger', 'penguins']);
    s = openItem(buildItem(s, 'lion'), 'lion'); // only lion finished
    s = reviewSprint(s);
    const tiger = s.backlog.find((i) => i.id === 'tiger')!;
    expect(tiger.status).toBe('backlog');
    expect(tiger.sprintNumber).toBeNull();
    expect(s.velocity[0]).toBe(8); // only the lion's points
  });

  it('runs across Sprints, carrying velocity and the growing zoo', () => {
    let s = initialZooState(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'kiosk']));
    s = startNextSprint(s, 'Swarm on fewer exhibits at once');
    expect(s.phase).toBe('planning');
    expect(s.sprintNumber).toBe(2);
    expect(s.improvements).toHaveLength(1);
    s = reviewSprint(buildAndOpen(s, ['tiger', 'penguins']));
    expect(s.velocity).toHaveLength(2);
    expect(openZoo(s).map((i) => i.id).sort()).toEqual(['kiosk', 'lion', 'penguins', 'tiger']);
  });
});

describe('zoo game: emergent backlog from visitor signals', () => {
  it('a zoo with exhibits but no food produces a food signal, which the PO can accept', () => {
    let s = initialZooState(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'tiger', 'penguins'])); // no food amenity
    const food = s.signals.find((sig) => sig.drivenBy === 'unmet:food');
    expect(food).toBeTruthy();
    const before = availableItems(s).length;
    s = acceptSignal(s, s.signals.indexOf(food!));
    expect(availableItems(s).length).toBe(before + 1);
    expect(availableItems(s).some((i) => i.services === 'food')).toBe(true);
  });

  it('ignored signals persist and worsen across Reviews', () => {
    let s = initialZooState(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'tiger', 'penguins']));
    const first = s.signals.find((sig) => sig.drivenBy === 'unmet:food');
    expect(first).toBeTruthy();
    expect(s.signalAge['unmet:food']).toBe(1);
    // Next Sprint: do not address it (build another exhibit), review again.
    s = startNextSprint(s, 'x');
    s = reviewSprint(buildAndOpen(s, ['leopard']));
    expect(s.signalAge['unmet:food']).toBe(2);
    const second = s.signals.find((sig) => sig.drivenBy === 'unmet:food')!;
    const order = { low: 0, medium: 1, high: 2 } as const;
    expect(order[second.estimatedValue]).toBeGreaterThanOrEqual(order[first!.estimatedValue]); // louder, not quieter
  });
});

describe('zoo game: product goal progress', () => {
  it('grows as exhibits and amenities are opened', () => {
    let s = initialZooState(1);
    expect(productGoalProgress(s)).toBe(0);
    s = buildAndOpen(s, ['lion', 'tiger']);
    expect(productGoalProgress(s)).toBeGreaterThan(0);
  });
});
