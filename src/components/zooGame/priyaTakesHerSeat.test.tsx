import { describe, it, expect } from 'vitest';
import { aiTurn, SOLO_AI_SEATS } from './aiSeats';
import { initialZooState } from './config';
import { planSprint, availableItems } from './engine';
import type { ZooGameState, GameQuestion } from './types';

// The seats nobody is sitting in, played while the Developers build.
//
// Two things were in the way. The beat stopped for EVERY seat while the Developers had work in
// flight, so a Product Owner went silent the moment anybody pulled a card - which is most of a
// Sprint, and exactly the part where clarifying matters (#880). And a question about HOW the work
// gets built had no answer in that seat at all, so the one decision a Product Owner should hand
// back was the one she never got to.

const sprint = (): ZooGameState => {
  const base = initialZooState(1);
  const picks = availableItems(base).slice(0, 4).map((it) => it.id);
  return { ...planSprint(base, picks), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
const howQuestion = (s: ZooGameState): ZooGameState => ({
    ...s,
    questions: [{
      id: 'fence-x', of: 'product_owner', from: 'Ada',
      itemId: s.backlog.find((it) => it.status === 'committed')!.id,
      text: 'Rounded or square?', askedAt: s.daySecondsLeft, day: 1,
      choices: [{ key: 'rounded', label: 'Rounded' }, { key: 'square', label: 'Square' },
        { key: 'theirs', label: 'Your call', note: 'How it gets built is the Developers’.' }],
  } as GameQuestion],
});

describe('a how question', () => {
  it('is handed back by the Product Owner, not answered', () => {
    const move = aiTurn(howQuestion(sprint()), 'product_owner');
    expect(move, 'the Product Owner has no answer to a how question').toBeTruthy();
    expect(move!.action).toMatchObject({ type: 'ANSWER_QUESTION', id: 'fence-x', choice: 'theirs' });
    expect(move!.says, 'she answers it instead of handing it back').toMatch(/your call/i);
  });

  it('is found by the answer that keeps the decision where it belongs', () => {
    // Not by matching the wording: the question knows which of its choices is the one that hands
    // it back, so a differently worded how question is handed back too.
    const s = howQuestion(sprint());
    const reworded = { ...s, questions: [{ ...s.questions![0], text: 'Timber or stone?' }] } as ZooGameState;
    expect(aiTurn(reworded, 'product_owner')!.action).toMatchObject({ choice: 'theirs' });
  });

  it('is left alone when there is no such answer to give', () => {
    // A question with no "your call" among its choices is a what or a why, and those are hers.
    const s = howQuestion(sprint());
    const whatWhy = { ...s, questions: [{ ...s.questions![0],
      choices: [{ key: 'families', label: 'Families' }, { key: 'everyone', label: 'Everyone' }] }] } as ZooGameState;
    const move = aiTurn(whatWhy, 'product_owner');
    expect(move?.action, 'a what-or-why question was handed back as if it were a how')
      .not.toMatchObject({ type: 'ANSWER_QUESTION', choice: 'theirs' });
  });
});

describe('which seats a game played alone hands over', () => {
  it('keeps the Developers for the player', () => {
    // "Always a developer when we execute the plan from the SBL."
    expect(SOLO_AI_SEATS, 'the game plays the Developers, so there is nothing for the player to do')
      .not.toContain('developer');
  });

  it('keeps the Daily Scrum for the player too', () => {
    // The Scrum Master's clearest move here is holding the Daily Scrum, and that is the
    // Developers' event - the one the player is now sitting in. Played by the game it would be
    // held a few seconds after it opened and the player would decide nothing in it.
    const s = { ...sprint(), dayStage: 'dailyScrum' } as ZooGameState;
    expect(aiTurn(s, 'scrum_master')?.action.type,
      'the Scrum Master seat no longer holds the Daily Scrum, so this test is the stale one')
      .toBe('RUN_DAILY_SCRUM');
    expect(SOLO_AI_SEATS, 'the game holds the player\u2019s own Daily Scrum for them')
      .not.toContain('scrum_master');
  });

  it('hands over the Product Owner, who is the point of the exercise', () => {
    expect(SOLO_AI_SEATS, 'nobody is playing the Product Owner, so the player still is')
      .toContain('product_owner');
  });
});

