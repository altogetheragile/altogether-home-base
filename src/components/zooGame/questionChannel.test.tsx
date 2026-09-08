import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { askIfDue, answerQuestion, guessUnanswered, waitingOn, QUESTION_PATIENCE } from './engine';
import { reducer } from './useZooGame';
import { initialZooState, DAY_SECONDS } from './config';
import type { ZooGameState } from './types';

// A question is a card addressed to a seat.
//
// The Product Owner was idle for three days between Planning and the Review, and the Developers had
// no way to ask them anything. A question now sits on the seat it is addressed to, shows as "waiting
// on them" on the item for everybody else, and carries a clock - because the cost of not answering
// is the thing being taught. Past the threshold the Developers answer it themselves, and the guess
// is logged with everything else.
//
// The question the game asks first is the one a Product Owner should not answer. "Timber or stone?"
// is how, and how is the Developers' own: "your call" is the right reply, and the wrong one is
// named in the log without a telling-off.

const building = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const enc = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [enc.id],
    backlog: base.backlog.map((it) => (it.id === enc.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: [base.team.developers[0].id] }
      : it)),
    ...over,
  } as ZooGameState;
};

describe('a question with a clock on it', () => {
  it('is asked by the Developer holding the work, and addressed to the Product Owner', () => {
    const s = askIfDue(building());
    const q = (s.questions ?? [])[0];
    expect(q, 'nobody ever asks the Product Owner anything').toBeTruthy();
    expect(q.of, 'the question was addressed to the wrong accountability').toBe('product_owner');
    expect(q.from).toBe(s.team.developers[0].name);
    expect(q.text, 'the question is not about anything the game has').toMatch(/Rounded or square/);
    expect(q.choices.map((c) => c.key)).toContain('theirs');
  });

  it('shows on the item as waiting on somebody, for everybody', () => {
    const s = askIfDue(building());
    const q = (s.questions ?? [])[0];
    expect(waitingOn(s, q.itemId!)?.of, 'the card says nothing about who is being waited on').toBe('product_owner');
  });

  it('records who asked, who answered and how long they waited', () => {
    const asked = askIfDue(building());
    const later = { ...asked, daySecondsLeft: asked.daySecondsLeft - 12 } as ZooGameState;
    const answered = answerQuestion(later, (asked.questions ?? [])[0].id, 'theirs');
    expect(answered.questions ?? [], 'the question stayed open after it was answered').toHaveLength(0);
    const noted = (answered.decisions ?? [])[(answered.decisions ?? []).length - 1];
    expect(noted.kind).toBe('question');
    expect(noted.what).toMatch(/left it to the Developers/);
    expect(noted.cost).toMatch(/12s/);
  });

  it('names the wrong answer without telling anybody off', () => {
    const asked = askIfDue(building());
    const answered = answerQuestion(asked, (asked.questions ?? [])[0].id, 'rounded');
    const noted = (answered.decisions ?? [])[(answered.decisions ?? []).length - 1];
    expect(noted.what).toMatch(/chose Rounded/);
    expect(noted.cost, 'nothing says whose decision it actually was').toMatch(/decided for them/);
  });

  it('is answered by the Developers themselves when nobody answers in time', () => {
    const asked = askIfDue(building());
    const waited = { ...asked, daySecondsLeft: asked.daySecondsLeft - QUESTION_PATIENCE } as ZooGameState;
    const after = guessUnanswered(waited);
    expect(after.questions ?? [], 'the question is still waiting on an absent Product Owner').toHaveLength(0);
    const noted = (after.decisions ?? [])[(after.decisions ?? []).length - 1];
    expect(noted.by, 'the guess was attributed to somebody who was not there').toBe('developer');
    expect(noted.what).toMatch(/nobody answered/);
  });

  it('waits before guessing - the clock is the cost, not a countdown to nothing', () => {
    const asked = askIfDue(building());
    const soon = { ...asked, daySecondsLeft: asked.daySecondsLeft - 3 } as ZooGameState;
    expect(guessUnanswered(soon).questions ?? [], 'the Developers gave up after three seconds').toHaveLength(1);
  });

  it('is asked while the day runs, and only once for the same item', () => {
    let s = building();
    for (let i = 0; i < 3; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect((s.questions ?? []).length, 'the day ran and nobody asked anything').toBe(1);
    const answered = answerQuestion(s, (s.questions ?? [])[0].id, 'theirs');
    const again = askIfDue(answered);
    expect(again.questions ?? [], 'the same question was put twice').toHaveLength(0);
  });
});

describe('the rail carries it', () => {
  it('puts the question, its clock and its answers on the line', () => {
    const onAnswerQuestion = vi.fn();
    const asked = askIfDue(building());
    const later = { ...asked, daySecondsLeft: asked.daySecondsLeft - 9 } as ZooGameState;
    const { container } = render(
      <MemoryRouter><ActionRail state={later} onAnswerQuestion={onAnswerQuestion} /></MemoryRouter>,
    );
    const rail = container.querySelector('[data-part="action-rail"]')!;
    expect(rail.textContent).toMatch(/Rounded or square/);
    expect(rail.textContent, 'the rail does not say how long they have been waiting').toMatch(/waiting 9s/);
    fireEvent.click(screen.getByRole('button', { name: 'Your call' }));
    expect(onAnswerQuestion).toHaveBeenCalledWith((asked.questions ?? [])[0].id, 'theirs');
  });
});
