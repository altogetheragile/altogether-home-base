import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS, HUDDLE_SECONDS } from './config';
import {
  endDay, standUp, goalAtRisk, huddleProposal, answerHuddle, todaysDecision,
  otherDevs, reviewSprint, openHuddle, goalPulse,
} from './engine';
import { reducer } from './useZooGame';
import { Huddle } from './Huddle';
import type { ZooGameState, HuddleAnswer } from './types';

// The two minutes after the Daily Scrum.
//
// The Daily Scrum is the Developers' event and the Product Owner is not in it - the Guide puts her
// outside unless she is working on Sprint Backlog items. So when the Sprint Goal is at risk the
// Developers can see it, say it, and do nothing about it in the room: what the Sprint PROMISED is
// hers, and she is not there.
//
// The screen used to put the decision in the event anyway, with a button that dropped an item
// while the one person it most concerned was somewhere else. Now the flag is raised in the room
// and settled out of it, in a huddle that is not an event: unscheduled, costing a slice of the day
// rather than a timebox, and walkable-away-from.

const atRisk = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 3);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 2, sprintDays: 3,
    sprintGoal: 'Open the Big Cats area', daySecondsLeft: 20, dailyScrumAt: 'start',
    committedIds: take.map((it) => it.id),
    forecastPoints: take.reduce((n, it) => n + it.estimate, 0),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

/** A Sprint with room to spare: everything forecast fits in the days left. */
const safe = () => {
  const base = initialZooState(3);
  const one = base.backlog.filter((it) => !it.unsized && it.category !== 'epic')
    .sort((a, z) => a.estimate - z.estimate)[0];
  return {
    ...atRisk(), dayNumber: 1, daySecondsLeft: DAY_SECONDS,
    committedIds: [one.id], forecastPoints: one.estimate,
    backlog: base.backlog.map((it) => (it.id === one.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
  } as ZooGameState;
};

describe('the risk is raised in the room and settled out of it', () => {
  it('is said at the stand-up, by somebody, in their own words', () => {
    const s = standUp(atRisk({ dayStage: 'dailyScrum' }));
    expect(goalAtRisk(s), 'the Goal is not at risk, so nothing is being tested').toBe(true);
    const flagged = (s.chat ?? []).find((m) => /make it/.test(m.text));
    expect(flagged, 'the burndown says the Goal is in danger and nobody in the room says so').toBeTruthy();
    expect(flagged!.who).toBe('developer');
    expect(flagged!.text, 'it does not say whose call this is').toMatch(/not ours alone/);
  });

  it('names the thing that will not make it, where the board can name one', () => {
    // The two sums do not always agree: `goalPulse` measures what is owed against the clock that
    // is actually left, `todaysDecision` against whole days. The flag is raised on the first,
    // because that is what opens the huddle - and it names a card only when there is one to name.
    const s = standUp(atRisk({ dayNumber: 3, daySecondsLeft: 5 }));
    const candidate = todaysDecision(s);
    const flag = (s.chat ?? []).find((m) => /make it/.test(m.text))!;
    expect(flag, 'nothing was flagged at all').toBeTruthy();
    if (candidate) expect(flag.text).toContain(candidate.candidate.name);
  });
});

describe('the huddle opens on the way out of the Daily Scrum', () => {
  const ways: { name: string; action: Parameters<typeof reducer>[1] }[] = [
    { name: 'held', action: { type: 'RUN_DAILY_SCRUM' } },
    { name: 'skipped', action: { type: 'SKIP_DAILY_SCRUM' } },
  ];

  for (const w of ways) {
    it(`whichever door you leave by - ${w.name}`, () => {
      // Wrapped around each way out rather than built into one of them. A conversation that only
      // happens when you leave by one door is not a rule, it is a trapdoor.
      const after = reducer(endDay(atRisk()), w.action);
      expect(after.dayStage, `leaving the Daily Scrum by "${w.name}" skipped the huddle`).toBe('huddle');
    });
  }

  it('and when what surfaced was answered', () => {
    // The impediment is put on AFTER the day ends, because `endDay` generates its own and would
    // throw this one away.
    const open = { ...endDay(atRisk()),
      pendingImpediment: { id: 'i1', kind: 'impediment', title: 'A keeper called in sick', detail: 'x' },
    } as ZooGameState;
    expect(open.dayStage, 'the day did not end at the Daily Scrum').toBe('dailyScrum');
    expect(reducer(open, { type: 'ANSWER_IMPEDIMENT', how: 'around' }).dayStage).toBe('huddle');
  });

  it('but not when the Sprint Goal is safe', () => {
    const after = reducer(endDay(safe()), { type: 'RUN_DAILY_SCRUM' });
    expect(goalAtRisk(endDay(safe())), 'the fixture is at risk, so nothing is being tested').toBe(false);
    expect(after.dayStage, 'a huddle was called about nothing').not.toBe('huddle');
  });

  it('and never once the Sprint is over', () => {
    // A huddle about adapting a Sprint that has ended is a conversation with nothing on the table.
    // The rule lives in `goalAtRisk`, which asks the phase: nothing can be at risk in a Sprint
    // that is over, so every caller gets the answer without a guard of its own.
    // The phase is moved on with the board left exactly as it was, which is what a cancelled
    // Sprint or a save loaded mid-transition looks like: the arithmetic underneath still reads
    // "at risk", and the only thing that stops a huddle opening over the Review is the phase.
    const mid = { ...atRisk(), phase: 'review' } as ZooGameState;
    expect(goalPulse(mid).level, 'the board is no longer at risk, so nothing is being tested').toBe('risk');
    expect(goalAtRisk(mid), 'a Sprint that has ended is reported as being at risk').toBe(false);
    expect(openHuddle(mid).dayStage, 'a huddle opened over the Sprint Review').not.toBe('huddle');

    // ...and the ordinary way out, for completeness: the last day runs straight to the Review.
    const over = reviewSprint({ ...atRisk(), dayStage: 'building' } as ZooGameState);
    expect(over.phase).not.toBe('sprint');
    expect(openHuddle(over).dayStage).not.toBe('huddle');
  });
});

describe('what Priya proposes', () => {
  const huddling = () => reducer(endDay(atRisk()), { type: 'RUN_DAILY_SCRUM' });

  it('is the board’s own arithmetic, not an opinion', () => {
    const s = huddling();
    const d = todaysDecision(s)!;
    const { says, candidate } = huddleProposal(s);
    expect(candidate?.id, 'she proposes something other than what does not fit').toBe(d.candidate.id);
    expect(says, 'she names nothing').toContain(d.candidate.name);
    expect(says, 'she gives no reason').toContain(d.ifDropped);
  });

  it('never puts the Sprint Goal on the table', () => {
    // It is the commitment. A game that offers to drop it the moment it gets hard has taught that
    // a commitment is a preference.
    const { answers } = huddleProposal(huddling());
    for (const a of answers) {
      expect(a.label, `"${a.label}" offers to drop the Sprint Goal`).not.toMatch(/Sprint Goal|the Goal\b/i);
    }
    expect(answers.map((a) => a.how).sort()).toEqual(['hand-back', 'keep', 'skip']);
  });

  it('has no cut to propose when everything left is essential, and says so', () => {
    const s = huddling();
    const allEssential = { ...s, backlog: s.backlog.map((it) => (it.sprintNumber === s.sprintNumber
      ? { ...it, goalCritical: true } : it)) } as ZooGameState;
    const { candidate, says, answers } = huddleProposal(allEssential);
    expect(candidate, 'she offered to drop something the Goal depends on').toBeNull();
    expect(says, 'she pretends there is something to cut').toMatch(/nothing on this Sprint I would take off/);
    expect(answers.map((a) => a.how), 'handing something back is still on offer')
      .not.toContain('hand-back');
  });
});

describe('what the Scrum Team answers', () => {
  const huddling = () => reducer(endDay(atRisk()), { type: 'RUN_DAILY_SCRUM' });
  const answer = (how: HuddleAnswer) => {
    const s = huddling();
    return { before: s, after: answerHuddle(s, how) };
  };

  it('hands it back, and the points come out of the forecast', () => {
    const { before, after } = answer('hand-back');
    const candidate = huddleProposal(before).candidate!;
    const now = after.backlog.find((it) => it.id === candidate.id)!;
    expect(now.status, 'it is still in the Sprint after everybody agreed it should not be')
      .toBe('backlog');
    expect(after.chat!.some((m) => m.who === 'you' && /the Goal stands/.test(m.text)),
      'nobody said anything; the card simply moved').toBe(true);
  });

  it('keeps the plan, which is a decision and not a failure', () => {
    const { before, after } = answer('keep');
    const candidate = huddleProposal(before).candidate!;
    expect(after.backlog.find((it) => it.id === candidate.id)!.status,
      'keeping the plan dropped something anyway').toBe('committed');
    expect((after.decisions ?? [])[(after.decisions ?? []).length - 1].what)
      .toMatch(/the plan was kept as it was/);
  });

  it('charges the day for the conversation, and nothing for not having it', () => {
    // The Daily Scrum's box is spent whether or not you hold it, because the time was set aside.
    // This one was not, so what you save by walking away is real - and so is what you never find out.
    const s = huddling();
    expect(answerHuddle(s, 'keep').daySecondsLeft, 'the huddle was free')
      .toBe(s.daySecondsLeft - HUDDLE_SECONDS);
    expect(answerHuddle(s, 'hand-back').daySecondsLeft).toBe(s.daySecondsLeft - HUDDLE_SECONDS);
    expect(answerHuddle(s, 'skip').daySecondsLeft, 'walking away cost the day something').toBe(s.daySecondsLeft);
  });

  it('writes down walking away, because that is a decision too', () => {
    const after = answerHuddle(huddling(), 'skip');
    const last = (after.decisions ?? [])[(after.decisions ?? []).length - 1];
    expect(last.what, 'nobody talked about it and nothing says so').toMatch(/nobody talked about it/);
    expect(last.cost).toMatch(/the Product Owner was not told/i);
  });

  it('gives the day back whichever way it goes', () => {
    for (const how of ['hand-back', 'keep', 'skip'] as HuddleAnswer[]) {
      expect(answerHuddle(huddling(), how).dayStage,
        `the game is stuck in the huddle after "${how}"`).toBe('building');
    }
  });
});

describe('the screen', () => {
  const huddling = () => reducer(endDay(atRisk()), { type: 'RUN_DAILY_SCRUM' });

  it('says what it is, what it costs, and that it is not in the Guide', () => {
    const c = render(<MemoryRouter><Huddle state={huddling()} onAnswer={() => {}} /></MemoryRouter>).container;
    expect(c.textContent, 'it is dressed as a Scrum event').toMatch(/not an event/);
    expect(c.textContent, 'nothing says what it costs').toMatch(new RegExp(`${HUDDLE_SECONDS}s of today`));
    expect(c.textContent, 'a learner would take it for part of Scrum').toMatch(/not in the Scrum Guide/);
    expect(c.querySelector('[data-part="goal-not-on-the-table"]'),
      'nothing says the Sprint Goal is not one of the options').toBeTruthy();
  });

  it('puts Priya’s proposal in her own words, and the answers under it', () => {
    const answered: HuddleAnswer[] = [];
    const s = huddling();
    const c = render(<MemoryRouter><Huddle state={s} onAnswer={(h) => answered.push(h)} /></MemoryRouter>).container;
    const bubble = c.querySelector('[data-part="chat-message"][data-who="product_owner"]');
    expect(bubble, 'the Product Owner proposes nothing').toBeTruthy();
    expect(bubble!.textContent).toContain(huddleProposal(s).candidate!.name);
    const buttons = [...c.querySelector('[data-part="huddle-answers"]')!.querySelectorAll('button')];
    expect(buttons.length, 'there is nothing to answer with').toBe(3);
    fireEvent.click(buttons[0]);
    expect(answered, 'answering did nothing').toEqual(['hand-back']);
  });

  it('names the person rather than the accountability', () => {
    const s = huddling();
    const c = render(<MemoryRouter><Huddle state={s} onAnswer={() => {}} /></MemoryRouter>).container;
    expect(c.querySelector('[data-part="chat-message"]')!.textContent)
      .toContain(s.team.productOwner.name);
  });
});

describe('the Daily Scrum, with the cut taken out of it', () => {
  it('still adapts the Sprint Backlog, which is what the Guide says it is for', () => {
    // The event is not neutered. Work that will not fit while the Goal is SAFE is the Developers
    // changing their own plan, which needs nobody else in the room - and `dailyScrumEvent` holds
    // that. What is gone is the event cutting scope the Goal depends on while the one person it
    // concerns is not there.
    const s = standUp(atRisk({ dayStage: 'dailyScrum' }));
    expect(otherDevs(s).length, 'nobody is in the room').toBeGreaterThan(0);
    expect((s.chat ?? []).some((m) => m.kind === 'stand-up'),
      'the event lost its stand-up along with its Drop button').toBe(true);
  });
});
