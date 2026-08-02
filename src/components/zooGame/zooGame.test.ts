import { describe, it, expect } from 'vitest';
import { initialZooState, zooCapacity, STARTER_CAPACITY, SPRINT_DAYS, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT } from './config';
import {
  planSprint, pullIntoSprint, estimateItem, moveItem, pokerHand, estimateSuggestion, buildItem, editItem, addAnother, openItem, reviewSprint, startNextSprint, acceptSignal,
  setProductGoal, setSprintGoal, suggestSprintGoal, addPbi, refinePbi, suggestStory, moveItemBefore, moveToZone, addZone, renameZone, reorderInZone, openZoo, availableItems, productGoalProgress,
  endDay, runDailyScrum, skipDailyScrum, startDay, generateImpediment,
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

describe('zoo game: arranging the park layout', () => {
  it('moves an item to another zone (adding the zone if new)', () => {
    let s = moveToZone(initialZooState(1), 'lion', 'Waterside');
    expect(s.backlog.find((i) => i.id === 'lion')!.zone).toBe('Waterside');
    s = moveToZone(s, 'tiger', 'Reptile House'); // new zone
    expect(s.backlog.find((i) => i.id === 'tiger')!.zone).toBe('Reptile House');
    expect(s.zones).toContain('Reptile House');
  });

  it('creates and renames zones (renaming updates every item in it)', () => {
    let s = addZone(initialZooState(1), 'Nocturnal House');
    expect(s.zones).toContain('Nocturnal House');
    s = renameZone(s, 'Big Cats', 'Predators');
    expect(s.zones).toContain('Predators');
    expect(s.zones).not.toContain('Big Cats');
    expect(s.backlog.filter((i) => i.zone === 'Predators').length).toBeGreaterThan(0);
    expect(s.backlog.some((i) => i.zone === 'Big Cats')).toBe(false);
  });

  it('reorders items within a zone', () => {
    const s = initialZooState(1);
    const bigCats = () => s.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id);
    const before = bigCats();
    const moved = reorderInZone(s, before[1], 'up');
    const after = moved.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id);
    expect(after[0]).toBe(before[1]);
  });
});

describe('zoo game: the Sprint Goal', () => {
  it('is set at Planning and coached from the selection, and is judged at the Review', () => {
    let s = setSprintGoal(initialZooState(1), 'Open Big Cats so families have more to see.');
    expect(s.sprintGoal).toContain('Big Cats');
    expect(s.sprintGoalMet).toBeNull();
    // Deliver everything committed -> goal met.
    s = reviewSprint(buildAndOpen(s, ['lion', 'kiosk']));
    expect(s.sprintGoalMet).toBe(true);
    // A new Sprint clears the goal.
    s = startNextSprint(s, 'x');
    expect(s.sprintGoal).toBe('');
    expect(s.sprintGoalMet).toBeNull();
  });

  it('is not met when committed work is left unfinished', () => {
    let s = setSprintGoal(initialZooState(1), 'Fill Big Cats.');
    s = planSprint(s, ['lion', 'tiger']);
    s = openItem(buildItem(s, 'lion'), 'lion'); // tiger left unbuilt
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(false);
  });

  it('the coach shapes an outcome from the selection', () => {
    const items = initialZooState(1).backlog.filter((i) => ['lion', 'tiger'].includes(i.id));
    expect(suggestSprintGoal(items)).toMatch(/Big Cats/);
    expect(suggestSprintGoal(items)).toMatch(/so /); // outcome-shaped
  });
});

describe('zoo game: the PO adds and refines PBIs', () => {
  it('adds a custom PBI (unsized, with acceptance criteria), including flora', () => {
    let s = addPbi(initialZooState(1), { name: 'Meerkats', category: 'exhibit', zone: 'Savanna', acceptance: ['Recognisable meerkats', 'A lookout mound'] });
    const meerkats = s.backlog.find((i) => i.name === 'Meerkats')!;
    expect(meerkats.category).toBe('exhibit');
    expect(meerkats.unsized).toBe(true);
    expect(meerkats.acceptance).toEqual(['Recognisable meerkats', 'A lookout mound']);
    // A new zone on the PBI is registered.
    s = addPbi(s, { name: 'Oak tree', category: 'flora', zone: 'Woodland', acceptance: [] });
    expect(s.zones).toContain('Woodland');
    expect(s.backlog.find((i) => i.name === 'Oak tree')!.category).toBe('flora');
  });

  it('a custom, estimated PBI can be planned and built like any other', () => {
    let s = addPbi(initialZooState(1), { name: 'Otters', category: 'exhibit', zone: 'Waterside', acceptance: ['Playful otters'] });
    const id = s.backlog.find((i) => i.name === 'Otters')!.id;
    s = estimateItem(s, id, 5);
    s = planSprint(s, [id]);
    expect(s.committedIds).toContain(id);
  });

  it('carries an optional user story, and the coach can suggest one', () => {
    const s = suggestStory({ name: 'Meerkats', category: 'exhibit', zone: 'Savanna' });
    expect(s.role.length).toBeGreaterThan(0);
    expect(s.want).toContain('Meerkats');
    expect(s.soThat.length).toBeGreaterThan(0);
    const st = addPbi(initialZooState(1), { name: 'Meerkats', story: 'As a family, I want meerkats so that the kids are engaged.', category: 'exhibit', zone: 'Savanna', acceptance: [] });
    expect(st.backlog.find((i) => i.name === 'Meerkats')!.story).toContain('so that');
  });

  it('drag-and-drop reorders the Backlog (move one item before another)', () => {
    const s = initialZooState(1);
    const ids = s.backlog.map((i) => i.id);
    const moved = moveItemBefore(s, ids[3], ids[0]); // move the 4th item before the 1st
    expect(moved.backlog[0].id).toBe(ids[3]);
    expect(moved.backlog.length).toBe(s.backlog.length); // nothing lost
  });

  it('refines an existing Backlog PBI (name, zone, acceptance)', () => {
    let s = addPbi(initialZooState(1), { name: 'Birds', category: 'exhibit', zone: 'General', acceptance: ['x'] });
    const id = s.backlog.find((i) => i.name === 'Birds')!.id;
    s = refinePbi(s, id, { name: 'Flamingos', category: 'exhibit', zone: 'Waterside', acceptance: ['Pink and tall', 'Standing on one leg'] });
    const it = s.backlog.find((i) => i.id === id)!;
    expect(it.name).toBe('Flamingos');
    expect(it.zone).toBe('Waterside');
    expect(it.acceptance).toEqual(['Pink and tall', 'Standing on one leg']);
  });
});

describe('zoo game: backlog refinement (estimation and ordering)', () => {
  it('new-zone items start unsized and cannot be committed until estimated', () => {
    let s = initialZooState(1);
    const elephant = s.backlog.find((i) => i.id === 'elephant')!;
    expect(elephant.unsized).toBe(true);
    expect(elephant.estimate).toBe(0);
    // Planning skips unsized items.
    s = planSprint(s, ['elephant']);
    expect(s.committedIds).not.toContain('elephant');
    expect(s.backlog.find((i) => i.id === 'elephant')!.status).toBe('backlog');
  });

  it('planning poker is deterministic and yields a Fibonacci suggestion near the true size', () => {
    const elephant = initialZooState(1).backlog.find((i) => i.id === 'elephant')!;
    const hand = pokerHand(elephant, 1);
    expect(pokerHand(elephant, 1)).toEqual(hand); // deterministic
    const FIB = [1, 2, 3, 5, 8, 13, 21];
    expect(hand.every((c) => FIB.includes(c))).toBe(true);
    const s = estimateSuggestion(hand);
    expect(FIB.includes(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(5); // clusters around trueSize 10
  });

  it('estimating an item makes it sized and committable', () => {
    let s = estimateItem(initialZooState(1), 'elephant', 13);
    const e = s.backlog.find((i) => i.id === 'elephant')!;
    expect(e.unsized).toBe(false);
    expect(e.estimate).toBe(13);
    s = planSprint(s, ['elephant']);
    expect(s.committedIds).toContain('elephant');
  });

  it('the Product Owner can re-order the Backlog', () => {
    const s = initialZooState(1);
    const order = () => availableItems(s).map((i) => i.id);
    const before = order();
    const moved = moveItem(s, before[1], 'up');
    const after = availableItems(moved).map((i) => i.id);
    expect(after[0]).toBe(before[1]); // the second item moved to the front
    expect(after[1]).toBe(before[0]);
  });
});

describe('zoo game: pulling Backlog items mid-Sprint', () => {
  it('commits a Backlog item into the running Sprint', () => {
    let s = planSprint(initialZooState(1), ['lion']);
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(true);
    s = pullIntoSprint(s, 'tiger');
    const tiger = s.backlog.find((i) => i.id === 'tiger')!;
    expect(tiger.status).toBe('committed');
    expect(tiger.sprintNumber).toBe(s.sprintNumber);
    expect(s.committedIds).toContain('tiger');
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(false);
  });

  it('only pulls from the Backlog, and only during a Sprint', () => {
    const planning = initialZooState(1); // phase 'intro', not a Sprint
    expect(pullIntoSprint(planning, 'tiger')).toBe(planning);
    const s = planSprint(initialZooState(1), ['lion']);
    expect(pullIntoSprint(s, 'lion')).toBe(s); // lion is committed, not in the Backlog
  });
});

describe('zoo game: timed days and the Daily Scrum', () => {
  it('runs its timed days, with a Daily Scrum between days but not after the last, then the Review opens', () => {
    let s = planSprint(initialZooState(1), ['lion']);
    s = openItem(buildItem(s, 'lion'), 'lion');
    expect(s.dayNumber).toBe(1);
    let scrums = 0;
    while (s.phase === 'sprint') {
      expect(s.dayStage).toBe('building');
      s = endDay(s);
      if (s.phase !== 'sprint') break; // the last day ends straight to the Review
      expect(s.dayStage).toBe('dailyScrum');
      scrums++;
      s = runDailyScrum(s);
      if (s.dayStage === 'dayStart') s = startDay(s); // a new day pauses, then begins
    }
    expect(s.phase).toBe('review');
    expect(scrums).toBe(SPRINT_DAYS - 1); // no Daily Scrum after the last day
    expect(s.velocity[0]).toBe(8);
  });

  it('after the Daily Scrum a new day pauses (dayStart) until it is started', () => {
    let s = openItem(buildItem(planSprint(initialZooState(1), ['lion']), 'lion'), 'lion');
    s = runDailyScrum(endDay(s));
    expect(s.dayStage).toBe('dayStart'); // a breather before the build resumes
    expect(s.dayNumber).toBe(2);
    s = startDay(s);
    expect(s.dayStage).toBe('building');
  });

  it('the clock runs through the breather: the day can end from dayStart', () => {
    let s = openItem(buildItem(planSprint(initialZooState(1), ['lion']), 'lion'), 'lion');
    s = runDailyScrum(endDay(s)); // -> dayStart on day 2
    expect(s.dayStage).toBe('dayStart');
    s = endDay(s); // the day's time ran out during the breather
    expect(s.dayStage).toBe('dailyScrum'); // day 2 is not the last, so its close opens a Daily Scrum
  });

  it('impediments are deterministic per game, Sprint and day; some days have none', () => {
    expect(generateImpediment(1, 1, 1)).toEqual(generateImpediment(1, 1, 1));
    const days = Array.from({ length: 20 }, (_, i) => generateImpediment(1, 1, i + 1));
    expect(days.some((x) => x !== null)).toBe(true);
    expect(days.some((x) => x === null)).toBe(true);
  });

  it('holding the Daily Scrum clears the impediment and costs a little time', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: { id: 'x', title: 'A keeper called in sick', detail: '...' } };
    s = runDailyScrum(s);
    expect(s.pendingImpediment).toBeNull();
    expect(s.carriedImpediment).toBeNull();
    expect(s.dayNumber).toBe(2);
    expect(s.dayTimeMult).toBe(DAILY_SCRUM_MULT);
    expect(s.missedScrums).toBe(0);
  });

  it('skipping the Daily Scrum lets a waiting impediment through, later and costlier', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: { id: 'x', title: 'The pond pump failed', detail: '...' } };
    s = skipDailyScrum(s);
    expect(s.dayNumber).toBe(2);
    expect(s.carriedImpediment).toMatchObject({ missed: true, title: 'The pond pump failed' });
    expect(s.carriedImpediment!.tip!.length).toBeGreaterThan(0);
    expect(SKIP_PENALTY_MULT).toBeLessThan(DAILY_SCRUM_MULT); // a heavier cost than holding it
    expect(s.dayTimeMult).toBe(SKIP_PENALTY_MULT);
    expect(s.missedScrums).toBe(1);
  });

  it('skipping a Daily Scrum with nothing waiting costs nothing', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: null };
    s = skipDailyScrum(s);
    expect(s.dayNumber).toBe(2);
    expect(s.carriedImpediment).toBeNull();
    expect(s.dayTimeMult).toBe(1);
    expect(s.missedScrums).toBe(0);
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

describe('zoo game: design choices are the product', () => {
  const brightDesign = { parts: { body: 'round', head: 'maned', ears: 'round', tail: 'tufted', markings: 'spots' }, colors: { body: '#ffd54a', head: '#ffd54a', ears: '#ffcc00', tail: '#ffcc00', markings: '#ff8a00' } };
  const calmDesign = { parts: { body: 'round', head: 'round', ears: 'none', tail: 'none', markings: 'none' }, colors: { body: '#5a4a38', head: '#5a4a38', ears: '#5a4a38' } };

  it('a bright, busy build favours Families; a calm, muted one favours Comfort Seekers', () => {
    const bright = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign);
    const calm = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', calmDesign);
    const b = bright.backlog.find((i) => i.id === 'lion')!.appeal!;
    const c = calm.backlog.find((i) => i.id === 'lion')!.appeal!;
    expect(b.families).toBeGreaterThan(c.families);
    expect(c.comfortSeekers).toBeGreaterThan(b.comfortSeekers);
    expect(bright.backlog.find((i) => i.id === 'lion')!.design).toEqual(brightDesign); // one animal per PBI
  });

  it('a built animal can be re-edited without changing its status, and appeal follows', () => {
    let s = openItem(buildItem(planSprint(initialZooState(1), ['lion']), 'lion', calmDesign), 'lion');
    expect(s.backlog.find((i) => i.id === 'lion')!.status).toBe('open');
    const before = s.backlog.find((i) => i.id === 'lion')!.appeal!.families;
    s = editItem(s, 'lion', brightDesign); // repaint it bright
    const after = s.backlog.find((i) => i.id === 'lion')!;
    expect(after.status).toBe('open'); // still open, just refined
    expect(after.appeal!.families).toBeGreaterThan(before);
  });

  it('add another creates a fresh PBI for the same species (a pride is several PBIs)', () => {
    let s = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign);
    s = addAnother(s, 'lion');
    const lions = s.backlog.filter((i) => i.name.replace(/ \d+$/, '') === 'Lion');
    expect(lions.length).toBe(2);
    const clone = lions.find((i) => i.id !== 'lion')!;
    expect(clone.status).toBe('backlog'); // a new item to plan and build
    expect(clone.design).toBeUndefined(); // not built yet
    expect(clone.name).toBe('Lion 2');
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
