import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS, AI_DEV_FLOOR } from './config';
import {
  startItem, yourDev, otherDevs, heldBy, stillBuilding, tickDay, secondsPerPoint,
  devSecondsPerPoint, workOwed, yourSecondsPerPoint,
} from './engine';
import { aiDevTurn } from './aiSeats';
import { SprintBoard } from './SprintBoard';
import type { ZooGameState, BacklogItem, ScrumTeamMember } from './types';

// Three Developers, working at the same time.
//
// The Developers were a collective noun: one seat, one set of hands, and the game either played
// all of it or none of it. So a player sitting in the Developers' seat worked alone on a board
// that said three people were on the team - "I was expecting to see other Devs (AI agents)
// building things in parallel", which is the obvious thing to expect of it.
//
// You hold the first of the three. The game holds the rest, and each of them pulls a card, takes
// real time over it and builds it beside you. The rules that make that worth watching rather than
// alarming are all here: they work at your pace and never faster than the forecast, they never
// touch the card you took, and they leave you somewhere to work.

/** A Sprint with several things that can be started on their own, and room to start them. */
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  // An animal waits for its habitat, and an epic is not work, so neither can be pulled on its own.
  const ready = base.backlog
    .filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 5);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, wipLimit: 0, forecastPoints: 20,
    committedIds: ready.map((it) => it.id),
    // Already placed. Where a habitat goes is a product decision and they ask before taking it,
    // which is its own rule with its own test; this is about pulling and building.
    backlog: base.backlog.map((it) => (ready.some((r) => r.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, pos: { x: 200, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};

/** Run a Developer's turn and apply whatever it decides, as the beat upstairs would. */
const theirTurn = (s: ZooGameState, dev: { id: string; name: string }): ZooGameState => {
  const move = aiDevTurn(s, dev);
  if (!move) return s;
  const a = move.action;
  if (a.type === 'START_ITEM') return startItem(s, a.id, 'developer', a.devId);
  // Building is the reducer's job (it works the design out), so stand in for it: what this test
  // cares about is WHEN they build, not what they build.
  if (a.type === 'BUILD_ITEM') {
    return { ...s, backlog: s.backlog.map((it) => (it.id === a.id
      ? { ...it, design: { parts: {}, colors: {} } as never } : it)) };
  }
  return s;
};

const pulled = (s: ZooGameState): BacklogItem[] =>
  s.backlog.filter((it) => it.status === 'committed' && it.started);

describe('the Developers the game plays beside you', () => {
  it('are everybody on the team except you', () => {
    const s = sprint();
    const you = yourDev(s)!;
    const them = otherDevs(s);
    expect(them.length, 'a three-person team left nobody to work beside you').toBe(2);
    expect(them.map((d) => d.id), 'the game is playing you as well as them').not.toContain(you.id);
    expect([you, ...them].map((d) => d.id).sort(), 'somebody on the team is neither you nor them')
      .toEqual(s.team.developers.map((d) => d.id).sort());
  });

  it('each take their own card, so two of them are working at once', () => {
    let s = sprint();
    const [ben, cara] = otherDevs(s);
    s = theirTurn(s, ben);
    s = theirTurn(s, cara);
    const theirs = pulled(s);
    expect(theirs.length, 'only one card was taken: they are still one set of hands').toBe(2);
    expect(new Set(theirs.map((it) => it.pulledBy)).size, 'both cards went to the same Developer').toBe(2);
    expect(theirs.map((it) => it.pulledBy).sort(), 'somebody took a card who was not one of them')
      .toEqual([ben.id, cara.id].sort());
  });

  it('are building them at the same time, not one after the other', () => {
    let s = sprint();
    const [ben, cara] = otherDevs(s);
    s = theirTurn(s, ben);
    s = theirTurn(s, cara);
    expect(pulled(s).length, 'nobody took a card, so there is nothing to tick').toBe(2);
    const before = pulled(s).map((it) => it.owedSeconds!);
    s = tickDay(s);
    const after = pulled(s).map((it) => it.owedSeconds!);
    expect(after, 'a second of the day only moved one card on, so they are taking turns')
      .toEqual(before.map((n) => n - 1));
  });

  it('do not finish a card until the time it costs has been spent', () => {
    let s = sprint();
    const [ben] = otherDevs(s);
    // The smallest card on the board, so the work fits inside one day and this is about the time
    // being spent rather than about the day running out.
    const small = s.backlog.filter((it) => it.status === 'committed')
      .sort((a, z) => a.estimate - z.estimate)[0];
    s = startItem(s, small.id, 'developer', ben.id);
    const card = heldBy(s, ben.id)!;
    expect(card.owedSeconds, 'their card was free, so it would land the instant they took it')
      .toBeGreaterThan(1);
    expect(card.owedSeconds, 'the card cannot be finished in a day, so this proves nothing')
      .toBeLessThan(s.daySecondsLeft);

    // Their turn, over and over, while the clock stands still: nothing should land.
    for (let i = 0; i < 20; i += 1) s = theirTurn(s, ben);
    expect(heldBy(s, ben.id), 'the work was done without any of the day being spent').toBeTruthy();

    // Now spend the day.
    for (let i = 0; i < card.owedSeconds!; i += 1) s = tickDay(s);
    expect(stillBuilding(s.backlog.find((it) => it.id === card.id)!),
      'the time was spent and the card still owes some').toBeNull();
    s = theirTurn(s, ben);
    expect(heldBy(s, ben.id), 'the time was spent and they still have not built it').toBeUndefined();
  });

  it('never build the card you took', () => {
    // The sharpest of these. A started card with no design used to be anybody's to build, and the
    // Developers played by the game would find yours and finish it - which is the game playing the
    // game for you.
    let s = sprint();
    const [ben, cara] = otherDevs(s);
    const mine = s.backlog.find((it) => it.status === 'committed')!;
    s = startItem(s, mine.id);                                  // you took it, and have not built it
    expect(s.backlog.find((it) => it.id === mine.id)!.pulledBy).toBe(yourDev(s)!.id);

    for (let i = 0; i < 30; i += 1) {
      s = theirTurn(s, ben);
      s = theirTurn(s, cara);
      s = tickDay(s);
    }
    expect(s.backlog.find((it) => it.id === mine.id)!.design,
      'somebody else built the card you were working on').toBeUndefined();
  });

  it('leave you somewhere to work when the limit would shut you out', () => {
    // Three Developers and a limit of three comes out even. Tighten it to two - which is the team
    // deciding to finish fewer things, and a good decision - and two colleagues working flat out
    // would take both before you had read the first card.
    // Setting a limit yourself in Sprint 1 is what puts it in force - see `revealed`.
    let s = sprint({ wipLimit: 2 });
    const [ben, cara] = otherDevs(s);
    for (let i = 0; i < 6; i += 1) { s = theirTurn(s, ben); s = theirTurn(s, cara); }
    expect(pulled(s).length, 'they filled the board and left you nothing to pull').toBe(1);

    // ...and once you are working, the last slot is theirs to take.
    const free = s.backlog.find((it) => it.status === 'committed' && !it.started)!;
    s = startItem(s, free.id);
    s = theirTurn(s, ben);
    expect(pulled(s).length, 'they are holding a slot open for somebody who is already busy').toBe(2);
  });
});

describe('the second pair of eyes on their work', () => {
  /** Cara's card, built, its plan ticked off, waiting only on a review. */
  const reviewed = (s: ZooGameState, by: { id: string }, turn: ScrumTeamMember) => {
    const card = s.backlog.find((it) => it.status === 'committed')!;
    const after = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === card.id
        ? { ...it, status: 'committed' as const, started: true, pulledBy: by.id, assignedDevs: [by.id],
          design: { parts: {}, colors: {} } as never,
          tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })) }
        : it)),
    } as ZooGameState;
    return { card, move: aiDevTurn(after, turn) };
  };

  it('is one of them before it is you', () => {
    // It used to take the first Developer on the team who was not already on the card - which is
    // YOU. The game put your name against a review you had not done, on somebody else's work,
    // which is the same thing as a Product Owner played by the game accepting work nobody had
    // looked at. Reported about Priya, and true of this too.
    const s = sprint();
    const [ben, cara] = otherDevs(s);
    // Cara's own turn, on Cara's own card: she cannot review it herself, so the question is who
    // she asks. This is the live case - she finishes a card and the very next beat is hers.
    const { card, move } = reviewed(s, cara, cara);
    expect(move?.action, 'nobody offered the second pair of eyes the Definition of Done asks for')
      .toMatchObject({ type: 'ASSIGN_DEV', itemId: card.id });
    expect((move!.action as { devId: string }).devId,
      'the game signed YOU up to review a colleague\'s work without asking').toBe(ben.id);
  });

  it('is the one doing the looking, where they are free to', () => {
    const s = sprint();
    const [ben, cara] = otherDevs(s);
    const { move } = reviewed(s, cara, ben);
    expect((move!.action as { devId: string }).devId,
      'Ben looked it over and put somebody else\'s name on it').toBe(ben.id);
  });

  it('is you when there is genuinely nobody else', () => {
    // The fallback stands. A card that can never meet the Definition of Done because everybody is
    // busy is a stalled board, and a stalled board teaches nothing - which is the bug this rule
    // was written for, on day 3 of Sprint 3 with the Sprint Goal at risk over it.
    const alone = { ...sprint(), team: { ...sprint().team, developers: sprint().team.developers.slice(0, 2) } } as ZooGameState;
    const [cara] = otherDevs(alone);
    const { move } = reviewed(alone, cara, cara);
    expect((move!.action as { devId: string }).devId, 'the card is stuck with nobody able to review it')
      .toBe(yourDev(alone)!.id);
  });
});

describe('how fast they go', () => {
  it('is never faster than the forecast, and never slower than the floor', () => {
    const s = sprint();
    const forecast = secondsPerPoint(s);
    for (const dev of otherDevs(s)) {
      const pace = devSecondsPerPoint(s, dev.id);
      expect(pace, `${dev.name} is outrunning the forecast the team gave`).toBeGreaterThanOrEqual(forecast);
      expect(pace, `${dev.name} is slower than the floor, which punishes a player for reading`)
        .toBeLessThanOrEqual(forecast / AI_DEV_FLOOR + 0.001);
    }
  });

  it('is two different people, not one drawn twice', () => {
    const s = sprint();
    const [ben, cara] = otherDevs(s);
    expect(devSecondsPerPoint(s, ben.id), 'both colleagues work at exactly the same speed')
      .not.toBe(devSecondsPerPoint(s, cara.id));
  });

  it('is the same game every time, so a trainer can replay a seed', () => {
    const [ben] = otherDevs(sprint());
    expect(devSecondsPerPoint(sprint(), ben.id)).toBe(devSecondsPerPoint(sprint(), ben.id));
  });

  it('slows to your pace when you are slower than the forecast', () => {
    // Your pace is measured off what your own Developer has actually finished this Sprint. Here
    // you have finished one small card and most of the day has gone, so you are well behind the
    // forecast - and they should come back towards you rather than finish the Sprint around you.
    const base = sprint();
    const you = yourDev(base)!;
    const small = base.backlog.filter((it) => it.status === 'committed')
      .sort((a, z) => a.estimate - z.estimate)[0];
    const slow = {
      ...base, daySecondsLeft: 5,
      backlog: base.backlog.map((it) => (it.id === small.id
        ? { ...it, status: 'done' as const, started: true, pulledBy: you.id } : it)),
    } as ZooGameState;
    const [ben] = otherDevs(slow);
    expect(devSecondsPerPoint(slow, ben.id), 'they kept to the forecast while you fell behind')
      .toBeGreaterThan(secondsPerPoint(slow));
  });

  it('measures YOUR pace, not their own', () => {
    // They pace themselves off the player. Measured off the whole team it would feed back on
    // itself: two colleagues finish a card, that counts as "the pace", so they speed up, so they
    // finish faster, and the floor that exists to wait for a reader never binds. The player has
    // finished nothing here, so there is no pace to go on and the forecast stands in for it.
    const base = sprint();
    const [ben] = otherDevs(base);
    const theirs = base.backlog.filter((it) => it.status === 'committed')[0];
    const after = {
      ...base, daySecondsLeft: base.daySecondsLeft - 1,
      backlog: base.backlog.map((it) => (it.id === theirs.id
        ? { ...it, status: 'done' as const, started: true, pulledBy: ben.id } : it)),
    } as ZooGameState;
    expect(yourSecondsPerPoint(after),
      'a card one of them finished was counted as how fast YOU are going').toBeNull();
  });

  it('holds to the forecast even when you are faster than it', () => {
    // The ceiling is a promise about the forecast rather than about you. A team that beats its own
    // forecast every Sprint because two thirds of it are tireless has learnt nothing about
    // forecasting, which is most of what Sprint Planning is for - so however fast you go, they do
    // not go faster than what the Developers said they could finish.
    const base = sprint();
    const you = yourDev(base)!;
    const committed = base.backlog.filter((it) => it.status === 'committed');
    // Everything finished, one second into the day: far faster than anybody forecast.
    const fast = {
      ...base, daySecondsLeft: base.daySecondsLeft - 1,
      backlog: base.backlog.map((it) => (committed.some((c) => c.id === it.id)
        ? { ...it, status: 'done' as const, started: true, pulledBy: you.id } : it)),
    } as ZooGameState;
    expect(yourSecondsPerPoint(fast)!, 'the setup is not actually faster than the forecast')
      .toBeLessThan(secondsPerPoint(fast));
    for (const dev of otherDevs(fast)) {
      expect(devSecondsPerPoint(fast, dev.id), `${dev.name} sped up past the forecast to keep up with you`)
        .toBe(secondsPerPoint(fast));
    }
  });

  it('prices a big card as more of the Sprint than a small one', () => {
    const s = sprint();
    const [ben] = otherDevs(s);
    const items = s.backlog.filter((it) => it.status === 'committed')
      .sort((a, z) => a.estimate - z.estimate);
    const small = items[0];
    const big = items[items.length - 1];
    if (big.estimate === small.estimate) return;     // nothing to compare in this seed
    expect(workOwed(s, big, ben.id), 'every card costs the same, so points mean nothing')
      .toBeGreaterThan(workOwed(s, small, ben.id));
  });
});

const noop = () => {};
/** The board, with the handlers it insists on. */
const board = (state: ZooGameState) => (
  <MemoryRouter>
    <SprintBoard state={state}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>
);

describe('the board while they work', () => {
  it('says who is on it and how far through they are', () => {
    let s = sprint();
    const [ben] = otherDevs(s);
    const small = s.backlog.filter((it) => it.status === 'committed')
      .sort((a, z) => a.estimate - z.estimate)[0];
    s = startItem(s, small.id, 'developer', ben.id);
    const card = heldBy(s, ben.id)!;
    // Part way through, so the bar has something to draw.
    for (let i = 0; i < Math.floor(card.owedSeconds! / 2); i += 1) s = tickDay(s);

    const { container } = render(board(s));
    const bar = container.querySelector('[data-part="being-built"]');
    expect(bar, 'nothing on the board says the card is being built').toBeTruthy();
    // Who is on it is the card's own "what is left" line, so the board says it once.
    const onBoard = bar!.closest('[data-part="board-card"]')!;
    expect(onBoard.textContent, 'the card does not say who is building it').toContain(`${ben.name} is building it`);
    expect(onBoard.textContent, 'it is telling you to go and build a colleague\'s card')
      .not.toContain('Next: build it on the park');
    const fill = bar!.querySelector<HTMLElement>('[data-part="built-so-far"]')!;
    const pct = Number.parseFloat(fill.style.width);
    expect(pct, 'the bar is empty half way through the work').toBeGreaterThan(20);
    expect(pct, 'the bar is full half way through the work').toBeLessThan(80);
  });

  it('draws nothing on a card nobody is waiting for', () => {
    const { container } = render(board(sprint()));
    expect(container.querySelector('[data-part="being-built"]'),
      'a card nobody has taken says somebody is building it').toBeNull();
  });
});
