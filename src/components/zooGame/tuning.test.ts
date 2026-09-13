import { describe, it, expect, beforeEach } from 'vitest';
import { DIALS, applyTuning, tune } from './tuning';
import { initialZooState } from './config';
import { reviewSprint } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// The numbers are a trainer's to turn. The lessons are not.
//
// The same bargain as the teaching copy: the code holds the defaults, an override is a layer on
// top, and a failed fetch leaves the game running on what it shipped with. What is a dial is the
// argument a group has - how dear growth is, what carelessness costs. What is not a dial is
// anything a lesson rests on, and that absence is the design.

const part = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  started: true, sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

const zoo = (barrier = 'high'): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1,
  backlog: [
    part({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 400, y: 800 },
      design: { parts: { barrier }, colors: { ground: '#c9a86a' },
        flora: [{ x: 0.3, y: 0.4, s: 1, type: 'tree' }], water: [{ x: 0.6, y: 0.5, w: 0.2, h: 0.2 }] } }),
    part({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
      appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 },
      design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } }),
  ],
  connectors: [{ id: 'r', itemId: 'enc', a: { x: 400, y: 1060 }, b: { x: 400, y: 860 },
    bends: [], thickness: 14, color: '#c9a86a' }],
} as unknown as ZooGameState);

beforeEach(() => applyTuning({}));   // every test starts from what the game shipped with

describe('a dial that has been turned', () => {
  it('changes what a Sprint was worth', () => {
    const asShipped = reviewSprint(zoo()).value;
    applyTuning({ 'tune.value.perVisit': '3' });
    const tripled = reviewSprint(zoo()).value;
    expect(tripled, 'turning up what a visit is worth changed nothing').toBeGreaterThan(asShipped);
    expect(tripled).toBe(asShipped * 3);
  });

  it('changes what keeping an animal badly costs', () => {
    applyTuning({ 'tune.welfare.penalty': '500' });
    const loose = reviewSprint(zoo('hedge'));
    expect(loose.lastLedger!.penalties, 'the penalty dial did not reach the Review').toBe(500);
  });

  it('applies to the next Review without anything being reloaded', () => {
    // How a trainer uses it: "let us make that hurt more, go again" - between two Sprints, with the
    // game open. A number captured at module load would need a refresh, and nobody refreshes
    // mid-workshop.
    const before = reviewSprint(zoo('hedge')).lastLedger!.penalties;
    applyTuning({ 'tune.welfare.penalty': '900' });
    expect(reviewSprint(zoo('hedge')).lastLedger!.penalties,
      'the number was read once at load and never again').not.toBe(before);
  });
});

describe('a dial that has not been turned, or has been turned badly', () => {
  it('runs on what the game shipped with', () => {
    applyTuning({});
    for (const d of DIALS) expect(tune(d.key), `${d.label} did not fall back to its default`).toBe(d.value);
  });

  it('ignores anything that is not a number in range', () => {
    // A bad row in a table must not be able to make the game unplayable, and neither must a
    // trainer's slip of the keyboard.
    for (const said of ['', 'lots', '-5', '999999', 'NaN']) {
      applyTuning({ 'tune.welfare.penalty': said });
      const d = DIALS.find((x) => x.key === 'tune.welfare.penalty')!;
      expect(tune('tune.welfare.penalty'), `"${said}" was taken as a penalty`).toBe(d.value);
    }
  });

  it('ignores a key that is not a dial at all', () => {
    applyTuning({ 'tune.points.buyGround': '1' });
    expect(DIALS.some((d) => d.key === 'tune.points.buyGround'),
      'somebody added a dial that lets points buy something').toBe(false);
  });
});

describe('what is deliberately not a dial', () => {
  it('has nothing that turns a lesson off', () => {
    // The rule this file exists to protect. A game whose lessons could be switched off would be a
    // game that teaches whatever its last editor believed - so these are the words that must not
    // appear in a dial's key: no escape switch, no points-buy-things switch, no
    // "count-a-visit-nobody-enjoyed" switch.
    const forbidden = /escape|points|shut|refund|barrier|welfare\.off|enabled|disable/i;
    for (const d of DIALS) {
      const isCost = d.key === 'tune.welfare.penalty';   // what carelessness COSTS is fair game
      if (isCost) continue;
      expect(d.key, `${d.key} reads like a switch on a lesson, not a dial on an argument`)
        .not.toMatch(forbidden);
    }
  });

  it('keeps every dial inside a range somebody could defend', () => {
    for (const d of DIALS) {
      expect(d.min, `${d.label} can be set below zero`).toBeGreaterThanOrEqual(0);
      expect(d.max, `${d.label} has no upper bound worth the name`).toBeGreaterThan(d.min);
      expect(d.value, `${d.label} ships outside its own range`).toBeGreaterThanOrEqual(d.min);
      expect(d.value).toBeLessThanOrEqual(d.max);
      expect(d.hint.length, `${d.label} does not say what turning it changes`).toBeGreaterThan(40);
    }
  });
});
