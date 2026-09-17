import { describe, it, expect } from 'vitest';
import { acceptSignal, SIGNAL_NEEDS } from './engine';
import { noOnePieceMeets, bestFor, ranked } from './toolboxItems';
import { criterionFor, answerable } from './parkChecks';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// What the visitors said is evidence of a NEED, not an instruction to build a thing.
//
// A signal used to arrive reading "Add somewhere to eat (a cafe or kiosk)", and taking it put a
// "Food outlet" on the Product Backlog with its services already set to food and its size already
// decided. The parenthetical is the simulation choosing the building; the rest is the Product
// Owner's accountability being done for them by a complaint.
//
// The quote that drove it was need-shaped all along: "Lovely morning, but we left at lunchtime.
// Nowhere to eat." So the signal says the need, and the Developers choose the kiosk, the cafe or
// the stall - which is the same decision the seeded "Somewhere to eat" asks for, arriving from the
// place most of the work should come from after Sprint 1.

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;
const signal = (drivenBy: string) => ({ drivenBy, suggestion: 'x', estimatedValue: 'high' as const });

describe('what a signal puts on the Product Backlog', () => {
  const taken = (cause: string) => {
    // A team that HAS taken refinement on, which is the case this is all about: the decision is
    // theirs to make. See below for what happens before they take it on.
    const s = { ...seeded(), sprintNumber: 1, adopted: ['refinement'], signals: [signal(cause)] } as unknown as ZooGameState;
    const after = acceptSignal(s, 0);
    const made = after.backlog.find((it) => !s.backlog.some((b) => b.id === it.id));
    expect(made, `the ${cause} signal makes no item at all`).toBeTruthy();
    return made!;
  };

  for (const cause of Object.keys(SIGNAL_NEEDS)) {
    describe(cause, () => {
      it('is a need, with nothing decided about how to meet it', () => {
        const made = taken(cause);
        expect(made.category, 'the signal decided what to build').toBe('need');
        expect(made.template, 'the signal picked a building').toBeUndefined();
        expect(made.services, 'the signal decided what it would offer').toBeUndefined();
        expect(made.unsized, 'emergent work arrived already sized').toBe(true);
      });

      it('says who wants it and why', () => {
        // A need with no story is a title. This is the Product Owner's half of the job and the
        // Review is where it comes from, so it arrives written.
        expect(taken(cause).story, 'it arrived as a heading').toMatch(/^As a .* I want .* so that /);
      });

      it('asks only questions the game knows', () => {
        for (const c of taken(cause).acceptance ?? []) {
          expect(criterionFor(c), `nothing in the game recognises "${c}"`).toBeTruthy();
          expect(c, 'a criterion that is not a question cannot be answered').toMatch(/\?$/);
        }
      });

      it('can be met by something in the catalogue, by one piece of work', () => {
        // Both halves matter. A need nothing can satisfy is a dead end, and a need that needs two
        // things is an item Refinement should have split - so a signal must raise neither.
        const made = taken(cause);
        const facts = (made.acceptance ?? []).filter(answerable);
        expect(facts.length, 'the park can check nothing about it at all').toBeGreaterThan(0);
        expect(noOnePieceMeets(made.acceptance ?? []),
          'a signal raised a need that no single thing could meet').toEqual([]);
      });
    });
  }
});

describe('the words the Review puts in front of the Product Owner', () => {
  it('name the need, not the building', () => {
    // "(a cafe or kiosk)" is the simulation making the Developers' decision in a parenthesis.
    for (const need of Object.values(SIGNAL_NEEDS)) {
      expect(need.suggestion, `"${need.suggestion}" names what to build`)
        .not.toMatch(/cafe|kiosk|stall|bench|shop|outlet|viewing area/i);
    }
  });
});

describe('a team that has not taken refinement on yet', () => {
  it('gets the need already decided, because the Developers decided it off-screen', () => {
    // The same rule that already sized new work for them. A need is stuck twice over otherwise:
    // nobody can size it until somebody has decided what will meet it, and deciding is a refinement
    // act too - so a Product Backlog would fill with needs the learner had no way to act on.
    //
    // Before you take refinement on, refinement still happens. You just do not see it, and you have
    // no say in it. That is the lesson the adoption is for.
    const s = { ...seeded(), sprintNumber: 1, signals: [signal('unmet:food')] } as ZooGameState;
    const after = acceptSignal(s, 0);
    const made = after.backlog.find((it) => !s.backlog.some((b) => b.id === it.id))!;
    expect(made.category, 'a need was left on a Backlog nobody could refine').not.toBe('need');
    expect(made.unsized, 'it arrived unsized for a team that cannot size anything').toBe(false);
    expect(made.needName, 'what the visitors actually asked for was thrown away').toBe('Somewhere to eat');
  });

  it('picks what the panel would have put at the top of the list', () => {
    // The choice made off-screen and the choice offered on-screen are one ranking. Two opinions
    // would mean the game quietly choosing something the panel ranks last.
    expect(bestFor(SIGNAL_NEEDS['unmet:food'].criteria), 'nothing was chosen for somewhere to eat').toBeTruthy();
    expect(ranked(SIGNAL_NEEDS['unmet:food'].criteria)[0].item.name)
      .toBe(bestFor(SIGNAL_NEEDS['unmet:food'].criteria));
  });
});
