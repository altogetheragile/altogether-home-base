import { describe, it, expect } from 'vitest';
import { mayTake, refusal, ownedBy } from './seatRules';

// What the gate is for: alone you are all three accountabilities at once, so none of them
// can push back on you. These are the pushes.

describe('who may do what', () => {
  const po = { seat: 'product_owner' as const };
  const dev = { seat: 'developer' as const };
  const sm = { seat: 'scrum_master' as const };

  it('keeps the Product Backlog the Product Owner’s', () => {
    expect(mayTake('REORDER_IN_ZONE', po).allowed).toBe(true);
    const no = mayTake('REORDER_IN_ZONE', dev);
    expect(no.allowed, 'a Developer reordered the Product Backlog').toBe(false);
    expect(no.owner).toBe('product_owner');
    expect(refusal(no)).toMatch(/Product Owner/);
  });

  it('lets only the Product Owner cancel a Sprint, which is the one place the Guide says only', () => {
    expect(mayTake('CANCEL_SPRINT', po).allowed).toBe(true);
    expect(mayTake('CANCEL_SPRINT', sm).allowed, 'the Scrum Master cancelled a Sprint').toBe(false);
    expect(mayTake('CANCEL_SPRINT', dev).allowed).toBe(false);
  });

  it('keeps sizing and the Sprint Backlog with the Developers', () => {
    expect(mayTake('ESTIMATE_ITEM', dev).allowed).toBe(true);
    expect(mayTake('ESTIMATE_ITEM', po).allowed, 'the Product Owner sized the work').toBe(false);
    expect(mayTake('SET_FORECAST', po).allowed, 'the Product Owner chose what fits in the Sprint').toBe(false);
    // ...but ending the event is not one accountability's call. Gating this stopped a
    // Product Owner starting a Sprint the Developers had already forecast and planned.
    expect(mayTake('PLAN_SPRINT', po).allowed, 'the Product Owner could not start the Sprint').toBe(true);
    expect(refusal(mayTake('ESTIMATE_ITEM', po))).toMatch(/people who will do the work/i);
  });

  it('will not let anyone hand a Developer their work', () => {
    // A self-managing team decides who does what. This is the Scrum Master trap.
    expect(mayTake('ASSIGN_DEV', sm).allowed, 'the Scrum Master assigned work').toBe(false);
    expect(mayTake('PULL_ITEM', sm).allowed).toBe(false);
    expect(mayTake('PULL_ITEM', dev).allowed).toBe(true);
  });

  it('leaves most of the game to the whole Scrum Team', () => {
    // The gate is short on purpose: inventing rules the Guide does not have would teach
    // them. The Sprint Goal, the Definition of Done and refinement are the team's.
    for (const seat of [po, dev, sm]) {
      expect(mayTake('SET_SPRINT_GOAL', seat).allowed, 'the Sprint Goal was gated').toBe(true);
      expect(mayTake('SET_DOD', seat).allowed, 'the Definition of Done was gated').toBe(true);
      expect(mayTake('SPLIT_EPIC', seat).allowed, 'refinement was gated').toBe(true);
      expect(mayTake('AGREE_DOD', seat).allowed).toBe(true);
    }
  });

  it('lets an observer act on nothing at all', () => {
    const watching = { seat: null, observer: true };
    expect(mayTake('SET_SPRINT_GOAL', watching).allowed, 'an observer changed the game').toBe(false);
    expect(mayTake('PULL_ITEM', watching).allowed).toBe(false);
    expect(refusal(mayTake('PULL_ITEM', watching))).toMatch(/watching/i);
  });

  it('refuses an empty seat’s work, and says how to fill it', () => {
    // This test used to assert the opposite, and the opposite was wrong. Permitting an
    // empty seat's work so a short-handed team could not deadlock meant that alone in a
    // session - five seats empty - every rule fell away, and holding the Product Owner seat
    // became indistinguishable from holding a Developer's. Reported as "assuming a PO role
    // is no different to being a Developer", which it exactly was.
    //
    // AI seats solve the deadlock properly: an unclaimed seat is played by the game, so
    // somebody always holds the accountability.
    const shortHanded = { seat: 'developer' as const, emptySeats: ['product_owner' as const] };
    const no = mayTake('REORDER_IN_ZONE', shortHanded);
    expect(no.allowed, 'an empty seat still permits its work').toBe(false);
    expect(refusal(no), 'the refusal does not say how to fix it').toMatch(/AI|sit somebody/i);
  });

  it('leaves a lone Product Owner unable to do the Developers’ job', () => {
    // The case that was broken. Sitting as Product Owner with nobody else there must not
    // hand you every other accountability as well.
    const lone = { seat: 'product_owner' as const, emptySeats: ['scrum_master' as const, 'developer' as const] };
    for (const a of ['ESTIMATE_ITEM', 'SET_FORECAST', 'PULL_ITEM', 'ASSIGN_DEV', 'SET_WIP_LIMIT'] as const) {
      expect(mayTake(a, lone).allowed, `a lone Product Owner was allowed to ${a}`).toBe(false);
    }
    // ...while their own work is still theirs
    expect(mayTake('REORDER_IN_ZONE', lone).allowed).toBe(true);
    expect(mayTake('CANCEL_SPRINT', lone).allowed).toBe(true);
  });

  it('can list what an accountability owns, for a screen that wants to say so up front', () => {
    expect(ownedBy('product_owner')).toContain('CANCEL_SPRINT');
    expect(ownedBy('developer')).toContain('ESTIMATE_ITEM');
    expect(ownedBy('product_owner')).not.toContain('ESTIMATE_ITEM');
  });
});
