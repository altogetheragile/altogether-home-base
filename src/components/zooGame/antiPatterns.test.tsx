import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintRetro } from './SprintRetro';
import { antiPatterns, askIfDue, answerQuestion, guessUnanswered, startItem, QUESTION_PATIENCE } from './engine';
import { initialZooState, DAY_SECONDS } from './config';
import type { ZooGameState } from './types';

// Free play allows it, names it, and shows the cost at the Retrospective.
//
// The game does not refuse a Product Owner who answers "timber", takes work off the board, or is
// simply not there. All three are things real Product Owners do, and a game that refuses them
// teaches nothing about why they matter. So each one is allowed, recorded in the same log as
// everything else, and read back where a team is supposed to look at how it works.

const sprint = (): ZooGameState => {
  const base = initialZooState(3);
  const enc = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [enc.id],
    backlog: base.backlog.map((it) => (it.id === enc.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: [base.team.developers[0].id] }
      : it)),
  } as ZooGameState;
};

describe('what the Sprint showed', () => {
  it('counts the questions nobody answered', () => {
    const asked = askIfDue(sprint());
    const waited = { ...asked, daySecondsLeft: asked.daySecondsLeft - QUESTION_PATIENCE } as ZooGameState;
    const habits = antiPatterns(guessUnanswered(waited));
    const absent = habits.find((h) => h.id === 'absent-po')!;
    expect(absent, 'nobody answered all Sprint and the Retrospective says nothing').toBeTruthy();
    expect(absent.what).toMatch(/chose for themselves/);
    expect(absent.instead, 'the habit is named with no Scrum answer beside it').toMatch(/answers in seconds/);
  });

  it('counts the times how was decided for the Developers', () => {
    const asked = askIfDue(sprint());
    const habits = antiPatterns(answerQuestion(asked, (asked.questions ?? [])[0].id, 'timber'));
    const how = habits.find((h) => h.id === 'po-decides-how')!;
    expect(how, 'the Product Owner decided how and nothing noticed').toBeTruthy();
    expect(how.instead).toMatch(/your call/i);
  });

  it('counts a Product Owner on the tools, without refusing them', () => {
    // Nothing else in Doing, so the work-in-progress limit is not what is being tested here.
    const s = sprint();
    const next = s.backlog.find((it) => it.status === 'backlog' && !it.unsized && it.category !== 'exhibit')!;
    const clear = {
      ...s, wipLimit: 0,
      backlog: s.backlog.map((it) => (it.id === next.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1 }
        : { ...it, started: false })),
    } as ZooGameState;
    const taken = startItem(clear, next.id, 'product_owner');
    const tools = antiPatterns(taken).find((h) => h.id === 'po-on-the-tools')!;
    expect(tools, 'a Product Owner built the work and the game said nothing').toBeTruthy();
    expect(tools.instead, 'the game told them off instead of saying what it costs').toMatch(/They may work as a Developer/);
  });

  it('names a Sprint run with nobody having agreed what Done means', () => {
    const habit = antiPatterns(sprint()).find((h) => h.id === 'no-dod')!;
    expect(habit, 'the Sprint ran with no Definition of Done and the Retrospective said nothing').toBeTruthy();
    expect(habit.instead).toMatch(/One bar for every item/);
  });

  it('says nothing where there is nothing to say', () => {
    const quiet = { ...sprint(), dodAgreed: true } as ZooGameState;
    expect(antiPatterns(quiet), 'a quiet Sprint was given a list of faults').toEqual([]);
  });
});

describe('the Retrospective reads them back', () => {
  it('puts the habits under the log they came from', () => {
    const asked = askIfDue(sprint());
    const answered = answerQuestion(asked, (asked.questions ?? [])[0].id, 'stone');
    const retro = { ...answered, phase: 'retro' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintRetro state={retro} onNextSprint={() => {}} onSetDod={() => {}} onSetSprintDays={() => {}} />
      </MemoryRouter>,
    );
    const habits = container.querySelector('[data-part="habits"]')!;
    expect(habits, 'the Retrospective shows the log and none of the habits in it').toBeTruthy();
    expect(habits.textContent).toMatch(/How it gets built was decided for them/);
    // Not a telling-off: the game allowed it, and whether it was a problem is the conversation.
    expect(habits.textContent).toMatch(/the conversation is the event/);
  });
});
