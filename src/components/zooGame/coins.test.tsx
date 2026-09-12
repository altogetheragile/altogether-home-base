import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { initialZooState } from './config';
import { reviewSprint, ENTRY, WELFARE_FINE, editItem } from './engine';
import { currentDesign, presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Coins are the visitors' money.
//
// They come in at the gate, go back over the counter when the day was not worth paying for, and are
// fined away when an animal is kept badly. Nothing else makes them.
//
// POINTS NEVER BUY ANYTHING. It is the rule the whole mechanism exists to protect: a team that could
// spend its estimates would be a team whose estimates were a currency, and estimating would stop
// being a forecast and become a budget the moment anybody noticed. A Scrum game that taught that
// would be worse than no game.
//
// The shape is "take it, then give it back", on purpose. Nobody is turned away at the gate of an
// empty zoo - they come, they pay, they walk round a field, and the refund is the Sprint Review
// saying what an output that is not an outcome actually cost. A zoo that delivered nothing anybody
// could use does not merely earn less. It hands the money back.

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

describe('what the gate takes', () => {
  it('is the visitors who came, at the price of coming in', () => {
    const after = reviewSprint(zoo());
    const led = after.lastLedger!;
    expect(led.takings, 'the gate took something other than entry money')
      .toBe(Math.round(after.lastReview!.totalAttendance * ENTRY));
    expect(after.coins, 'the takings did not reach the bank').toBe(Math.max(0, led.net));
  });

  it('gives it back when the day was not worth paying for', () => {
    // A zoo with nothing anybody can walk up to: they still come, they still pay, and they still go
    // home. The refund is what that costs, and it is the whole argument for a slice over a layer.
    const empty = { ...zoo(), backlog: [], connectors: [] } as unknown as ZooGameState;
    const after = reviewSprint(empty);
    const led = after.lastLedger!;
    expect(led.takings, 'nobody came to the zoo at all').toBeGreaterThan(0);
    expect(led.refundedVisits, 'a day with nothing to see was worth paying for').toBeGreaterThan(0);
    expect(led.refunds).toBe(led.refundedVisits * ENTRY);
    expect(after.coins, 'an empty zoo banked the day’s takings').toBe(0);
  });

  it('keeps more when the visitors had a day out', () => {
    const good = reviewSprint(zoo());
    const nothing = reviewSprint({ ...zoo(), backlog: [], connectors: [] } as unknown as ZooGameState);
    expect(good.coins, 'a zoo worth visiting banked no more than an empty field')
      .toBeGreaterThan(nothing.coins);
  });
});

describe('what the inspector takes', () => {
  it('fines a habitat that let something out', () => {
    const held = reviewSprint(zoo('high'));
    const loose = reviewSprint(zoo('hedge'));
    expect(held.lastLedger!.fines, 'a zoo that held its animals was fined').toBe(0);
    expect(loose.lastLedger!.fines, 'a lion in the car park cost nothing')
      .toBeGreaterThanOrEqual(WELFARE_FINE);
    expect(loose.lastLedger!.finedFor.join(' ')).toMatch(/got out of the Lion Enclosure/);
  });

  it('fines an animal with nowhere to move', () => {
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
    expect(after.lastLedger!.fines, 'a crowded habitat cost nothing').toBeGreaterThanOrEqual(WELFARE_FINE);
    expect(after.lastLedger!.finedFor.join(' ')).toMatch(/nowhere to move/);
  });
});

describe('points never buy anything', () => {
  it('is true of the takings: estimates are a forecast, not a currency', () => {
    // The same zoo, estimated at four times the size. If a single coin moved, the game would be
    // teaching that a team can inflate its way to a budget - which is the worst thing it could say.
    const modest = zoo();
    const inflated = {
      ...modest,
      backlog: modest.backlog.map((it) => ({ ...it, estimate: it.estimate * 4, trueSize: (it.trueSize ?? 5) * 4 })),
    } as ZooGameState;
    const a = reviewSprint(modest), b = reviewSprint(inflated);
    expect(b.coins, 'bigger estimates bought coins').toBe(a.coins);
    expect(b.lastLedger, 'the gate counted points').toEqual(a.lastLedger);
    // ...and velocity still tells the truth about the work, which is what points ARE for.
    expect(b.velocity[0]).toBeGreaterThan(a.velocity[0]);
  });

  it('starts a new zoo with nothing in the bank', () => {
    const fresh = initialZooState(1) as ZooGameState;
    expect(fresh.coins, 'a zoo began with money nobody had paid it').toBe(0);
    expect(fresh.lastLedger).toBeNull();
  });
});

describe('the Review shows its working', () => {
  it('says what was taken, what went back, and what is in the bank', () => {
    const after = { ...reviewSprint(zoo('hedge')), phase: 'review' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={after} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const till = container.querySelector('[data-part="ledger"]');
    expect(till, 'the Review says nothing about the money').toBeTruthy();
    expect(till!.textContent).toMatch(/Takings/i);
    expect(till!.textContent, 'a zoo that lost a lion was not fined on the page').toMatch(/fine/i);
    expect(till!.textContent).toMatch(/In the bank/i);
  });
});

describe('a design changed after the Review', () => {
  it('does not re-take the money', () => {
    // Coins are taken once, at the Review, from the day that actually happened. Editing the zoo
    // afterwards changes what NEXT Sprint's visitors will find, and nothing about what this one paid.
    const after = reviewSprint(zoo());
    const banked = after.coins;
    const changed = editItem(after, 'enc', { ...presetFor(after.backlog[0]), parts: { barrier: 'glass' } });
    expect(changed.coins, 'changing a fence minted coins').toBe(banked);
  });
});
