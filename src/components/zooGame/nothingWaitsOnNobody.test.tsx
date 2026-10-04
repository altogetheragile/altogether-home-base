import { describe, it, expect } from 'vitest';
import { aiTurn, SOLO_AI_SEATS } from './aiSeats';
import { initialZooState } from './config';
import {
  planSprint, startItem, availableItems, theirsToTake, askIfDue, askToCheck, setDraftDesign,
} from './engine';
import type { ZooGameState, GameQuestion } from './types';

// Taking a decision away from the player is only safe if somebody else can take it.
//
// While the Sprint Backlog is being executed the player is a Developer, so the Product Owner's
// decisions are no longer theirs. Every one of those has to be answerable by the seat the game
// plays, or the game simply stops: the Developers stand still, the clock runs, and no press
// anywhere will move it.
//
// So this is not a test of Priya's judgement. It is the deadlock check.

const sprint = (): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
const started = (): ZooGameState => {
  const s = sprint();
  const first = s.backlog.find((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber)!;
  return startItem(s, first.id);
};
/** A Developer asks the Product Owner how it should be built. */
const howAsked = (): ZooGameState => {
  const s = started();
  const enc = s.backlog.find((it) => it.started && it.category === 'enclosure');
  return enc ? askIfDue(s) : { ...s, questions: [{
    id: 'fence-x', of: 'product_owner', from: 'Ada', itemId: s.backlog.find((it) => it.started)!.id,
    text: 'Rounded or square?', askedAt: s.daySecondsLeft, day: 1,
    choices: [{ key: 'rounded', label: 'Rounded' }, { key: 'theirs', label: 'Your call' }],
  } as GameQuestion] };
};

describe('whose decision it is while the Sprint Backlog is executed', () => {
  it('is the Developers’, and only theirs', () => {
    const s = sprint();
    expect(theirsToTake(s, 'developer'), 'the player is not the Developers during a Sprint').toBe(true);
    expect(theirsToTake(s, 'product_owner'), 'the player is still the Product Owner mid-Sprint').toBe(false);
    expect(theirsToTake(s, 'scrum_master'), 'the player is still the Scrum Master mid-Sprint').toBe(false);
  });

  it('is all three outside a Sprint, where the player writes the Goal and adapts the Backlog', () => {
    for (const phase of ['intro', 'refine', 'planning', 'review', 'retro'] as const) {
      const s = { ...sprint(), phase } as ZooGameState;
      expect(theirsToTake(s, 'product_owner'), `the player is not the Product Owner at ${phase}`).toBe(true);
    }
  });

  it('is simply whose seat it is, in a shared session', () => {
    const s = sprint();
    expect(theirsToTake(s, 'product_owner', 'product_owner')).toBe(true);
    expect(theirsToTake(s, 'product_owner', 'developer')).toBe(false);
    // ...including during a Sprint: holding the seat is holding the seat.
    expect(theirsToTake(s, 'developer', 'developer')).toBe(true);
  });
});

describe('nothing taken from the player waits on nobody', () => {
  it('has somebody to play the Product Owner at all', () => {
    expect(SOLO_AI_SEATS, 'her decisions were taken away and nobody was given them')
      .toContain('product_owner');
  });

  it('answers a question about how the work gets built', () => {
    const s = howAsked();
    expect((s.questions ?? []).length, 'nothing was asked, so nothing is being tested').toBeGreaterThan(0);
    expect(theirsToTake(s, 'product_owner'), 'this is still the player’s, so it cannot deadlock').toBe(false);
    expect(aiTurn(s, 'product_owner'), 'the Developers wait for ever on a question nobody can answer')
      .toBeTruthy();
  });

  it('answers a request to come and look at finished work', () => {
    const s = started();
    const item = s.backlog.find((it) => it.started)!;
    const asked = askToCheck(setDraftDesign(s, item.id, {} as never), item.id);
    const q = (asked.questions ?? []).find((x) => x.id.startsWith('check-'));
    expect(q, 'asking for a look raised nothing, so nothing is being tested').toBeTruthy();
    expect(aiTurn(asked, 'product_owner'), 'work waits for ever on a sign-off nobody can give')
      .toBeTruthy();
  });

  it('answers where a thing should go', () => {
    const s = started();
    const item = s.backlog.find((it) => it.started)!;
    const asked = { ...s, pendingPlacement: { itemId: item.id, askedAt: s.daySecondsLeft } } as ZooGameState;
    expect(theirsToTake(asked, 'product_owner')).toBe(false);
    expect(aiTurn(asked, 'product_owner')?.action.type,
      'nobody can say where it goes, so the Developers stand still').toBe('ANSWER_PLACEMENT');
  });
});

describe('what is deliberately left with the player', () => {
  it('leaves opening Done work to visitors alone', () => {
    // Nothing in the seat played by the game opens anything, and only open items earn anything at
    // the Review - so taking this away would leave a zoo nobody can visit. It is also a decision
    // about the product rather than a step in executing the plan.
    const s = started();
    const anyOpen = (['product_owner', 'scrum_master', 'developer'] as const)
      .some((seat) => aiTurn({ ...s, backlog: s.backlog.map((it) => (it.started
        ? { ...it, status: 'done' as const } : it)) } as ZooGameState, seat)?.action.type === 'OPEN_ITEM');
    expect(anyOpen, 'somebody plays this now, so it could be taken from the player').toBe(false);
  });
});
