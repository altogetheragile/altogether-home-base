import { describe, it, expect } from 'vitest';
import { GROUPS, groupsFor, openCriteria, wouldSettle, unreachableCriteria } from './buildGroups';
import { CRITERIA, criterionFor, answerable, inspect } from './parkChecks';
import { TOOLBOX } from './toolboxItems';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// The strip lights the control that would answer the question you are failing. That only works if
// every question the park can answer HAS a control, and if every control that claims a question is
// claiming one that exists.
//
// This is the same pair of invariants step 2 put on the catalogue, on the other end of the same
// mechanic. The game has shipped a question with no control behind it three times.

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;

describe('every question the park asks has a control that answers it', () => {
  it('leaves no criterion the park checks unreachable from the strip', () => {
    const orphans = unreachableCriteria();
    expect(orphans, `nothing on the build strip can settle: ${orphans.join(', ')}`).toEqual([]);
  });

  it('claims no criterion that does not exist', () => {
    const known = new Set(CRITERIA.map((c) => c.id));
    const imaginary = GROUPS.flatMap((g) => g.meets.map((m) => ({ group: g.id, m })))
      .filter((x) => !known.has(x.m));
    expect(imaginary, 'a group claims a criterion nothing defines').toEqual([]);
  });

  it('claims no criterion that only a person can judge', () => {
    // A light means "press this and it goes green". A group that lights for a criterion nobody can
    // check would send the player to a control that cannot change the answer.
    const judgement = GROUPS.flatMap((g) => g.meets.map((m) => ({ group: g.id, m })))
      .filter((x) => !CRITERIA.find((c) => c.id === x.m)?.answer);
    expect(judgement, 'a group offers to settle a judgement').toEqual([]);
  });
});

describe('every buildable thing has somewhere to be built', () => {
  it('offers at least one group for everything in the catalogue', () => {
    const bare = TOOLBOX.flatMap((g) => g.items)
      .map((t) => ({ t, item: { id: t.name, name: t.name, category: t.category, acceptance: [] } as unknown as BacklogItem }))
      .filter((x) => !groupsFor(x.item).length)
      .map((x) => x.t.name);
    expect(bare, 'these can be placed and then not configured at all').toEqual([]);
  });
});

describe('what the strip lights', () => {
  const pen = (s: ZooGameState) => s.backlog.find((it) => it.category === 'enclosure')!;

  it('lights the barrier while nothing holds them, and stops when something does', () => {
    const s = seeded();
    const item = pen(s);
    const open = openCriteria(s, item);
    const barrier = GROUPS.find((g) => g.id === 'barrier')!;
    // The seeded habitat has no barrier chosen, so the question it is failing is the one the
    // barrier group answers.
    if (open.includes('held')) {
      expect(wouldSettle(barrier, open), 'the control that would fix it is not lit').toBe(true);
    }
    expect(wouldSettle(barrier, open.filter((c) => c !== 'held')),
      'the barrier stays lit once it holds them').toBe(false);
  });

  it('never lights a cosmetic group', () => {
    const s = seeded();
    const item = pen(s);
    const open = openCriteria(s, item);
    for (const g of groupsFor(item).filter((x) => !x.meets.length)) {
      expect(wouldSettle(g, open), `${g.label} lit, and it cannot settle anything`).toBe(false);
    }
  });

  it('is ready when the facts are in, whatever is left to judge', () => {
    // The chip and the criteria panel read one calculation, so they cannot disagree about the same
    // habitat. What "ready" means is the part worth pinning down: every criterion the park CAN
    // answer is answered, and the judgements are what the asking is FOR. Waiting for those too is
    // how a finished Sprint ends up with no way to finish.
    const s = seeded();
    const item = pen(s);
    const how = inspect(s, item);
    expect(how.criteria.length, 'nothing is asked of a habitat').toBeGreaterThan(0);
    const facts = how.criteria.filter(answerable);
    expect(facts.length, 'a habitat is all judgement').toBeGreaterThan(0);
    expect(how.ready).toBe(facts.every((c) => how.met(c, how.criteria.indexOf(c))));
    // A criterion only a person can settle must never hold the dot on a control, because no press
    // would put it out.
    const judged = how.criteria.filter((c) => !criterionFor(c)?.answer);
    const open = openCriteria(s, item);
    for (const c of judged) {
      expect(open, `${c} is being treated as something a control could settle`)
        .not.toContain(criterionFor(c)?.id);
    }
  });
});
