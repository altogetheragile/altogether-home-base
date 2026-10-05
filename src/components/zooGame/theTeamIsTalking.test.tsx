import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS } from './config';
import {
  say, speaking, askIfDue, answerQuestion, guessUnanswered, startNextSprint, tickDay,
  otherDevs, QUESTION_PATIENCE, CHAT_KEPT,
} from './engine';
import { reducer } from './useZooGame';
import { aiDevTurn } from './aiSeats';
import { useAiSeats } from './useZooSession';
import type { SeatName } from './useZooSessions';
import { TeamChat } from './TeamChat';
import { SEAT } from './seats';
import type { ZooGameState, ZooAction, ScrumTeamMember } from './types';

// The team, talking.
//
// The game was always full of people saying things - a Developer takes a card and says so, Priya
// hands a decision back and says why, a question is put with a clock on it - and every one of
// those lines flashed up on a card for a few seconds and was gone. In a shared session only: a
// learner playing alone never saw a word of it.
//
// "I was expecting to see the SMS like chat between the team." So the lines are kept, in game
// state, where a reload does not wipe them, every browser of a shared session reads the same
// thread, and the Retrospective still has day 2 to quote from.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const enc = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, committedIds: [enc.id],
    backlog: base.backlog.map((it) => (it.id === enc.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true,
        assignedDevs: [base.team.developers[0].id] }
      : it)),
    ...over,
  } as ZooGameState;
};

const texts = (s: ZooGameState) => (s.chat ?? []).map((m) => m.text);
/** The newest message, which is the one every one of these is about. */
const last = (s: ZooGameState) => (s.chat ?? [])[(s.chat ?? []).length - 1];
const lastText = (s: ZooGameState) => last(s)?.text;

describe('what gets said is kept', () => {
  it('holds the line, who said it and the day they said it on', () => {
    const s = say(sprint({ dayNumber: 2 }), { who: 'product_owner', from: 'Priya', text: 'Your call.' });
    expect(s.chat, 'nothing was kept, so the conversation is still a thing that flashes past').toHaveLength(1);
    expect(s.chat![0]).toMatchObject({ who: 'product_owner', from: 'Priya', text: 'Your call.', day: 2 });
  });

  it('does not say the same thing twice in a row', () => {
    const line = { who: 'developer' as const, from: 'Ada', text: 'Taking the Lion Enclosure next.' };
    const s = say(say(sprint(), line), line);
    expect(s.chat, 'the same sentence from the same person is two messages').toHaveLength(1);
  });

  it('replaces a run of one person on one card rather than piling it up', () => {
    // Seats played by the game work at about a move a second. A team that says "Lay the ground -
    // done", "Lay the water - done", "Lay the shelter - done" fills the panel with one card's
    // housekeeping, and the newest of those is the only one anybody wanted.
    let s = sprint();
    for (const t of ['Lay the ground - done.', 'Lay the water - done.', 'Plant it - done.']) {
      s = say(s, { who: 'developer', from: 'Ada', text: t, itemId: 'lion' });
    }
    expect(s.chat, 'three steps on one card are three messages').toHaveLength(1);
    expect(texts(s)[0], 'the run kept the oldest line rather than the newest').toBe('Plant it - done.');
  });

  it('keeps two people apart even on the same card', () => {
    let s = say(sprint(), { who: 'developer', from: 'Ada', text: 'Ground in.', itemId: 'lion' });
    s = say(s, { who: 'developer', from: 'Ben', text: 'I will take the fence.', itemId: 'lion' });
    expect(s.chat, 'Ben spoke over Ada because they were talking about the same card').toHaveLength(2);
  });

  it('keeps only the last of a long Sprint', () => {
    let s = sprint();
    for (let i = 0; i < CHAT_KEPT + 20; i += 1) {
      s = say(s, { who: 'developer', from: i % 2 ? 'Ada' : 'Ben', text: `line ${i}` });
    }
    expect(s.chat, 'the thread grows without end, and all of it is written to the database')
      .toHaveLength(CHAT_KEPT);
    expect(lastText(s)).toBe(`line ${CHAT_KEPT + 19}`);
  });

  it('is this Sprint’s conversation, and starts again with the next one', () => {
    const s = say(sprint(), { who: 'developer', from: 'Ada', text: 'Something from Sprint 1.' });
    expect(startNextSprint(s, '').chat, 'last Sprint’s chat followed the team into the new one')
      .toEqual([]);
  });
});

describe('who is talking', () => {
  it('is read off the accountability the move was taken by', () => {
    const s = sprint();
    expect(speaking(s, 'product_owner')).toEqual({ who: 'product_owner', from: s.team.productOwner.name });
    expect(speaking(s, 'scrum_master')).toEqual({ who: 'scrum_master', from: s.team.scrumMaster.name });
  });

  it('is you when nothing says otherwise, because only a seat names itself', () => {
    // An action carries `by` when a seat took it and carries nothing when the move is simply
    // yours. That absence is the whole signal, and it is why no new field was needed.
    expect(speaking(sprint(), undefined)).toEqual({ who: 'you', from: 'You' });
  });
});

describe('the question channel, out loud', () => {
  it('puts the question in the thread, by name', () => {
    const s = askIfDue(sprint());
    expect(texts(s), 'the question exists as a row on a rail and nowhere else')
      .toContainEqual(expect.stringMatching(/Rounded or square/));
    expect(last(s)!.from, 'nobody asked it - it just appeared')
      .toBe(s.team.developers[0].name);
  });

  it('puts YOUR answer in the thread, on your side of it', () => {
    const asked = askIfDue(sprint());
    const answered = answerQuestion(asked, asked.questions![0].id, 'theirs');
    expect(last(answered)).toMatchObject({ who: 'you', text: 'Your call' });
  });

  it('does not put Priya’s answer in twice', () => {
    // A seat played by the game says its own line a beat before it acts - "Your call. How it gets
    // built is yours" - and the label of the button it pressed underneath said the same thing
    // again in a second bubble.
    const asked = askIfDue(sprint());
    const before = (asked.chat ?? []).length;
    const answered = answerQuestion(asked, asked.questions![0].id, 'theirs', 'product_owner');
    expect(answered.chat, 'her own answer is echoed back as a second bubble').toHaveLength(before);
  });

  it('says it out loud when nobody answers and the Developers decide', () => {
    const asked = askIfDue(sprint());
    const waited = { ...asked, daySecondsLeft: asked.daySecondsLeft - QUESTION_PATIENCE } as ZooGameState;
    const after = guessUnanswered(waited);
    expect(lastText(after), 'the silence cost somebody the decision and the thread says nothing')
      .toMatch(/Nobody answered/);
  });
});

describe('taking a card', () => {
  it('is said by the Developer who took it', () => {
    const s = sprint();
    const [ben] = otherDevs(s);
    const free = s.backlog.find((it) => it.status === 'backlog' && it.category === 'path')!;
    const ready = { ...s, backlog: s.backlog.map((it) => (it.id === free.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
    const after = reducer(ready, { type: 'START_ITEM', id: free.id, by: 'developer', devId: ben.id });
    expect(last(after)).toMatchObject({ who: 'developer', from: ben.name });
    expect(lastText(after)).toContain(free.name);
  });

  it('is said by you when you took it', () => {
    const s = sprint();
    const free = s.backlog.find((it) => it.status === 'backlog' && it.category === 'path')!;
    const ready = { ...s, backlog: s.backlog.map((it) => (it.id === free.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
    const after = reducer(ready, { type: 'START_ITEM', id: free.id });
    expect(last(after)).toMatchObject({ who: 'you', from: 'You' });
  });

  it('says nothing when the card could not be taken', () => {
    // A move the engine refuses is not a thing that happened, and a thread that announces refused
    // moves is a thread nobody can trust.
    const s = sprint();
    const nothing = s.backlog.find((it) => it.status === 'backlog')!;
    const after = reducer(s, { type: 'START_ITEM', id: nothing.id });
    expect(after.chat ?? [], 'the team announced work it never started').toHaveLength(0);
  });
});

describe('nobody says their own name', () => {
  // They used to - "Cara: taking Signposts next" - from the days when a line had nowhere to say
  // who was speaking. The bubble is signed now, so the prefix left Cara talking about herself in
  // the third person.
  it('because the bubble is already signed', () => {
    const s = sprint();
    const [ben] = otherDevs(s);
    const free = s.backlog.filter((it) => it.status === 'backlog' && it.category === 'path');
    const ready = { ...s, wipLimit: 0, backlog: s.backlog.map((it) => (free.some((f) => f.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
    const names = s.team.developers.map((d) => d.name);
    // Every line any of them would say, over a Sprint's worth of states.
    let walk = ready;
    const lines: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      // Time passing, without spending a day on it: the owed seconds are what the day's clock
      // counts down, and this test is about the words rather than about the pacing.
      walk = { ...walk, backlog: walk.backlog.map((it) => ({ ...it, owedSeconds: 0 })) };
      const move = aiDevTurn(walk, ben);
      if (!move) break;
      lines.push(move.says);
      walk = reducer(walk, move.action);
    }
    expect(lines.length, 'nobody said anything, so nothing is being tested').toBeGreaterThan(2);
    for (const line of lines) {
      for (const name of names) {
        expect(line, `a Developer said their own name: "${line}"`).not.toContain(name);
      }
    }
  });
});

describe('the beat, putting it in the thread', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** One pass of the table, with nothing applied: just what it tried to send. */
  const run = (state: ZooGameState, alongside: ScrumTeamMember[]) => {
    const sent: ZooAction[] = [];
    const session = { state, drivesClock: true,
      sendAs: (_seat: SeatName, action: ZooAction) => { sent.push(action); } };
    renderHook(() => useAiSeats(session as never, [], { alongside }));
    act(() => { vi.advanceTimersByTime(4000); });
    return sent;
  };

  it('says what a seat played by the game is about to do', () => {
    // These lines existed long before there was anywhere to keep them. They were rendered in a
    // shared session only, on a card that vanished after a few seconds.
    const s = sprint();
    const [ben] = otherDevs(s);
    // Ben's card, and the time it cost already spent, so the next thing he does is build it.
    const his = { ...s, backlog: s.backlog.map((it) => (it.started
      ? { ...it, pulledBy: ben.id, assignedDevs: [ben.id], owedSeconds: 0 } : it)) } as ZooGameState;
    const sent = run(his, [ben]);
    expect(sent.some((a) => a.type === 'BUILD_ITEM'), 'he built nothing, so nothing is being tested')
      .toBe(true);
    const said = sent.filter((a) => a.type === 'SAY');
    expect(said.length, 'the team worked in silence').toBeGreaterThan(0);
    expect(said[0]).toMatchObject({ who: 'developer', from: ben.name });
  });

  it('leaves a pull to the reducer, which knows whether it landed', () => {
    // A pull the engine refuses - no room under the WIP limit, a habitat not built yet - is not a
    // thing that happened, and a thread announcing refused moves is a thread nobody can trust. The
    // reducer is the only one that knows, so it does the talking and the beat keeps quiet.
    const s = sprint();
    const [ben] = otherDevs(s);
    const free = s.backlog.filter((it) => it.status === 'backlog' && it.category === 'path');
    const ready = { ...s, wipLimit: 0,
      backlog: s.backlog.map((it) => (free.some((f) => f.id === it.id)
        ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)) } as ZooGameState;
    const sent = run(ready, [ben]);
    const pull = sent.findIndex((a) => a.type === 'START_ITEM');
    expect(pull, 'nobody pulled anything, so nothing is being tested').toBeGreaterThanOrEqual(0);
    expect(sent.filter((a) => a.type === 'SAY'),
      'the pull was announced twice: once by the beat and once by the reducer').toHaveLength(0);
  });
});

describe('the panel', () => {
  const chat = (s: ZooGameState) => render(
    <MemoryRouter><TeamChat state={s} rail={<div data-part="action-rail">the rail</div>} /></MemoryRouter>,
  ).container;

  it('draws a bubble per message, in the speaker’s own colour', () => {
    let s = say(sprint(), { who: 'developer', from: 'Ada', text: 'Rounded or square?' });
    s = say(s, { who: 'product_owner', from: 'Priya', text: 'Your call.' });
    const c = chat(s);
    const bubbles = [...c.querySelectorAll('[data-part="chat-message"]')];
    expect(bubbles.length, 'the thread is not drawn').toBe(2);
    const fill = (n: Element) => n.querySelector('svg [fill]')?.getAttribute('fill')?.toLowerCase();
    expect(fill(bubbles[0]), 'a Developer is not drawn in the Developers’ colour')
      .toBe(SEAT.developers.hex.toLowerCase());
    expect(fill(bubbles[1]), 'the Product Owner is not drawn in the Product Owner’s colour')
      .toBe(SEAT.productOwner.hex.toLowerCase());
  });

  it('puts you on one side and everybody else on the other', () => {
    let s = say(sprint(), { who: 'developer', from: 'Ada', text: 'Rounded or square?' });
    s = say(s, { who: 'you', from: 'You', text: 'Your call' });
    const bubbles = [...chat(s).querySelectorAll('[data-part="chat-message"]')];
    expect(bubbles[0].className, 'everybody is on the same side, so it is a list and not a conversation')
      .not.toContain('flex-row-reverse');
    expect(bubbles[1].className, 'your own messages are not on your own side').toContain('flex-row-reverse');
  });

  it('breaks the thread up by day', () => {
    let s = say(sprint({ dayNumber: 1 }), { who: 'developer', from: 'Ada', text: 'Monday.' });
    s = say({ ...s, dayNumber: 2 }, { who: 'developer', from: 'Ada', text: 'Tuesday.' });
    const days = [...chat(s).querySelectorAll('[data-part="chat-day"]')].map((n) => n.textContent);
    expect(days, 'two days of a Sprint run together with nothing between them')
      .toEqual(['Day 1', 'Day 2']);
  });

  it('keeps the rail under it, because a reply is a move in the game', () => {
    const c = chat(sprint());
    expect(c.querySelector('[data-part="action-rail"]'),
      'the chat replaced the one place the game asks you for things').toBeTruthy();
  });

  it('says so when nobody has said anything yet', () => {
    expect(chat(sprint()).textContent).toContain('Nothing said yet');
  });
});

describe('a day of it', () => {
  it('fills as the Sprint runs, without anybody rendering anything', () => {
    // The thread is game state, so it is built by the reducer rather than by a component - which
    // is what makes it survive a reload and read the same in every browser of a session.
    let s = sprint();
    for (let i = 0; i < 5; i += 1) s = tickDay(s);
    expect((s.chat ?? []).length, 'a day went by and the team said nothing').toBeGreaterThan(0);
  });
});
