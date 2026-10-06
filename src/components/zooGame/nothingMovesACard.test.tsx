import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import { startItem, tickDay, endDay, proposeMove, agreeMove, declineMove, waitingOnYou,
  wasTurnedDown, otherDevs, ASKS_FIRST } from './engine';
import { useAiSeats, asProposed } from './useZooSession';
import type { ZooGameState, ZooAction, ScrumTeamMember } from './types';
import type { SeatName } from './useZooSessions';

// Nothing moves a card but you, or somebody asking you first.
//
// Reported from playing it: "The pulling of the PBIs and the messages that pop up is very quick and
// confusing. All card movements need to be at least prompted and agreed."
//
// The colleagues worked at about a move a second. A card was taken, built and asked about before
// the line saying it had been taken had been read. So a Developer played by the game holds the card
// up instead, says what they want to do, and waits - and the day clock waits with them, because a
// game that charges you for reading has not slowed down at all.
//
// It is a pace control, not a rule of Scrum, and the rail says so: the Developers own the Sprint
// Backlog and who takes what is theirs to settle. That sentence is on the row, because a game that
// asks your permission for a colleague's pull and says nothing teaches the opposite.

const sprint = (): ZooGameState => {
  const s0 = initialZooState(3) as ZooGameState;
  const free = s0.backlog.filter((it) => it.status === 'backlog'
    && !['epic', 'exhibit', 'need'].includes(it.category) && !it.unsized).slice(0, 3);
  return { ...s0, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    sprintDays: 3, daySecondsLeft: 180, wipLimit: 0, committedIds: free.map((f) => f.id),
    backlog: s0.backlog.map((it) => (free.some((f) => f.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
};
const spare = (s: ZooGameState) => s.backlog.find((it) => it.status === 'committed' && !it.started)!;
const ben = (s: ZooGameState) => otherDevs(s)[0];

describe('a colleague who wants to move a card', () => {
  it('holds it up instead, and the card does not move', () => {
    const s = sprint();
    const card = spare(s);
    const asked = proposeMove(s, ben(s).id, { kind: 'pull', itemId: card.id }, 'Taking the Toilets next.');
    expect(waitingOnYou(asked), 'nobody is waiting on anybody').toBe(true);
    expect(asked.backlog.find((it) => it.id === card.id)!.started,
      'the card moved while the question was still open').toBeFalsy();
  });

  it('is one at a time', () => {
    // Two colleagues each holding up a card is a queue, and a queue is what was wrong with the
    // old pace.
    const s = sprint();
    const one = proposeMove(s, ben(s).id, { kind: 'pull', itemId: spare(s).id }, 'One.');
    const two = proposeMove(one, otherDevs(s)[1].id, { kind: 'pull', itemId: spare(s).id }, 'Two.');
    expect(two.proposed?.says, 'a second question pushed the first off the rail').toBe('One.');
  });

  it('moves the card when you agree, in the asker’s name', () => {
    const s = sprint();
    const card = spare(s);
    const done = agreeMove(proposeMove(s, ben(s).id, { kind: 'pull', itemId: card.id }, 'Taking it.'));
    const moved = done.backlog.find((it) => it.id === card.id)!;
    expect(moved.started, 'you said yes and nothing happened').toBe(true);
    expect(moved.pulledBy, 'it was taken in somebody else’s name').toBe(ben(s).id);
    expect(waitingOnYou(done), 'the question stayed on the rail after it was answered').toBe(false);
  });

  it('is one line in the thread, not three', () => {
    // The whole point of asking is fewer messages, not more. The question lives on the rail; the
    // thread gets the move's own line and nothing else. A "Go ahead." of your own would put the
    // count straight back to two for one act.
    const s = sprint();
    const before = (s.chat ?? []).length;
    const asked = proposeMove(s, ben(s).id, { kind: 'pull', itemId: spare(s).id },
      'Nothing of mine left, so I will take the Toilets.');
    expect((asked.chat ?? []).length, 'asking wrote a line of its own').toBe(before);
    const agreed = agreeMove(asked);
    expect((agreed.chat ?? []).length - before, 'agreeing wrote more than the move itself').toBe(1);
    const line = (agreed.chat ?? [])[before];
    expect(line.from, 'the line is not in the Developer’s name').toBe(ben(s).name);
    // Their own sentence, not a stub. What they said when they asked is the reason for the move,
    // and it is the thing worth having in the thread a Retrospective reads back.
    expect(line.text, 'the thread lost what they actually said').toMatch(/Nothing of mine left/);
  });

  it('writes nothing to the thread when you say not yet, and a decision instead', () => {
    const s = sprint();
    const asked = proposeMove(s, ben(s).id, { kind: 'pull', itemId: spare(s).id }, 'Taking it.');
    const no = declineMove(asked);
    expect((no.chat ?? []).length, 'a thread of things that did not happen')
      .toBe((s.chat ?? []).length);
    expect((no.decisions ?? []).some((d) => /told not yet/i.test(d.what)),
      'turning work down left no trace at all').toBe(true);
  });

  it('leaves it where it is when you say not yet', () => {
    const s = sprint();
    const card = spare(s);
    const no = declineMove(proposeMove(s, ben(s).id, { kind: 'pull', itemId: card.id }, 'Taking it.'));
    expect(no.backlog.find((it) => it.id === card.id)!.started, 'not yet moved the card anyway').toBeFalsy();
    expect(waitingOnYou(no)).toBe(false);
  });

  it('does not ask again about the same card today', () => {
    // "Not yet" asked again a second later is not an answer, it is a nag.
    const s = sprint();
    const card = spare(s);
    const move = { kind: 'pull' as const, itemId: card.id };
    const no = declineMove(proposeMove(s, ben(s).id, move, 'Taking it.'));
    expect(wasTurnedDown(no, ben(s).id, move)).toBe(true);
    expect(waitingOnYou(proposeMove(no, ben(s).id, move, 'Taking it.')),
      'he asked again about the card you had just turned down').toBe(false);
  });

  it('may ask again tomorrow', () => {
    // "Not yet" is about today. A colleague who could never ask twice would run out of things to
    // offer, and the Sprint Backlog with them.
    const s = sprint();
    const move = { kind: 'pull' as const, itemId: spare(s).id };
    const no = declineMove(proposeMove(s, ben(s).id, move, 'Taking it.'));
    expect(wasTurnedDown(endDay(no), ben(s).id, move), 'yesterday’s no still stands').toBe(false);
  });
});

describe('the day, while somebody is waiting on you', () => {
  it('holds, so reading the question costs nothing', () => {
    const s = sprint();
    const asked = proposeMove(s, ben(s).id, { kind: 'pull', itemId: spare(s).id }, 'Taking it.');
    let ticked = asked;
    for (let i = 0; i < 10; i += 1) ticked = tickDay(ticked);
    expect(ticked.daySecondsLeft, 'the day ran down while you were reading').toBe(asked.daySecondsLeft);
  });

  it('runs again once it is answered', () => {
    // The control: without it the test above passes on a clock that never runs at all.
    const s = sprint();
    const answered = declineMove(proposeMove(s, ben(s).id, { kind: 'pull', itemId: spare(s).id }, 'Taking it.'));
    expect(tickDay(answered).daySecondsLeft, 'the clock never restarted')
      .toBeLessThan(answered.daySecondsLeft);
  });
});

describe('which moves have to be agreed', () => {
  it('is the ones that move a card between columns', () => {
    expect([...ASKS_FIRST].sort()).toEqual(['FINISH_ITEM', 'SET_FORECAST', 'START_ITEM']);
    // Lending a hand is not one: it moves nobody's card, and stopping to agree it would turn the
    // WIP-limit lesson it exists to teach into an interruption.
    expect(ASKS_FIRST.has('LEND_A_HAND')).toBe(false);
  });

  it('names each of them as a move that can be written down', () => {
    // A set with a type in it and no shape here would simply go through unasked, which is the one
    // way these two can drift apart.
    for (const type of ASKS_FIRST) {
      const action = type === 'SET_FORECAST' ? { type, ids: ['a', 'b'] } : { type, id: 'a' };
      expect(asProposed(action), `${type} is asked for and cannot be written down`).toBeTruthy();
    }
    expect(asProposed({ type: 'RUN_DAILY_SCRUM' }), 'an event was mistaken for a card movement').toBeNull();
  });
});

describe('the beat', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const run = (state: ZooGameState, alongside: ScrumTeamMember[]) => {
    const sent: ZooAction[] = [];
    renderHook(() => useAiSeats({ state, drivesClock: true,
      sendAs: (_s: SeatName, a: ZooAction) => { sent.push(a); } } as never, [], { alongside }));
    act(() => { vi.advanceTimersByTime(6000); });
    return sent;
  };

  it('does nothing at all while a card is held up', () => {
    const s = sprint();
    const waiting = proposeMove(startItem(s, spare(s).id), ben(s).id,
      { kind: 'pull', itemId: spare(s).id }, 'Taking it.');
    expect(run(waiting, [ben(s)]), 'the team carried on while you were being asked').toEqual([]);
  });
});

describe('the rail', () => {
  const rail = (s: ZooGameState, on: { agree?: () => void; decline?: () => void } = {}) => render(
    <MemoryRouter>
      <ActionRail state={s} seat={null} onAgreeMove={on.agree ?? (() => {})}
        onDeclineMove={on.decline ?? (() => {})} onStartItem={() => {}} />
    </MemoryRouter>,
  );
  const held = (s: ZooGameState) => proposeMove(s, ben(s).id,
    { kind: 'pull', itemId: spare(s).id }, 'Nothing of mine left, so I will take the Toilets next.');

  it('asks in the Developer’s own name, in their own words', () => {
    const s = held(sprint());
    const { container } = rail(s);
    expect(container.textContent).toMatch(new RegExp(ben(s).name));
    expect(container.textContent).toMatch(/I will take the Toilets next/);
  });

  it('offers both answers, and moves nothing by itself', () => {
    const agree = vi.fn(); const decline = vi.fn();
    const { container } = rail(held(sprint()), { agree, decline });
    const press = (label: RegExp) => {
      const b = [...container.querySelectorAll('button')].find((x) => label.test(x.textContent ?? ''));
      expect(b, `nothing to press for ${label}`).toBeTruthy();
      fireEvent.click(b!);
    };
    press(/Yes, take it/);
    expect(agree).toHaveBeenCalled();
    press(/Not yet/);
    expect(decline).toHaveBeenCalled();
  });

  it('says whose call this would really be', () => {
    // A game that asks your permission for a colleague's pull, and says nothing about it, has
    // taught that somebody has to approve a pull. Nobody does.
    const { container } = rail(held(sprint()));
    expect(container.textContent, 'the game lets a pace control pass for a rule of Scrum')
      .toMatch(/the Developers' to settle between them/);
    expect(container.textContent, 'it does not say the clock is held').toMatch(/clock is held/i);
  });

  it('offers nothing else while the question is open', () => {
    // The day is held and nobody is doing anything, so anything behind it is a thing you cannot
    // act on yet. The rail shows one thing at a time and counts the rest, so "nothing else" is
    // read off the count rather than off the words: the pull prompt would be one chevron away.
    const open = held(sprint());
    const { container } = rail(open);
    expect(container.textContent, 'the board offered you work while somebody waited on you')
      .not.toMatch(/What will you pull next/);
    expect(container.textContent, 'something else was waiting behind the question').not.toMatch(/\d+ more/);
    // The control: with nothing held up, the board does offer you work.
    expect(rail(sprint()).container.textContent, 'the rail never offers work at all')
      .toMatch(/What will you pull next/);
  });
});
