import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import { askToCheck, askIfDue, endDay, tickDay, guessUnanswered, settleOpenQuestions,
  theirsToAnswer, openQuestions, QUESTION_PATIENCE } from './engine';
import type { ZooGameState } from './types';

// Two things the game says at once, and the seam between them.
//
// The rail says somebody is waiting on you. The dock beside it says press this to move on. Both
// true, nothing joining them - so the game offered to move past a question it was asking, which is
// the opposite of what it means to wait on each other.
//
// Fixing the wording first meant finding out what ending the day actually DOES to an open question,
// and the answer was: two bugs.
//
// `GameQuestion.day` has said since it was written that a question cannot outlive the day it
// belongs to, and nothing read it. A question carried into tomorrow, where its patience clock was
// measured against a fresh day's seconds and read "waiting 0s of 25" while nobody was waiting.
//
// And the Developers answered whichever question was first in the list. A request to come and look
// at finished work expired after twenty-five seconds and was written into the decision log as "the
// Developers chose for themselves" - which they cannot do. Whether something is what was asked for
// is the Product Owner's and nobody else's.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const s = initialZooState(3);
  const pen = s.backlog.find((x) => x.category === 'enclosure')!;
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    sprintDays: 3, daySecondsLeft: 180, committedIds: [pen.id],
    backlog: s.backlog.map((x) => (x.id === pen.id
      ? { ...x, status: 'committed' as const, sprintNumber: 1, started: true, design: { shape: 'rounded' } } : x)),
    ...over,
  } as unknown as ZooGameState;
};
const penOf = (s: ZooGameState) => s.backlog.find((x) => x.status === 'committed')!;

describe('who may answer what', () => {
  it('lets the Developers answer a how', () => {
    // "Rounded or square" is how it gets built, and how it gets built is theirs. An unanswered one
    // costing the Product Owner the say is the lesson, not a bug.
    const asked = askIfDue(sprint({ backlog: initialZooState(3).backlog.map((x) => (x.category === 'enclosure'
      ? { ...x, status: 'committed' as const, sprintNumber: 1, started: true, design: undefined } : x)) } as Partial<ZooGameState>));
    const q = openQuestions(asked)[0];
    expect(q, 'the Developers never asked').toBeTruthy();
    expect(theirsToAnswer(q), 'a how is not theirs to answer').toBe(true);
  });

  it('does not let them answer an acceptance', () => {
    const s = sprint();
    const asked = askToCheck(s, penOf(s).id);
    expect(theirsToAnswer(openQuestions(asked)[0]), 'the Developers may accept their own work').toBe(false);
  });

  it('reads an old save by its id, which is where the difference always lived', () => {
    const q = { id: 'check-lion', of: 'product_owner' as const, from: 'Ada', text: '?', choices: [], askedAt: 10, day: 1 };
    expect(theirsToAnswer(q), 'a save from before the field loses the distinction').toBe(false);
    expect(theirsToAnswer({ ...q, id: 'fence-lion' })).toBe(true);
  });
});

describe('when nobody answers', () => {
  it('leaves an acceptance alone however long it waits', () => {
    // It used to vanish after 25 seconds, logged as a decision the Developers cannot make.
    const s = sprint();
    let st = askToCheck(s, penOf(s).id);
    for (let i = 0; i < QUESTION_PATIENCE + 10; i++) st = tickDay(st);
    expect(openQuestions(st).length, 'the request to check finished work expired').toBe(1);
    expect((st.decisions ?? []).some((d) => /chose for themselves/.test(d.what)),
      'the log says the Developers accepted their own work').toBe(false);
  });

  it('still lets a how expire, which is the lesson', () => {
    const s = sprint({ daySecondsLeft: 180 });
    const withQ = { ...s, questions: [{ id: 'fence-x', of: 'product_owner' as const, from: 'Ada',
      text: 'Rounded or square?', choices: [], askedAt: 180, day: 1, developersMayAnswer: true }] } as ZooGameState;
    const later = guessUnanswered({ ...withQ, daySecondsLeft: 180 - QUESTION_PATIENCE } as ZooGameState);
    expect(openQuestions(later).length).toBe(0);
    expect((later.decisions ?? []).some((d) => /chose for themselves/.test(d.what))).toBe(true);
  });

  it('closes a how when the day ends, rather than carrying it into tomorrow', () => {
    // Carried over, its clock was measured against a fresh day and read "waiting 0s of 25" with
    // nobody waiting at all. A question belongs to the day it was asked on.
    const s = sprint({ daySecondsLeft: 20 });
    const withQ = { ...s, questions: [{ id: 'fence-x', of: 'product_owner' as const, from: 'Ada',
      text: 'Rounded or square?', choices: [], askedAt: 30, day: 1, developersMayAnswer: true }] } as ZooGameState;
    const next = endDay(withQ);
    expect(openQuestions(next).length, 'the how outlived its day').toBe(0);
    expect((next.decisions ?? []).find((d) => d.kind === 'question')?.cost,
      'the day ending is not named as what settled it').toMatch(/day ended/i);
  });

  it('carries an acceptance over, because the day is not what answers it', () => {
    const s = sprint({ daySecondsLeft: 20 });
    const asked = askToCheck(s, penOf(s).id);
    expect(openQuestions(settleOpenQuestions(asked)).length, 'the acceptance was closed by the clock').toBe(1);
    expect(openQuestions(endDay(asked)).length, 'the acceptance was closed by the day ending').toBe(1);
  });
});

describe('the rail', () => {
  const rail = (s: ZooGameState) => render(
    <MemoryRouter><ActionRail state={s} seat="product_owner" onAnswerQuestion={() => {}} /></MemoryRouter>,
  );

  it('counts down the question that has a clock', () => {
    const s = sprint({ daySecondsLeft: 170 });
    const withQ = { ...s, questions: [{ id: 'fence-x', of: 'product_owner' as const, from: 'Ada',
      text: 'Rounded or square?', choices: [{ key: 'theirs', label: 'Your call' }], askedAt: 180, day: 1,
      developersMayAnswer: true }] } as ZooGameState;
    const { container } = rail(withQ);
    expect(container.textContent).toMatch(new RegExp(`waiting 10s of ${QUESTION_PATIENCE}`));
  });

  it('does not count down one that never expires', () => {
    // The rail was saying something was about to happen when nothing was.
    const s = sprint();
    const { container } = rail(askToCheck(s, penOf(s).id));
    expect(container.textContent, 'an acceptance is counted down to a threshold it never reaches')
      .not.toMatch(new RegExp(`of ${QUESTION_PATIENCE}`));
    expect(container.textContent).toMatch(/nobody else can answer it/i);
  });
});

describe('the dock, while something is being asked', () => {
  const noop = () => {};
  const board = (state: ZooGameState) => render(
    <MemoryRouter>
      <SprintBoard state={state} onEstimate={noop} onToggleTask={noop} onFinishItem={noop}
        onStartItem={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop}
        onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop}
        onBuilding={noop} />
    </MemoryRouter>,
  );

  it('says what ending the day costs when the answer is theirs to take', () => {
    const s = sprint({ daySecondsLeft: 170 });
    const withQ = { ...s, questions: [{ id: 'fence-x', of: 'product_owner' as const, from: 'Ada',
      text: 'Rounded or square?', choices: [], askedAt: 180, day: 1, developersMayAnswer: true }] } as ZooGameState;
    board(withQ);
    const chip = document.querySelector('[data-part="unanswered"]');
    expect(chip, 'the dock offers to move on with no sign that anything is waiting').toBeTruthy();
    expect(chip!.textContent).toMatch(/Ada is waiting/);
    expect(document.body.textContent, 'what ending the day does to the question is not said')
      .toMatch(/End the day and the Developers decide it themselves/);
  });

  it('says the other thing when only the Product Owner can answer', () => {
    const s = sprint();
    board(askToCheck(s, penOf(s).id));
    expect(document.querySelector('[data-part="unanswered"]')!.textContent).toMatch(/waiting to be checked/);
    expect(document.body.textContent, 'the dock claims ending the day settles an acceptance')
      .toMatch(/Ending the day does not accept it - it carries into Day 2/);
  });

  it('says where it goes instead on the last day of the Sprint', () => {
    const s = sprint({ dayNumber: 3, sprintDays: 3 });
    board(askToCheck(s, penOf(s).id));
    expect(document.body.textContent, 'the last day promises a tomorrow the Sprint does not have')
      .toMatch(/the Sprint ends and it goes to the Review unaccepted/);
  });

  it('says nothing when nothing is being asked', () => {
    board(sprint());
    expect(document.querySelector('[data-part="unanswered"]'), 'the dock warns about nothing').toBeNull();
  });

  it('still lets the day end - it names the price, it does not block', () => {
    // A Product Owner who has wandered off cannot be allowed to stall a Sprint, which is why the
    // question has a clock at all. The fix is a sentence, not a gate.
    const onEndDay = vi.fn();
    const s = sprint();
    render(
      <MemoryRouter>
        <SprintBoard state={askToCheck(s, penOf(s).id)} onEstimate={noop} onToggleTask={noop}
          onFinishItem={noop} onStartItem={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop}
          onOpen={noop} onEndDay={onEndDay} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
          onStartDay={noop} onBuilding={noop} />
      </MemoryRouter>,
    );
    screen.getByRole('button', { name: /End Day/ }).click();
    expect(onEndDay, 'the dock refused to end the day').toHaveBeenCalled();
  });
});
