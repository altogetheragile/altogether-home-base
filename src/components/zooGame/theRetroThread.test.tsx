import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState } from './config';
import { openRetro, whatWeNoticed, yourRetroTurn } from './engine';
import { reducer } from './useZooGame';
import { SprintRetro } from './SprintRetro';
import type { ZooGameState, TeamDecision } from './types';

// The Retrospective, out loud.
//
// It had everything except the people. It read back what the Sprint cost - what was guessed at,
// what sat in Doing for three days, what the Daily Scrums were worth - and it read it back as a
// report. Nobody said any of it.
//
// A Retrospective is the Scrum Team talking about how they worked. Sam opens it, each of them says
// one thing they noticed, and you add yours. Every line is drawn from the Sprint's own log rather
// than written, which is the difference between inspecting and reminiscing: what is said in that
// room is only ever something that actually happened.
//
// "The Scrum Team only." No stakeholder is ever in it - it is the one event the Guide fences.

const afterASprint = (log: Partial<TeamDecision>[] = []): ZooGameState => {
  const base = initialZooState(3);
  return {
    ...base, phase: 'review', sprintNumber: 1, sprintDays: 3, dayNumber: 3,
    decisions: log.map((d) => ({ sprint: 1, kind: 'moved', what: '', ...d } as TeamDecision)),
  } as ZooGameState;
};

const thread = (s: ZooGameState) => (s.chat ?? []).filter((m) => m.kind === 'retro');

describe('the room', () => {
  it('fills as you walk into it', () => {
    // Posted when the phase turns, not by the AI beat. A Retrospective whose first six seconds are
    // spent watching people arrive has spent them on nothing.
    const s = reducer(afterASprint([{ kind: 'question', by: 'developer', what: 'nobody answered' }]),
      { type: 'SET_PHASE', phase: 'retro' });
    expect(thread(s).length, 'nobody said anything at the Retrospective').toBeGreaterThan(1);
  });

  it('is opened by the Scrum Master, who says nothing about the work', () => {
    // "The Scrum Master ensures that the event takes place." The Guide gives them no opinion about
    // what the team found, and a facilitator with one is a facilitator running the Retrospective
    // for the team rather than with them.
    const s = openRetro(afterASprint([{ kind: 'refinement', what: 'refined' }]));
    const first = thread(s)[0];
    expect(first.who, 'somebody other than the Scrum Master opened it').toBe('scrum_master');
    expect(first.text, 'the facilitator had an opinion about the work').toMatch(/How did we work/);
  });

  it('never lets anybody outside the Scrum Team into it', () => {
    // The one event the Guide fences. A stakeholder at a Retrospective is the commonest way it
    // stops being a Retrospective.
    const s = openRetro(afterASprint([{ kind: 'question', by: 'developer', what: 'x' }]));
    for (const m of thread(s)) {
      expect(m.who, `a ${m.who} is in the room`).not.toBe('stakeholder');
      expect(['scrum_master', 'developer', 'you']).toContain(m.who);
    }
  });

  it('gives everybody their own line, so nobody reads out the same one', () => {
    const s = openRetro(afterASprint([
      { kind: 'question', by: 'developer', what: 'nobody answered' },
      { kind: 'daily-scrum', what: 'Day 2: the Daily Scrum was not held.' },
      { kind: 'refinement', what: 'refined' },
    ]));
    const said = thread(s).filter((m) => m.who === 'developer').map((m) => m.text);
    expect(said.length, 'the Developers said nothing').toBeGreaterThan(1);
    expect(new Set(said).size, 'two of them read out the same observation').toBe(said.length);
  });

  it('does not start again when you come back to it', () => {
    // Opening it wipes the Sprint's build chatter, because the Retrospective's thread is about how
    // the team WORKED rather than what they said while working. Done twice, it wipes the one thing
    // in the room that was yours.
    const once = openRetro(afterASprint([{ kind: 'refinement', what: 'x' }]));
    const spoke = { ...once, chat: [...(once.chat ?? []),
      { id: 'yours', who: 'you' as const, from: 'You', text: 'And we never looked at the burndown.', day: 3, kind: 'retro' as const }] } as ZooGameState;
    const again = openRetro(spoke);
    expect(thread(again).map((m) => m.text), 'coming back to the room threw away what you had said')
      .toContain('And we never looked at the burndown.');
    expect(thread(again).length, 'the room filled up again on a second look').toBe(thread(spoke).length);
  });
});

describe('what gets said', () => {
  it('is only ever what the log says happened', () => {
    // A Retrospective inspecting something that did not happen is the one thing it cannot afford.
    const quiet = whatWeNoticed(afterASprint([]));
    expect(quiet, 'a Sprint with nothing in its log produced observations about it').toHaveLength(1);
    expect(quiet[0], 'a quiet Sprint reads as a broken screen').toMatch(/Nothing in the log stands out/);
  });

  it('counts what it is talking about', () => {
    const s = afterASprint([
      { kind: 'question', by: 'developer', what: 'a' },
      { kind: 'question', by: 'developer', what: 'b' },
    ]);
    expect(whatWeNoticed(s)[0], 'it does not say how many').toMatch(/We answered 2 questions ourselves/);
  });

  it('puts the costliest thing first', () => {
    // A Goal at risk that nobody mentioned outranks a day spent refining. A Retrospective that
    // leads with the cheapest thing in the log is a Retrospective about the wrong Sprint.
    const s = afterASprint([
      { kind: 'refinement', what: 'Day 2: the Product Backlog was refined during the Sprint.' },
      { kind: 'moved', what: 'Day 2: the Sprint Goal was at risk and nobody talked about it.' },
    ]);
    expect(whatWeNoticed(s)[0], 'the refinement outranked an unspoken risk to the Goal')
      .toMatch(/did not talk to the Product Owner/);
  });

  it('says the good things too, not only what went wrong', () => {
    const s = afterASprint([{ kind: 'moved', what: 'Ben put a second pair of hands on Main Pathways.' }]);
    expect(whatWeNoticed(s)[0], 'helping each other went unremarked').toMatch(/second pair of hands/);
  });

  it('leaves you something nobody else has said', () => {
    const many = [
      { kind: 'question' as const, by: 'developer', what: 'a' },
      { kind: 'daily-scrum' as const, what: 'Day 2: the Daily Scrum was not held.' },
      { kind: 'moved' as const, what: 'Day 2: the Sprint Goal was at risk and nobody talked about it.' },
      { kind: 'moved' as const, what: 'Ben put a second pair of hands on Main Pathways.' },
      { kind: 'refinement' as const, what: 'refined' },
    ];
    const s = afterASprint(many);
    const theirs = whatWeNoticed(s).slice(0, s.team.developers.length);
    for (const mine of yourRetroTurn(s)) {
      expect(theirs, `you were offered a line somebody had already said: "${mine}"`).not.toContain(mine);
    }
    expect(yourRetroTurn(s).length, 'there was nothing left for you to say').toBeGreaterThan(0);
  });
});

describe('the screen', () => {
  const retro = (s: ZooGameState, onSay: (t: string, k?: 'stand-up' | 'retro') => void = () => {}) => render(
    <MemoryRouter>
      <SprintRetro state={s} onNextSprint={() => {}} onSetDod={() => {}} onSay={onSay} />
    </MemoryRouter>,
  ).container;

  const busy = () => openRetro(afterASprint([
    { kind: 'question', by: 'developer', what: 'a' },
    { kind: 'daily-scrum', what: 'Day 2: the Daily Scrum was not held.' },
    { kind: 'moved', what: 'Day 2: the Sprint Goal was at risk and nobody talked about it.' },
    { kind: 'moved', what: 'Ben put a second pair of hands on Main Pathways.' },
    { kind: 'refinement', what: 'refined' },
  ]));

  it('draws the room, and says who is allowed in it', () => {
    const c = retro(busy());
    const room = c.querySelector('[data-part="retro-room"]');
    expect(room, 'the Retrospective is a report again: nobody in the room says anything').toBeTruthy();
    expect(room!.textContent, 'nothing says this is the Scrum Team only').toMatch(/Scrum Team only/);
    expect(room!.querySelectorAll('[data-part="chat-message"]').length).toBeGreaterThan(1);
  });

  it('gives you your turn, and takes it away once you have spoken', () => {
    const said: string[] = [];
    const open = busy();
    const c = retro(open, (t) => { said.push(t); });
    const turn = c.querySelector('[data-part="retro-your-turn"]')!;
    expect(turn, 'everybody speaks but you').toBeTruthy();
    fireEvent.click([...turn.querySelectorAll('button')][0]);
    expect(said, 'choosing a line said nothing').toEqual([yourRetroTurn(open)[0]]);

    const after = { ...open, chat: [...(open.chat ?? []),
      { id: 'yours', who: 'you' as const, from: 'You', text: said[0], day: 3, kind: 'retro' as const }] };
    expect(retro(after as ZooGameState).querySelector('[data-part="retro-your-turn"]'),
      'you are asked to speak again after you have spoken').toBeNull();
  });

  it('keeps the decision log underneath, because the room is not a replacement for it', () => {
    // The observations are what the team SAYS. The log is what happened, line by line, and the
    // Retrospective reads both: one is the conversation, the other is the evidence for it.
    expect(retro(busy()).textContent).toMatch(/Decision log/);
  });
});
