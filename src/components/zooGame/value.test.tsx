import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { initialZooState } from './config';
import { reviewSprint, WELFARE_PENALTY, editItem } from './engine';
import { currentDesign, presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// What the zoo is worth is what the people who came got out of coming.
//
// One visit that was worth making is worth one. A visit that got to nothing, or that ended early
// because of something the zoo does not have, is worth nothing. Animals kept badly cost value.
// Nothing else makes it.
//
// Counted as visits rather than takings on purpose: an entry price would make the measure money,
// and a zoo can make money by charging more for the same day out. No Scrum Team ever improved an
// outcome that way. What this counts is whether the thing the team built was worth somebody's
// afternoon, which is the only question the Sprint Review is really asking.
//
// POINTS NEVER BUY ANYTHING. It is the rule the whole mechanism exists to protect: a team that could
// spend its estimates would be a team whose estimates were a currency, and estimating would stop
// being a forecast and become a budget the moment anybody noticed. A Scrum game that taught that
// would be worse than no game.
//
// Nobody is turned away at the gate of an empty zoo. They come, they walk round a field, and the day
// is worth nothing to them - which is what an output that is not an outcome looks like when you
// count it honestly.

const part = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  started: true, sprintNumber: 1, estimate: 5, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

/** An open zone: a habitat, its lion, and the path to it. `barrier` is what was chosen for the pen. */
const zoo = (barrier = 'high', over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3) as ZooGameState;
  const enc = part({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 400, y: 800 },
    design: { parts: { barrier }, colors: { ground: '#c9a86a', fence: '#8a6a3b' },
      flora: [{ x: 0.3, y: 0.4, s: 1, type: 'tree' }], water: [{ x: 0.6, y: 0.5, w: 0.2, h: 0.2 }] } });
  return {
    ...base, phase: 'sprint', sprintNumber: 1,
    backlog: [
      enc,
      part({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
        appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 },
        design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } }),
    ],
    connectors: [{ id: 'r', itemId: 'enc', a: { x: 400, y: 1060 }, b: { x: 400, y: 860 },
      bends: [], thickness: 14, color: '#c9a86a' }],
    ...over,
  } as unknown as ZooGameState;
};

describe('what a Sprint was worth', () => {
  it('is one for every visit that was worth making', () => {
    const after = reviewSprint(zoo());
    const led = after.lastLedger!;
    expect(led.visits, 'nobody came at all').toBe(Math.round(after.lastReview!.totalAttendance));
    expect(led.worthMaking + led.wasted, 'the visits do not add up').toBe(led.visits);
    expect(led.earned, 'a visit worth making was worth something other than one').toBe(led.worthMaking);
    expect(after.value, 'what it was worth never reached the zoo').toBe(Math.max(0, led.net));
  });

  it('is nothing when there was nothing to get to', () => {
    // A zoo with nothing anybody can walk up to: they still come, and they still go home with
    // nothing. That is the whole argument for a slice over a layer, counted.
    const empty = { ...zoo(), backlog: [], connectors: [] } as unknown as ZooGameState;
    const after = reviewSprint(empty);
    const led = after.lastLedger!;
    expect(led.visits, 'nobody came to the zoo at all').toBeGreaterThan(0);
    expect(led.wasted, 'a day with nothing to see was worth something').toBe(led.visits);
    expect(led.earned).toBe(0);
    expect(after.value, 'an empty field was worth something to somebody').toBe(0);
  });

  it('is more when the visitors had a day out', () => {
    const good = reviewSprint(zoo());
    const nothing = reviewSprint({ ...zoo(), backlog: [], connectors: [] } as unknown as ZooGameState);
    expect(good.value, 'a zoo worth visiting was worth no more than an empty field')
      .toBeGreaterThan(nothing.value);
  });
});

describe('what keeping an animal badly costs', () => {
  it('is paid for by a habitat that let something out', () => {
    const held = reviewSprint(zoo('high'));
    const loose = reviewSprint(zoo('hedge'));
    expect(held.lastLedger!.penalties, 'a zoo that held its animals was penalised').toBe(0);
    expect(loose.lastLedger!.penalties, 'a lion in the car park cost nothing')
      .toBeGreaterThanOrEqual(WELFARE_PENALTY);
    expect(loose.lastLedger!.penalisedFor.join(' ')).toMatch(/got out of the Lion Enclosure/);
  });

  it('is paid for by an animal with nowhere to move', () => {
    // The other welfare failure, and the one nobody notices: six lions in a medium pen is not an
    // escape, it is a zoo the inspector shuts down.
    const base = zoo('high');
    const crowded = {
      ...base,
      backlog: base.backlog.map((it) => (it.id === 'enc' ? { ...it, enclosureSize: 'small' as const }
        : it.id === 'lion'
          ? { ...it, design: { ...currentDesign(it), group: { males: 2, females: 3, juveniles: 1, cubs: 2 } } }
          : it)),
    } as ZooGameState;
    const after = reviewSprint(crowded);
    expect(after.lastLedger!.penalties, 'a crowded habitat cost nothing').toBeGreaterThanOrEqual(WELFARE_PENALTY);
    expect(after.lastLedger!.penalisedFor.join(' ')).toMatch(/nowhere to move/);
  });
});

describe('points never buy anything', () => {
  it('is true of the value: a size is a forecast, not a currency', () => {
    // The same zoo, sized at four times the work. If the value moved by one, the game would be
    // teaching that a team can inflate its way to a budget - the worst thing it could say.
    const modest = zoo();
    const inflated = {
      ...modest,
      backlog: modest.backlog.map((it) => ({ ...it, estimate: it.estimate * 4, trueSize: (it.trueSize ?? 5) * 4 })),
    } as ZooGameState;
    const a = reviewSprint(modest), b = reviewSprint(inflated);
    expect(b.value, 'bigger sizes bought value').toBe(a.value);
    expect(b.lastLedger, 'what the visitors got out of it was counted in points').toEqual(a.lastLedger);
    // ...and velocity still tells the truth about the work, which is what points ARE for.
    expect(b.velocity[0]).toBeGreaterThan(a.velocity[0]);
  });

  it('starts a new zoo worth nothing to anybody', () => {
    const fresh = initialZooState(1) as ZooGameState;
    expect(fresh.value, 'a zoo with no animals in it was already worth something').toBe(0);
    expect(fresh.lastLedger).toBeNull();
  });
});

describe('the Review shows its working', () => {
  it('says how many visits were worth making, and what the zoo is worth', () => {
    const after = { ...reviewSprint(zoo('hedge')), phase: 'review' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={after} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const said = container.querySelector('[data-part="ledger"]');
    expect(said, 'the Review says nothing about what it was worth').toBeTruthy();
    expect(said!.textContent).toMatch(/Visits worth making/i);
    expect(said!.textContent, 'a zoo that lost a lion was not penalised on the page').toMatch(/welfare penalty/i);
    expect(said!.textContent).toMatch(/Value all told/i);
  });
});

describe('a design changed after the Review', () => {
  it('does not re-count what the day was worth', () => {
    // Value is counted once, at the Review, from the day that actually happened. Editing the zoo
    // afterwards changes what NEXT Sprint's visitors find, and nothing about what this one was worth.
    const after = reviewSprint(zoo());
    const worth = after.value;
    const changed = editItem(after, 'enc', { ...presetFor(after.backlog[0]), parts: { barrier: 'glass' } });
    expect(changed.value, 'changing a fence minted value').toBe(worth);
  });
});
